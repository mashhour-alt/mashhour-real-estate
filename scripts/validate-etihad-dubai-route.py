import json
import math
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROUTE_PATH = Path("public/data/etihad-rail-dubai.json")
BOUNDARY_PATH = Path("public/data/dubai-emirate-boundary.geojson")
REPORT_PATH = Path("public/data/etihad-rail-dubai-validation.json")

FGIC_QUERY = (
    "https://stgnsdi.fgic.gov.ae/publishing/rest/services/"
    "Functional_Areas/Functional_Areas/MapServer/23/query"
)

# Any single railway edge larger than this is suspicious.
MAX_EDGE_GAP_KM = 1.25

# Densify edges so a line cannot leave Dubai between two
# endpoints that both happen to lie inside the boundary.
DENSIFY_STEP_KM = 0.10


def fail(message):
    print(f"ERROR: {message}")
    sys.exit(1)


def haversine(a, b):
    lat1, lon1 = a
    lat2, lon2 = b

    r = 6371.0088

    p1 = math.radians(lat1)
    p2 = math.radians(lat2)

    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)

    h = (
        math.sin(dp / 2) ** 2
        + math.cos(p1)
        * math.cos(p2)
        * math.sin(dl / 2) ** 2
    )

    return 2 * r * math.asin(math.sqrt(h))


def point_on_segment(point, a, b, epsilon=1e-10):
    """
    Boundary points count as inside.
    Coordinates here are [lng, lat].
    """
    px, py = point
    ax, ay = a
    bx, by = b

    cross = (
        (px - ax) * (by - ay)
        - (py - ay) * (bx - ax)
    )

    if abs(cross) > epsilon:
        return False

    dot = (
        (px - ax) * (bx - ax)
        + (py - ay) * (by - ay)
    )

    if dot < -epsilon:
        return False

    squared = (
        (bx - ax) ** 2
        + (by - ay) ** 2
    )

    return dot <= squared + epsilon


def point_in_ring(point, ring):
    """
    Ray casting.
    point/ring coordinates are [lng, lat].
    """
    inside = False
    x, y = point

    j = len(ring) - 1

    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]

        if point_on_segment(
            point,
            [xi, yi],
            [xj, yj],
        ):
            return True

        intersects = (
            (yi > y) != (yj > y)
            and x
            < (
                (xj - xi)
                * (y - yi)
                / ((yj - yi) or 1e-30)
                + xi
            )
        )

        if intersects:
            inside = not inside

        j = i

    return inside


def point_in_polygon(point, polygon):
    if not polygon:
        return False

    outer = polygon[0]

    if not point_in_ring(point, outer):
        return False

    # Holes
    for hole in polygon[1:]:
        if point_in_ring(point, hole):
            return False

    return True


def point_in_geometry(point, geometry):
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates", [])

    if geometry_type == "Polygon":
        return point_in_polygon(
            point,
            coordinates,
        )

    if geometry_type == "MultiPolygon":
        return any(
            point_in_polygon(point, polygon)
            for polygon in coordinates
        )

    return False


def interpolate(a, b, ratio):
    lat1, lng1 = a
    lat2, lng2 = b

    return [
        lat1 + (lat2 - lat1) * ratio,
        lng1 + (lng2 - lng1) * ratio,
    ]


# ============================================================
# 1. LOAD ROUTE
# ============================================================

if not ROUTE_PATH.exists():
    fail(
        "public/data/etihad-rail-dubai.json "
        "does not exist"
    )

with ROUTE_PATH.open(
    "r",
    encoding="utf-8",
) as f:
    route = json.load(f)

segments = route.get("segments")

if not isinstance(segments, list) or not segments:
    fail("Etihad Rail route has no segments")


# ============================================================
# 2. DOWNLOAD OFFICIAL DUBAI EMIRATE BOUNDARY
# ============================================================

def fgic_query(params):
    url = (
        FGIC_QUERY
        + "?"
        + urllib.parse.urlencode(params)
    )

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent":
                "MashhourRealEstate/1.0 route-validator"
        },
    )

    with urllib.request.urlopen(
        request,
        timeout=60,
    ) as response:
        return json.load(response)


print("Loading Dubai boundary...")

if not BOUNDARY_PATH.exists():
    fail(
        "Dubai boundary file does not exist: "
        + str(BOUNDARY_PATH)
    )

try:
    with BOUNDARY_PATH.open(
        "r",
        encoding="utf-8",
    ) as f:
        boundary = json.load(f)
except Exception as exc:
    fail(
        f"Could not read Dubai boundary file: {exc}"
    )

features = boundary.get("features", [])

if not features:
    fail(
        "Dubai boundary GeoJSON contains no features"
    )

valid_boundary_features = []

for feature in features:
    geometry = feature.get("geometry") or {}
    geometry_type = geometry.get("type")

    if geometry_type in (
        "Polygon",
        "MultiPolygon",
    ):
        valid_boundary_features.append(feature)

if not valid_boundary_features:
    fail(
        "Dubai boundary file contains no Polygon "
        "or MultiPolygon geometry"
    )

features = valid_boundary_features

print(
    "Dubai boundary loaded from local file:",
    BOUNDARY_PATH,
)

print(
    "Boundary polygon features:",
    len(features),
)

# ============================================================
# 3. VALIDATE EVERY SEGMENT
# ============================================================

outside_samples = []
gap_errors = []

total_route_points = 0
checked_samples = 0
max_edge_km = 0.0

geometries = [
    feature.get("geometry", {})
    for feature in features
]


def inside_dubai(lat, lng):
    point = [lng, lat]

    return any(
        point_in_geometry(
            point,
            geometry,
        )
        for geometry in geometries
    )


for segment_index, segment in enumerate(segments):
    if not isinstance(segment, list):
        gap_errors.append({
            "segment": segment_index,
            "reason": "segment-is-not-array",
        })
        continue

    if len(segment) < 2:
        gap_errors.append({
            "segment": segment_index,
            "reason": "segment-too-short",
        })
        continue

    total_route_points += len(segment)

    for point_index, point in enumerate(segment):
        if (
            not isinstance(point, list)
            or len(point) < 2
        ):
            gap_errors.append({
                "segment": segment_index,
                "point": point_index,
                "reason": "invalid-coordinate",
            })
            continue

        lat = float(point[0])
        lng = float(point[1])

        checked_samples += 1

        if not inside_dubai(lat, lng):
            outside_samples.append({
                "segment": segment_index,
                "point": point_index,
                "lat": lat,
                "lng": lng,
                "kind": "route-point",
            })

    for point_index in range(
        len(segment) - 1
    ):
        a = segment[point_index]
        b = segment[point_index + 1]

        distance = haversine(a, b)

        max_edge_km = max(
            max_edge_km,
            distance,
        )

        if distance > MAX_EDGE_GAP_KM:
            gap_errors.append({
                "segment": segment_index,
                "fromPoint": point_index,
                "toPoint": point_index + 1,
                "distanceKm": round(
                    distance,
                    4,
                ),
                "reason": "edge-gap-too-large",
            })

        # Densify edge every 100m.
        steps = max(
            1,
            math.ceil(
                distance
                / DENSIFY_STEP_KM
            ),
        )

        for step in range(1, steps):
            ratio = step / steps

            sample = interpolate(
                a,
                b,
                ratio,
            )

            checked_samples += 1

            if not inside_dubai(
                sample[0],
                sample[1],
            ):
                outside_samples.append({
                    "segment": segment_index,
                    "fromPoint": point_index,
                    "toPoint": point_index + 1,
                    "ratio": round(
                        ratio,
                        4,
                    ),
                    "lat": round(
                        sample[0],
                        7,
                    ),
                    "lng": round(
                        sample[1],
                        7,
                    ),
                    "kind": "densified-edge",
                })


# ============================================================
# 4. STATION VALIDATION
# ============================================================

station_errors = []

station = route.get("station")

if station:
    point = station.get("point")

    if (
        not isinstance(point, list)
        or len(point) < 2
    ):
        station_errors.append({
            "reason":
                "invalid-station-coordinate",
        })
    else:
        station_inside = inside_dubai(
            float(point[0]),
            float(point[1]),
        )

        if not station_inside:
            station_errors.append({
                "reason":
                    "station-outside-dubai",
                "name":
                    station.get("name"),
                "point":
                    point,
            })


# ============================================================
# 5. CREATE VALIDATION REPORT
# ============================================================

valid = (
    len(outside_samples) == 0
    and len(gap_errors) == 0
    and len(station_errors) == 0
)

report = {
    "valid": valid,

    "validatedAt": "2026-08-16",

    "routeFile":
        "/data/etihad-rail-dubai.json",

    "boundaryFile":
        "/data/dubai-emirate-boundary.geojson",

    "boundarySource":
        "UAE FGIC - Emirate Boundary layer 23",

    "checks": {
        "segments":
            len(segments),

        "routePoints":
            total_route_points,

        "densifiedSamples":
            checked_samples,

        "maxEdgeKm":
            round(max_edge_km, 4),

        "maxAllowedEdgeKm":
            MAX_EDGE_GAP_KM,

        "outsideSamples":
            len(outside_samples),

        "gapErrors":
            len(gap_errors),

        "stationErrors":
            len(station_errors),
    },

    "outsideSamples":
        outside_samples[:100],

    "gapErrors":
        gap_errors[:100],

    "stationErrors":
        station_errors[:100],
}

REPORT_PATH.write_text(
    json.dumps(
        report,
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

print("")
print("===== ETIHAD RAIL VALIDATION =====")
print("Segments:", len(segments))
print("Route points:", total_route_points)
print("Checked samples:", checked_samples)
print(
    "Largest edge:",
    round(max_edge_km, 3),
    "km",
)
print(
    "Outside samples:",
    len(outside_samples),
)
print(
    "Gap errors:",
    len(gap_errors),
)
print(
    "Station errors:",
    len(station_errors),
)
print("")

if valid:
    print("VALIDATION PASSED")
    print(
        "Etihad Rail Dubai layer is safe to display."
    )
    sys.exit(0)

print("VALIDATION FAILED")
print(
    "Etihad Rail layer MUST NOT be displayed."
)
print(
    "Report:",
    REPORT_PATH,
)

sys.exit(2)
