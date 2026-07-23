"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    L: any;
  }
}

const loadStylesheet = (href: string) => {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
};

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing?.dataset.loaded === "true") return resolve();
    const script = existing || document.createElement("script");
    script.src = src;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    if (!existing) document.head.appendChild(script);
  });

const loadMapLibraries = async () => {
  loadStylesheet("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
  loadStylesheet("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css");
  await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
  await loadScript("https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js");
  return window.L;
};

export type MapProject = {
  "Project Name | اسم المشروع": string;
  "Developer | المطور": string;
  "Location / Community | المنطقة": string | null;
  "Starting Price AED | السعر المبدئي": number | null;
};

const AREA_COORDINATES: Record<string, [number, number]> = {
  Dubai: [25.2048, 55.2708],
  "Dubai Islands": [25.2922, 55.3272],
  "Palm Deira": [25.2966, 55.3167],
  "Dubai Maritime City": [25.2492, 55.2761],
  "Maritime City": [25.2492, 55.2761],
  "Mina Rashid": [25.2638, 55.2844],
  "Al Satwa": [25.2258, 55.2723],
  "City Walk": [25.2074, 55.2626],
  "Al Wasl": [25.2027, 55.2565],
  Jumeirah: [25.2042, 55.2393],
  "Downtown Dubai": [25.1972, 55.2744],
  "Burj Khalifa": [25.1972, 55.2744],
  "Business Bay": [25.1855, 55.2632],
  DIFC: [25.2114, 55.2796],
  "Dubai Design District": [25.1873, 55.3001],
  Meydan: [25.1676, 55.2994],
  Bukadra: [25.1664, 55.3169],
  "Mohammed Bin Rashid City": [25.1761, 55.3094],
  "Nad Al Sheba": [25.1554, 55.3355],
  "Dubai Creek Harbour (The Lagoons)": [25.2068, 55.3458],
  "Ras Al Khor": [25.1866, 55.3462],
  "Al Jaddaf": [25.2215, 55.3425],
  "Al Jadaf": [25.2215, 55.3425],
  "Dubai Hills Estate": [25.1135, 55.2476],
  "Al Barari": [25.0994, 55.3139],
  "Dubai Land": [25.0891, 55.3198],
  "Dubai Land Residence Complex": [25.0896, 55.3788],
  DLRC: [25.0896, 55.3788],
  Majan: [25.0938, 55.3267],
  "City of Arabia": [25.0893, 55.3282],
  "Falcon City of Wonders": [25.1001, 55.3385],
  Liwan: [25.0898, 55.3544],
  "Dubai Silicon Oasis": [25.1221, 55.3773],
  "International City": [25.1639, 55.4074],
  "Al Warsan": [25.1649, 55.4208],
  "Warsan Fourth": [25.1442, 55.4275],
  Arjan: [25.0601, 55.2383],
  "Dubai Science Park": [25.0771, 55.2458],
  "Al Barsha South Fourth": [25.0699, 55.2355],
  "Al Barsha South Fifth": [25.0629, 55.2242],
  "Dubai Sports City": [25.0395, 55.2185],
  "Motor City": [25.0477, 55.239],
  "Dubai Studio City": [25.0423, 55.251],
  "Jumeirah Village Circle": [25.0548, 55.2094],
  JVC: [25.0548, 55.2094],
  "Jumeirah Village Triangle": [25.0402, 55.1862],
  "Jumeirah Islands": [25.0442, 55.164],
  "Jumeirah Lake Towers": [25.0698, 55.1438],
  "Dubai Marina": [25.0805, 55.1403],
  "Marsa Dubai": [25.0805, 55.1403],
  "Dubai Harbour": [25.0914, 55.139],
  "Palm Jumeirah": [25.1124, 55.139],
  "Dubai Internet City": [25.0954, 55.1591],
  "Al Furjan": [25.0272, 55.1465],
  "Wasl Gate": [25.0269, 55.1196],
  "Dubai Production City (IMPZ)": [25.0271, 55.1915],
  "Me'Aisem First": [25.0352, 55.1993],
  "Dubai Investment Park (DIP)": [24.9941, 55.1594],
  "Dubai Investment Park First": [24.9857, 55.173],
  "Dubai Investment Park Second": [24.9687, 55.1583],
  "Damac Lagoons": [25.0025, 55.2405],
  "Damac Hills": [25.0231, 55.2526],
  "Damac Hills 2": [24.9874, 55.3745],
  "Town Square": [25.009, 55.2888],
  "Expo City": [24.9615, 55.1502],
  "Dubai South": [24.8963, 55.1614],
  "Dubai South (Dubai World Central)": [24.8963, 55.1614],
  "Madinat Al Mataar": [24.8998, 55.1735],
  "Downtown Jebel Ali": [24.984, 55.104],
  "Jebel Ali": [24.9857, 55.0273],
  "Jabal Ali First": [25.0112, 55.1127],
  "Palm Jebel Ali": [25.0052, 54.9871],
  "Dubai Industrial City": [24.8468, 55.0991],
};

const areaFrom = (value: string | null) => {
  const parts = (value || "Dubai").split(",").map((item) => item.trim()).filter(Boolean);
  return parts[1] || parts[0] || "Dubai";
};

const money = (value: number | null) =>
  value ? `AED ${new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(value)}` : "On request";

export default function ProjectMap({
  projects,
  onSelect,
  labels,
}: {
  projects: MapProject[];
  onSelect: (project: MapProject) => void;
  labels: { mapped: string; projects: string; hint: string; empty: string };
}) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [activeArea, setActiveArea] = useState<string>("");

  const groups = useMemo(() => {
    const result = new Map<string, MapProject[]>();
    projects.forEach((project) => {
      const area = areaFrom(project["Location / Community | المنطقة"]);
      if (!AREA_COORDINATES[area]) return;
      result.set(area, [...(result.get(area) || []), project]);
    });
    return [...result.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [projects]);

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    let cancelled = false;
    loadMapLibraries().then((L) => {
      if (cancelled || !mapNode.current) return;
      const map = L.map(mapNode.current, { zoomControl: false, minZoom: 9 }).setView([25.135, 55.235], 10);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 0);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    loadMapLibraries().then((L) => {
      if (cancelled || !mapRef.current) return;
      layerRef.current?.remove();
      const layer = L.markerClusterGroup({
        maxClusterRadius: 58,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: (cluster: any) => {
          const total = cluster
            .getAllChildMarkers()
            .reduce((sum: number, marker: any) => sum + Number(marker.options.title || 1), 0);
          return L.divIcon({
            className: "map-cluster-shell",
            html: `<span class="map-cluster"><b>${total}</b><i>${cluster.getChildCount()} areas</i></span>`,
            iconSize: [64, 64],
          });
        },
      });
      groups.forEach(([area, items]) => {
        const count = items.length;
        const marker = L.marker(AREA_COORDINATES[area], {
          title: String(count),
          icon: L.divIcon({
            className: "map-pin-shell",
            html: `<span class="map-pin${activeArea === area ? " active" : ""}"><b>${count}</b><i>${area}</i></span>`,
            iconSize: [74, 50],
            iconAnchor: [37, 25],
          }),
        });
        marker.on("click", () => setActiveArea(area));
        marker.addTo(layer);
      });
      layer.addTo(mapRef.current);
      layerRef.current = layer;
    });
    return () => {
      cancelled = true;
    };
  }, [groups, activeArea]);

  const activeProjects = groups.find(([area]) => area === activeArea)?.[1] || [];
  const mappedCount = groups.reduce((sum, [, items]) => sum + items.length, 0);

  return (
    <div className="map-experience">
      <div className="map-canvas" ref={mapNode} aria-label="Interactive Dubai off-plan project map" />
      <aside className={activeArea ? "map-drawer open" : "map-drawer"}>
        <div className="map-drawer-head">
          <div><span>{labels.mapped}</span><strong>{activeArea || `${mappedCount.toLocaleString()} ${labels.projects}`}</strong></div>
          {activeArea && <button onClick={() => setActiveArea("")} aria-label="Close area projects">×</button>}
        </div>
        {activeArea ? (
          <div className="map-project-list">
            {activeProjects.slice(0, 50).map((project, index) => (
              <button key={`${project["Project Name | اسم المشروع"]}-${index}`} onClick={() => onSelect(project)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{project["Project Name | اسم المشروع"]}</strong><small>{project["Developer | المطور"]}</small></div>
                <b>{money(project["Starting Price AED | السعر المبدئي"])}</b>
              </button>
            ))}
          </div>
        ) : (
          <div className="map-instructions"><span>⌖</span><p>{labels.hint}</p><small>{labels.empty}</small></div>
        )}
      </aside>
      <div className="map-coverage"><b>{mappedCount.toLocaleString()}</b> / {projects.length.toLocaleString()} {labels.projects}</div>
    </div>
  );
}
