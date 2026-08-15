import sys

path = "app/map/page.tsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

anchor = 'makeToggle("Metro", "metroNetworkPane");'

if anchor not in content:
    print("ANCHOR NOT FOUND")
    sys.exit(1)

addition = anchor + """
        makeToggle("Prices", "priceHeatPane");"""

content = content.replace(anchor, addition, 1)

anchor2 = "const RailToggleControl = L.Control.extend({"

if anchor2 not in content:
    print("ANCHOR2 NOT FOUND")
    sys.exit(1)

price_block = """
    const areaCentroids: Record<string, { lat: number; lng: number; projectCount: number }> =
      await fetch("/data/area-centroids.json").then((r) => r.json());
    const areaBenchmarksData: { areas: { area: string; rentPerSqFt: number }[] } =
      await fetch("/data/area-market-benchmarks.json").then((r) => r.json());

    const pricePane = leafletMap.createPane("priceHeatPane");
    pricePane.style.zIndex = "440";
    pricePane.style.display = "none";
    const priceRenderer = L.svg({ pane: "priceHeatPane", padding: 0.5 });

    const priceValues = areaBenchmarksData.areas.map((a) => a.rentPerSqFt).filter(Boolean);
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);

    const priceColor = (value: number) => {
      const ratio = maxPrice > minPrice ? (value - minPrice) / (maxPrice - minPrice) : 0.5;
      const hue = 130 - ratio * 130;
      return `hsl(${hue}, 75%, 45%)`;
    };

    areaBenchmarksData.areas.forEach((benchmark) => {
      const centroid = areaCentroids[benchmark.area];
      if (!centroid || !benchmark.rentPerSqFt) return;
      const radius = 8 + Math.min(centroid.projectCount, 40) * 0.6;

      L.circleMarker([centroid.lat, centroid.lng], {
        pane: "priceHeatPane",
        renderer: priceRenderer,
        radius,
        color: "#ffffff",
        weight: 1.5,
        fillColor: priceColor(benchmark.rentPerSqFt),
        fillOpacity: 0.75,
        interactive: true,
        className: "price-area-bubble",
      })
        .bindTooltip(
          `<strong>${escapeHtml(benchmark.area)}</strong><span>${benchmark.rentPerSqFt} AED/sqft &middot; ${centroid.projectCount} projects</span>`,
          { direction: "top", className: "metro-stop-tooltip", opacity: 1 }
        )
        .addTo(leafletMap);
    });

    """

content = content.replace(anchor2, price_block + anchor2, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("DONE")
