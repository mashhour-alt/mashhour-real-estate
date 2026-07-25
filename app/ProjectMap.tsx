"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LANDMARKS, METRO_LINES } from "@/lib/dubai-transit";

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
  const [isMobile, setIsMobile] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [exactCoords, setExactCoords] = useState<Record<string, { lat: number; lng: number }>>({});
  const [devDomains, setDevDomains] = useState<Record<string, string>>({});
  const metroLayerRef = useRef<any>(null);
  const landmarkLayerRef = useRef<any>(null);

  // Load verified project coordinates (grows over time as they are collected).
  useEffect(() => {
    fetch("/data/coordinates.json")
      .then((response) => (response.ok ? response.json() : { projects: {} }))
      .then((payload: { projects?: Record<string, { lat: number; lng: number }> }) => {
        setExactCoords(payload.projects || {});
      })
      .catch(() => {
        // No coordinates file yet — everything stays at area level.
      });
  }, []);

  // Load developer domains so each pin can show the developer's logo (favicon).
  useEffect(() => {
    fetch("/data/developer-domains.json")
      .then((response) => (response.ok ? response.json() : {}))
      .then((payload: Record<string, string>) => setDevDomains(payload || {}))
      .catch(() => {
        // Without domains, pins fall back to plain dots.
      });
  }, []);

  // Track viewport so the drawer can become a bottom sheet on small screens.
  useEffect(() => {
    const media = window.matchMedia("(max-width: 780px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // Leaflet needs an explicit resize signal when its container changes size.
  useEffect(() => {
    const onResize = () => mapRef.current?.invalidateSize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  const groups = useMemo(() => {
    const result = new Map<string, MapProject[]>();
    projects.forEach((project) => {
      const name = project["Project Name | اسم المشروع"];
      // Projects with verified coordinates are drawn individually, so skip them here.
      if (name && exactCoords[name]) return;
      const area = areaFrom(project["Location / Community | المنطقة"]);
      if (!AREA_COORDINATES[area]) return;
      result.set(area, [...(result.get(area) || []), project]);
    });
    return [...result.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [projects, exactCoords]);

  // Projects that have a verified precise location.
  const exactProjects = useMemo(
    () =>
      projects.filter((project) => {
        const name = project["Project Name | اسم المشروع"];
        return name && exactCoords[name];
      }),
    [projects, exactCoords],
  );

  // Deterministic scatter so each project keeps a stable spot inside its area,
  // giving a full GPS-style map without inventing exact street addresses.
  const scatterFor = (seed: string, center: [number, number], index: number): [number, number] => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
    const golden = 2.399963; // golden-angle spiral spreads points evenly
    const angle = index * golden + (hash % 360) * (Math.PI / 180);
    const radius = 0.0025 + Math.sqrt(index + 1) * 0.0022;
    return [center[0] + Math.sin(angle) * radius, center[1] + Math.cos(angle) * radius * 1.3];
  };

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

      // --- Metro lines (always visible) ---
      const metroLayer = L.layerGroup();
      METRO_LINES.forEach((line) => {
        const path = line.stations.map((s) => s.pos);
        L.polyline(path, {
          color: line.color,
          weight: line.status === "construction" ? 3 : 4,
          opacity: line.status === "construction" ? 0.55 : 0.9,
          dashArray: line.status === "construction" ? "8 8" : undefined,
        }).addTo(metroLayer);

        line.stations.forEach((station) => {
          L.circleMarker(station.pos, {
            radius: 3.5,
            color: "#fff",
            weight: 1.5,
            fillColor: line.color,
            fillOpacity: line.status === "construction" ? 0.6 : 1,
          })
            .bindTooltip(`${station.name} · ${line.name}`, { direction: "top" })
            .addTo(metroLayer);
        });
      });
      metroLayer.addTo(map);
      metroLayerRef.current = metroLayer;

      // --- Landmarks (toggleable) ---
      const landmarkLayer = L.layerGroup();
      LANDMARKS.forEach((landmark) => {
        L.marker(landmark.pos, {
          icon: L.divIcon({
            className: "landmark-shell",
            html: `<span class="landmark-pin${
              landmark.construction ? " construction" : ""
            }"><i>◆</i><b>${landmark.name}</b></span>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
          interactive: true,
        })
          .bindTooltip(
            landmark.construction ? `${landmark.name} (under construction)` : landmark.name,
            { direction: "top" },
          )
          .addTo(landmarkLayer);
      });
      landmarkLayer.addTo(map);
      landmarkLayerRef.current = landmarkLayer;
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
        maxClusterRadius: 50,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          const size = count > 100 ? 64 : count > 25 ? 56 : 46;
          return L.divIcon({
            className: "map-cluster-shell",
            html: `<span class="map-cluster"><b>${count}</b></span>`,
            iconSize: [size, size],
          });
        },
      });

      groups.forEach(([area, items]) => {
        const center = AREA_COORDINATES[area];
        items.forEach((project, index) => {
          const name = project["Project Name | اسم المشروع"] || area;
          const developer = project["Developer | المطور"] || "";
          const domain = devDomains[developer];
          const [lat, lng] = scatterFor(name, center, index);

          const html = domain
            ? `<span class="map-logo"><img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" loading="lazy" alt="" onerror="this.parentNode.classList.add('map-logo-fallback')"/></span>`
            : `<span class="map-dot"></span>`;

          const marker = L.marker([lat, lng], {
            title: "1",
            icon: L.divIcon({
              className: "map-dot-shell",
              html,
              iconSize: domain ? [26, 26] : [12, 12],
              iconAnchor: domain ? [13, 13] : [6, 6],
            }),
          });
          marker.bindTooltip(`${name}${developer ? ` · ${developer}` : ""}`, { direction: "top" });
          marker.on("click", () => onSelect(project));
          marker.addTo(layer);
        });
      });

      // Precise pins for verified projects.
      exactProjects.forEach((project) => {
        const name = project["Project Name | اسم المشروع"];
        const coord = exactCoords[name];
        if (!coord) return;
        const marker = L.marker([coord.lat, coord.lng], {
          title: "1",
          icon: L.divIcon({
            className: "map-exact-shell",
            html: `<span class="map-exact-pin" title="${name}"></span>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
        });
        marker.bindTooltip(name, { direction: "top" });
        marker.on("click", () => onSelect(project));
        marker.addTo(layer);
      });

      layer.addTo(mapRef.current);
      layerRef.current = layer;
    });
    return () => {
      cancelled = true;
    };
  }, [groups, exactProjects, exactCoords, devDomains, onSelect]);

  // Show/hide the landmark layer without rebuilding the map.
  useEffect(() => {
    const map = mapRef.current;
    const layer = landmarkLayerRef.current;
    if (!map || !layer) return;
    if (showLandmarks) layer.addTo(map);
    else layer.remove();
  }, [showLandmarks]);

  const activeProjects = groups.find(([area]) => area === activeArea)?.[1] || [];
  const mappedCount =
    groups.reduce((sum, [, items]) => sum + items.length, 0) + exactProjects.length;

  const projectList = (
    <div className="map-project-list">
      {activeProjects.slice(0, 50).map((project, index) => (
        <button
          key={`${project["Project Name | اسم المشروع"]}-${index}`}
          onClick={() => onSelect(project)}
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{project["Project Name | اسم المشروع"]}</strong>
            <small>{project["Developer | المطور"]}</small>
          </div>
          <b>{money(project["Starting Price AED | السعر المبدئي"])}</b>
        </button>
      ))}
    </div>
  );

  const drawerHead = (
    <div className="map-drawer-head">
      <div>
        <span>{labels.mapped}</span>
        <strong>{activeArea || `${mappedCount.toLocaleString()} ${labels.projects}`}</strong>
      </div>
      {activeArea && (
        <button onClick={() => setActiveArea("")} aria-label="Close area projects">
          ×
        </button>
      )}
    </div>
  );

  return (
    <div className={isMobile ? "map-experience mobile" : "map-experience"}>
      <div className="map-frame">
        <div
          className="map-canvas"
          ref={mapNode}
          aria-label="Interactive Dubai off-plan project map"
        />

        {/* Desktop: persistent side drawer overlaying the map. */}
        {!isMobile && (
          <aside className={activeArea ? "map-drawer open" : "map-drawer"}>
            {drawerHead}
            {activeArea ? (
              projectList
            ) : (
              <div className="map-instructions">
                <span>⌖</span>
                <p>{labels.hint}</p>
                <small>{labels.empty}</small>
              </div>
            )}
          </aside>
        )}

        {/* Mobile: bottom sheet that only appears once an area is tapped. */}
        {isMobile && activeArea && (
          <aside className="map-sheet open">
            <i className="map-sheet-grip" aria-hidden="true" />
            {drawerHead}
            {projectList}
          </aside>
        )}

        <div className="map-coverage">
          <b>{mappedCount.toLocaleString()}</b> / {projects.length.toLocaleString()}{" "}
          {labels.projects}
          {exactProjects.length > 0 && (
            <span className="map-coverage-exact">
              {" · "}
              {exactProjects.length.toLocaleString()} exact
            </span>
          )}
        </div>

        <div className="map-legend">
          <div className="map-legend-lines">
            <span><i style={{ background: "#e53935" }} />Red</span>
            <span><i style={{ background: "#43a047" }} />Green</span>
            <span><i className="dashed" style={{ background: "#1e88e5" }} />Blue (soon)</span>
          </div>
          <label className="map-legend-toggle">
            <input
              type="checkbox"
              checked={showLandmarks}
              onChange={(event) => setShowLandmarks(event.target.checked)}
            />
            <span>◆ Landmarks</span>
          </label>
        </div>
      </div>

      {/* Mobile: guidance sits below the map instead of covering it. */}
      {isMobile && !activeArea && (
        <div className="map-hint-below">
          <span>⌖</span>
          <p>{labels.hint}</p>
          <small>{labels.empty}</small>
        </div>
      )}
    </div>
  );
}
