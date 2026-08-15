import json
from collections import defaultdict

with open('public/data/project-catalog.json', encoding='utf-8') as f:
    catalog = json.load(f)['projects']

with open('public/data/project-live-data.json', encoding='utf-8') as f:
    live_data = json.load(f)

def area_from(value):
    if not value:
        return "Dubai"
    parts = [p.strip() for p in value.split(',') if p.strip()]
    if len(parts) > 1:
        return parts[1]
    elif parts:
        return parts[0]
    return "Dubai"

sums = defaultdict(lambda: [0.0, 0.0, 0])

for project in catalog:
    name = project.get("Project Name | اسم المشروع")
    location = project.get("Location / Community | المنطقة")
    if not name or not location:
        continue
    live = live_data.get(name)
    if not live:
        continue
    coords = live.get("coordinates")
    if not coords:
        continue
    lat = coords.get("lat")
    lng = coords.get("lng")
    if lat is None or lng is None:
        continue
    area = area_from(location)
    sums[area][0] += lat
    sums[area][1] += lng
    sums[area][2] += 1

centroids = {}
for area, (lat_sum, lng_sum, count) in sums.items():
    if count == 0:
        continue
    centroids[area] = {
        "lat": lat_sum / count,
        "lng": lng_sum / count,
        "projectCount": count,
    }

with open('public/data/area-centroids.json', 'w', encoding='utf-8') as f:
    json.dump(centroids, f, ensure_ascii=False, indent=2)

print(f"Wrote {len(centroids)} area centroids")
