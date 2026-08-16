"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DataNotice, Footer, Header, PageIntro, SearchBox, usePlatformData, useProjectLiveData } from "../components";
import { useLanguage } from "../language-context";
import { MAPTILER_ATTRIBUTION, tileUrlFor } from "../map-tiles";
import { areaFrom } from "../data";

type MapPoint = [number, number];
type MetroStop = {
  name: string;
  point: MapPoint;
};
type MetroLine = {
  id: string;
  name: string;
  nameAr: string;
  color: string;
  status: "operating" | "construction" | "announced";
  timing: string;
  routes: MetroStop[][];
};
type OperatingMetroNetwork = {
  updatedAt: string;
  source: string;
  license: string;
  lines: Record<string, {
    relationId: number;
    segments: MapPoint[][];
    stations: MetroStop[];
  }>;
};

const metroLines: MetroLine[] = [
  {
    id: "red",
    name: "Red Line",
    nameAr: "الخط الأحمر",
    color: "#e31b23",
    status: "operating",
    timing: "OPERATING · متاح",
    routes: [[
      { name: "Centrepoint", point: [25.23031, 55.39112] },
      { name: "Emirates", point: [25.2257, 55.3750] },
      { name: "Airport Terminal 3", point: [25.2450, 55.3521] },
      { name: "Airport Terminal 1", point: [25.2495, 55.3515] },
      { name: "Al Garhoud", point: [25.2414, 55.3394] },
      { name: "City Centre Deira", point: [25.2510, 55.3331] },
      { name: "Al Rigga", point: [25.2631, 55.3260] },
      { name: "Union", point: [25.26618, 55.31375] },
      { name: "BurJuman", point: [25.2544, 55.30412] },
      { name: "ADCB", point: [25.24451, 55.29818] },
      { name: "max", point: [25.2337, 55.2908] },
      { name: "World Trade Centre", point: [25.2264, 55.2870] },
      { name: "Emirates Towers", point: [25.2171, 55.2823] },
      { name: "Financial Centre", point: [25.2091, 55.2771] },
      { name: "Burj Khalifa / Dubai Mall", point: [25.2012, 55.2691] },
      { name: "Business Bay", point: [25.1913, 55.2604] },
      { name: "ONPASSIVE", point: [25.15563, 55.22852] },
      { name: "Equiti", point: [25.1411, 55.2215] },
      { name: "Mall of the Emirates", point: [25.1210, 55.2004] },
      { name: "InsuranceMarket", point: [25.1134, 55.1897] },
      { name: "Dubai Internet City", point: [25.1012, 55.1728] },
      { name: "Al Fardan Exchange", point: [25.0893, 55.1615] },
      { name: "Sobha Realty", point: [25.0792, 55.1471] },
      { name: "DMCC", point: [25.0703, 55.1387] },
      { name: "National Paints", point: [25.05788, 55.12736] },
      { name: "Ibn Battuta", point: [25.0448, 55.1183] },
      { name: "Energy", point: [25.0262, 55.1013] },
      { name: "Danube", point: [25.00129, 55.09571] },
      { name: "Life Pharmacy", point: [24.9772, 55.0692] },
    ]],
  },
  {
    id: "route-2020",
    name: "Route 2020",
    nameAr: "مسار 2020",
    color: "#9e153c",
    status: "operating",
    timing: "OPERATING · متاح",
    routes: [[
      { name: "National Paints", point: [25.05788, 55.12736] },
      { name: "The Gardens", point: [25.0421, 55.1169] },
      { name: "Discovery Gardens", point: [25.0352, 55.1305] },
      { name: "Al Furjan", point: [25.0266, 55.1468] },
      { name: "Jumeirah Golf Estates", point: [25.0088, 55.1817] },
      { name: "Dubai Investment Park", point: [24.9857, 55.2028] },
      { name: "EXPO 2020", point: [24.9647, 55.1497] },
    ]],
  },
  {
    id: "green",
    name: "Green Line",
    nameAr: "الخط الأخضر",
    color: "#00a651",
    status: "operating",
    timing: "OPERATING · متاح",
    routes: [[
      { name: "e&", point: [25.25464, 55.40123] },
      { name: "Al Qusais", point: [25.26274, 55.38727] },
      { name: "Dubai Airport Free Zone", point: [25.26983, 55.37515] },
      { name: "Al Nahda", point: [25.27321, 55.36948] },
      { name: "Stadium", point: [25.27791, 55.36147] },
      { name: "Al Qiyadah", point: [25.27759, 55.35263] },
      { name: "Abu Hail", point: [25.27542, 55.34645] },
      { name: "Abu Baker Al Siddique", point: [25.27089, 55.33276] },
      { name: "Salah Al Din", point: [25.27031, 55.32083] },
      { name: "Union", point: [25.26618, 55.31375] },
      { name: "Baniyas Square", point: [25.26917, 55.30761] },
      { name: "Gold Souq", point: [25.27614, 55.30168] },
      { name: "Al Ras", point: [25.26877, 55.29362] },
      { name: "Al Ghubaiba", point: [25.26504, 55.28894] },
      { name: "Sharaf DG", point: [25.25821, 55.29748] },
      { name: "BurJuman", point: [25.2544, 55.30412] },
      { name: "Oud Metha", point: [25.24393, 55.31589] },
      { name: "Dubai Healthcare City", point: [25.23095, 55.32262] },
      { name: "Al Jadaf", point: [25.22491, 55.33375] },
      { name: "Creek", point: [25.21888, 55.33904] },
    ]],
  },
  {
    id: "blue",
    name: "Blue Line",
    nameAr: "الخط الأزرق",
    color: "#0067d9",
    status: "construction",
    timing: "09.09.2029 · تحت الإنشاء",
    routes: [
      [
        { name: "Creek Interchange", point: [25.21888, 55.33904] },
        { name: "Dubai Festival City", point: [25.21908, 55.35343] },
        { name: "Dubai Creek Harbour", point: [25.19805, 55.36189] },
        { name: "Ras Al Khor Industrial Area", point: [25.1807, 55.36312] },
        { name: "International City 1", point: [25.16194, 55.41086] },
        { name: "International City 2 & 3", point: [25.13844, 55.40032] },
        { name: "Dubai Silicon Oasis", point: [25.12029, 55.38878] },
        { name: "Dubai Academic City", point: [25.12576, 55.43317] },
      ],
      [
        { name: "Centrepoint Interchange", point: [25.23031, 55.39112] },
        { name: "Mirdif", point: [25.223, 55.4219] },
        { name: "Al Warqa", point: [25.18906, 55.40942] },
        { name: "International City 1", point: [25.16194, 55.41086] },
      ],
    ],
  },
  {
    id: "gold",
    name: "Gold Line",
    nameAr: "الخط الذهبي",
    color: "#c89f2d",
    status: "announced",
    timing: "09.09.2032 · مُعلن",
    routes: [[
      { name: "Al Ghubaiba Interchange", point: [25.26504, 55.28894] },
      { name: "Mina Rashid", point: [25.2742, 55.278] },
      { name: "City Walk", point: [25.2073, 55.2617] },
      { name: "Business Bay Interchange", point: [25.1913, 55.2604] },
      { name: "Mohammed Bin Rashid City", point: [25.1743, 55.3007] },
      { name: "Nad Al Sheba", point: [25.167, 55.341] },
      { name: "Mohammed Bin Rashid Gardens", point: [25.159, 55.322] },
      { name: "Meydan", point: [25.1553, 55.3058] },
      { name: "Al Barsha South", point: [25.078, 55.244] },
      { name: "Jumeirah Village Circle", point: [25.0562, 55.2092] },
      { name: "Jumeirah Golf Estates", point: [25.0088, 55.1817] },
    ]],
  },
];

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[character] || character));

const unverifiedMapCoordinateNames = new Set([
  "Celesto Two",
  "Orchid Residence 1",
  "Cresswell Homes",
  "Cresswell Views II",
  "RAW DISTRICT BY IMTIAZ R",
]);

export default function MapPage() {
  const data = usePlatformData();
  const liveData = useProjectLiveData();
  const { arabic } = useLanguage();
  const [query, setQuery] = useState("");
  const [operatingMetro, setOperatingMetro] = useState<OperatingMetroNetwork | null>(null);
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<{ flyTo: (point: MapPoint, zoom: number, options?: object) => void } | null>(null);
  const tileLayer = useRef<{ setUrl: (url: string) => void } | null>(null);
  const projectMarkers = useRef(new Map<string, { openTooltip: () => void }>());
  const allProjects = useMemo(() => (data?.projects || []).map((project) => {
    const name = project["Project Name | اسم المشروع"];
    const live = liveData[name];
    return {
      project,
      live: live && unverifiedMapCoordinateNames.has(name)
        ? { ...live, coordinates: null }
        : live,
    };
  }), [data, liveData]);
  const mappedProjects = useMemo(
    () => allProjects.filter(({ live }) => Boolean(live?.coordinates)),
    [allProjects],
  );
  const matches = useMemo(() => allProjects.filter(({ project, live }) => `${project["Project Name | اسم المشروع"]} ${live?.developer || project["Developer | المطور"]} ${areaFrom(live?.location || project["Location / Community | المنطقة"])}`.toLowerCase().includes(query.toLowerCase())).slice(0, 30), [allProjects, query]);

  useEffect(() => {
    fetch("/data/dubai-metro-network.json")
      .then((response) => response.json())
      .then(setOperatingMetro)
      .catch(() => setOperatingMetro(null));
  }, []);

  useEffect(() => {
    if (!mapElement.current || !mappedProjects.length) return;
    let map: { remove: () => void } | undefined;
    let cancelled = false;
    const markerRegistry = projectMarkers.current;
    (async () => {
      const leafletModule = await import("leaflet");
      await import("leaflet.markercluster");
      if (cancelled || !mapElement.current) return;
      const L = leafletModule.default;
      /*
       * DUBAI-FIRST VIEWPORT
       */
      const dubaiMapBounds = L.latLngBounds(
        [24.84, 54.98],
        [25.34, 55.58],
      );

      const leafletMap = L.map(mapElement.current, {
        center: [25.115, 55.235],
        zoom: 11,
        minZoom: 9.5,
        maxZoom: 18,
        maxBounds: dubaiMapBounds,
        maxBoundsViscosity: 1.0,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
      });
      map = leafletMap;
      mapInstance.current = leafletMap;

        /*
         * MAP FULLSCREEN
         *
         * Uses a CSS fullscreen mode rather than relying exclusively
         * on the browser Fullscreen API, which makes it much more
         * reliable on iPhone / Safari.
         */
        const FullscreenControl = L.Control.extend({
          options: {
            position: "topleft",
          },

          onAdd: function (map: any) {
            const container = L.DomUtil.create(
              "div",
              "leaflet-control mashhour-fullscreen-control",
            );

            const button = L.DomUtil.create(
              "button",
              "mashhour-fullscreen-button",
              container,
            ) as HTMLButtonElement;

            button.type = "button";

            const updateButton = (active: boolean) => {
              button.setAttribute(
                "aria-pressed",
                String(active),
              );

              button.setAttribute(
                "aria-label",
                active
                  ? arabic
                    ? "الخروج من ملء الشاشة"
                    : "Exit fullscreen"
                  : arabic
                    ? "ملء الخريطة بالشاشة"
                    : "Fullscreen map",
              );

              button.title = active
                ? arabic
                  ? "الخروج من ملء الشاشة"
                  : "Exit fullscreen"
                : arabic
                  ? "ملء الشاشة"
                  : "Fullscreen";

              button.innerHTML = active
                ? `
                    <span class="fullscreen-icon is-exit">
                      <i></i><i></i><i></i><i></i>
                    </span>
                  `
                : `
                    <span class="fullscreen-icon">
                      <i></i><i></i><i></i><i></i>
                    </span>
                  `;
            };

            updateButton(false);

            L.DomEvent.on(
              button,
              "click",
              function (event: Event) {
                L.DomEvent.stopPropagation(event);
                L.DomEvent.preventDefault(event);

                const mapContainer = map.getContainer();

                const nextActive =
                  !mapContainer.classList.contains(
                    "is-map-fullscreen",
                  );

                mapContainer.classList.toggle(
                  "is-map-fullscreen",
                  nextActive,
                );

                document.body.classList.toggle(
                  "map-fullscreen-open",
                  nextActive,
                );

                updateButton(nextActive);

                window.setTimeout(
                  () => map.invalidateSize(),
                  80,
                );
              },
            );

            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);

            return container;
          },
        });

        leafletMap.addControl(
          new FullscreenControl(),
        );

        const exitMapFullscreen = () => {
          const mapContainer =
            leafletMap.getContainer();

          if (
            !mapContainer.classList.contains(
              "is-map-fullscreen",
            )
          ) {
            return;
          }

          mapContainer.classList.remove(
            "is-map-fullscreen",
          );

          document.body.classList.remove(
            "map-fullscreen-open",
          );

          window.setTimeout(
            () => leafletMap.invalidateSize(),
            80,
          );
        };

        const handleFullscreenEscape = (
          event: KeyboardEvent,
        ) => {
          if (event.key === "Escape") {
            exitMapFullscreen();
          }
        };

        document.addEventListener(
          "keydown",
          handleFullscreenEscape,
        );
      markerRegistry.clear();
      tileLayer.current = L.tileLayer(tileUrlFor(arabic), {
        attribution: MAPTILER_ATTRIBUTION,
        maxZoom: 19,
        crossOrigin: true,
      }).addTo(leafletMap);

      const metroPane = leafletMap.createPane("metroNetworkPane");
      metroPane.style.zIndex = "410";
      metroPane.style.pointerEvents = "none";
      const metroRenderer = L.svg({ pane: "metroNetworkPane", padding: 0.5 });
      metroLines.forEach((line) => {
        const isFuture = line.status !== "operating";
        const preciseLine = operatingMetro?.lines[line.id];
        const routeSegments = preciseLine?.segments || line.routes.map((route) => route.map((stop) => stop.point));
        routeSegments.forEach((points) => {
          L.polyline(points, {
            pane: "metroNetworkPane",
            renderer: metroRenderer,
            color: line.color,
            weight: 11,
            opacity: isFuture ? 0.12 : 0.15,
            interactive: false,
            className: "metro-route-glow",
          }).addTo(leafletMap);
          L.polyline(points, {
            pane: "metroNetworkPane",
            renderer: metroRenderer,
            color: line.color,
            weight: isFuture ? 4 : 5,
            opacity: 0.95,
            dashArray: isFuture ? "14 10" : undefined,
            lineCap: "round",
            lineJoin: "round",
            interactive: false,
            className: isFuture ? "metro-route metro-route-future" : "metro-route",
          }).addTo(leafletMap);
        });
        const stationGroups = preciseLine?.stations ? [preciseLine.stations] : line.routes;
        stationGroups.forEach((route) => {
          route.forEach((stop) => {
            const stopKind = line.status === "operating"
              ? "OPERATING STATION · محطة متاحة"
              : line.status === "construction"
                ? "ANNOUNCED STATION · محطة معلنة"
                : "ANNOUNCED ROUTE LOCATION · موقع مسار معلن";
            L.circleMarker(stop.point, {
              pane: "metroNetworkPane",
              renderer: metroRenderer,
              radius: isFuture ? 4 : 3,
              color: line.color,
              weight: 2,
              fillColor: "#ffffff",
              fillOpacity: 1,
              interactive: true,
              className: isFuture ? "metro-station metro-station-future" : "metro-station",
            })
              .bindTooltip(
                `<strong>${escapeHtml(stop.name)}</strong><span>${stopKind}</span>`,
                { direction: "top", className: "metro-stop-tooltip", opacity: 1 },
              )
              .addTo(leafletMap);
          });
        });
      });

      
    const etihadRailLine = {
      id: "etihad-rail",
      name: "Etihad Rail",
      nameAr: "قطار الاتحاد",
      color: "#00594c",
      status: "operating",
      routes: [[
        { name: "Mohamed bin Zayed City (Abu Dhabi)", point: [24.325, 54.635] },
        { name: "Jumeirah Golf Estates (Dubai)", point: [25.0088, 55.1817] },
        { name: "Al Dhaid (Sharjah)", point: [25.288, 55.880] },
        { name: "University City (Sharjah)", point: [25.300, 55.490] },
        { name: "Al Hilal City (Fujairah)", point: [25.150, 56.340] },
      ]],
    };

    const etihadPane = leafletMap.createPane("etihadRailPane");
    etihadPane.style.zIndex = "445";
    etihadPane.style.display = "none";
    const etihadRenderer = L.svg({ pane: "etihadRailPane", padding: 0.5 });

    etihadRailLine.routes.forEach((points) => {
      const linePoints = points.map((p) => p.point);
      L.polyline(linePoints, {
        pane: "etihadRailPane",
        renderer: etihadRenderer,
        color: etihadRailLine.color,
        weight: 5,
        opacity: 0.9,
        dashArray: "10 6",
        lineCap: "round",
        lineJoin: "round",
        className: "etihad-rail-line",
      }).addTo(leafletMap);

      points.forEach((stop) => {
        L.circleMarker(stop.point, {
          pane: "etihadRailPane",
          renderer: etihadRenderer,
          radius: 5,
          color: etihadRailLine.color,
          weight: 2,
          fillColor: "#ffffff",
          fillOpacity: 1,
          interactive: true,
          className: "etihad-rail-station",
        })
          .bindTooltip(
            `<strong>${escapeHtml(stop.name)}</strong><span>ETIHAD RAIL &middot; قطار الاتحاد</span>`,
            { direction: "top", className: "metro-stop-tooltip", opacity: 1 }
          )
          .addTo(leafletMap);
      });
    });

    
    const areaCentroids: Record<string, { lat: number; lng: number; projectCount: number }> =
      await fetch("/data/area-centroids.json").then((r) => r.json());

    const areaBenchmarksData: {
      areas: {
        area: string;
        rentPerSqFt: number;
        cluster?: string;
        assetMix?: string;
        marketStage?: string;
        appreciationBase?: number;
        confidence?: string | number;
      }[];
    } = await fetch("/data/area-market-benchmarks.json").then((r) => r.json());

    /*
     * MARKET INTELLIGENCE LAYER
     *
     * Important:
     * rentPerSqFt is currently the benchmark available in the dataset.
     * The UI therefore describes it as a market benchmark rather than
     * pretending it is a verified sale-price metric.
     */
    const pricePane = leafletMap.createPane("priceHeatPane");
    pricePane.style.zIndex = "440";
    pricePane.style.display = "none";
    pricePane.style.pointerEvents = "none";

    const marketLabelPane = leafletMap.createPane("marketPriceLabelPane");
    marketLabelPane.style.zIndex = "441";
    marketLabelPane.style.display = "none";
    marketLabelPane.style.pointerEvents = "none";

    const priceRenderer = L.svg({
      pane: "priceHeatPane",
      padding: 0.5,
    });

    const priceValues = areaBenchmarksData.areas
      .map((area) => Number(area.rentPerSqFt))
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);

    const quantile = (values: number[], q: number) => {
      if (!values.length) return 0;

      const position = (values.length - 1) * q;
      const base = Math.floor(position);
      const rest = position - base;
      const next = values[base + 1];

      return next === undefined
        ? values[base]
        : values[base] + rest * (next - values[base]);
    };

    const priceBreaks = [
      -Infinity,
      quantile(priceValues, 0.15),
      quantile(priceValues, 0.30),
      quantile(priceValues, 0.48),
      quantile(priceValues, 0.66),
      quantile(priceValues, 0.82),
      quantile(priceValues, 0.94),
      Infinity,
    ];

    const marketColors = [
      "#d8c8aa",
      "#c7ae82",
      "#aa8b5d",
      "#7f8274",
      "#607f79",
      "#376a63",
      "#174e49",
    ];

    const marketStrokes = [
      "#b5a079",
      "#a58a61",
      "#866b46",
      "#62695f",
      "#46665f",
      "#28554f",
      "#103d39",
    ];

    const getPriceBucket = (value: number) => {
      for (let index = 1; index < priceBreaks.length; index += 1) {
        if (value <= priceBreaks[index]) {
          return Math.min(index - 1, marketColors.length - 1);
        }
      }

      return marketColors.length - 1;
    };

    const formatMarketNumber = (value: number) =>
      new Intl.NumberFormat("en-AE", {
        maximumFractionDigits: 0,
      }).format(value);

    const marketBubbleRadius = (projectCount: number) =>
      Math.min(22, 11 + Math.sqrt(Math.max(projectCount, 1)) * 0.9);

    areaBenchmarksData.areas.forEach((benchmark) => {
      const centroid = areaCentroids[benchmark.area];
      const value = Number(benchmark.rentPerSqFt);

      if (
        !centroid ||
        !Number.isFinite(value) ||
        value <= 0
      ) {
        return;
      }

      const bucket = getPriceBucket(value);

      const bubble = L.circleMarker(
        [centroid.lat, centroid.lng],
        {
          pane: "priceHeatPane",
          renderer: priceRenderer,
          radius: marketBubbleRadius(centroid.projectCount),
          color: marketStrokes[bucket],
          weight: 1.4,
          opacity: 0.9,
          fillColor: marketColors[bucket],
          fillOpacity: 0.77,
          interactive: true,
          className: "market-price-bubble",
        },
      );

      bubble.bindTooltip(
        `
          <div class="market-map-card">
            <div class="market-map-card__eyebrow">
              ${arabic ? "مؤشر السوق" : "MARKET BENCHMARK"}
            </div>

            <div class="market-map-card__head">
              <strong>${escapeHtml(benchmark.area)}</strong>
              <span>${escapeHtml(benchmark.marketStage || (arabic ? "السوق" : "Market"))}</span>
            </div>

            <div class="market-map-card__price">
              <small>${arabic ? "متوسط المؤشر" : "AREA BENCHMARK"}</small>
              <div>
                <b>${formatMarketNumber(value)}</b>
                <span>AED / SQ FT</span>
              </div>
            </div>

            <div class="market-map-card__stats">
              <div>
                <small>${arabic ? "المشاريع" : "PROJECTS"}</small>
                <strong>${formatMarketNumber(centroid.projectCount)}</strong>
              </div>

              ${
                benchmark.appreciationBase !== undefined
                  ? `
                    <div>
                      <small>${arabic ? "النمو المتوقع" : "APPRECIATION"}</small>
                      <strong>${Number(benchmark.appreciationBase) > 0 ? "+" : ""}${Number(benchmark.appreciationBase).toFixed(1)}%</strong>
                    </div>
                  `
                  : ""
              }
            </div>

            ${
              benchmark.assetMix || benchmark.cluster
                ? `
                  <div class="market-map-card__tags">
                    ${benchmark.assetMix ? `<span>${escapeHtml(benchmark.assetMix)}</span>` : ""}
                    ${benchmark.cluster ? `<span>${escapeHtml(benchmark.cluster)}</span>` : ""}
                  </div>
                `
                : ""
            }
          </div>
        `,
        {
          direction: "top",
          offset: [0, -10],
          className: "market-price-tooltip",
          opacity: 1,
        },
      );

      bubble.addTo(leafletMap);

      const label = L.marker(
        [centroid.lat, centroid.lng],
        {
          pane: "marketPriceLabelPane",
          interactive: false,
          icon: L.divIcon({
            className: "market-price-label-shell",
            iconSize: [92, 26],
            iconAnchor: [46, 13],
            html: `
              <span class="market-price-label">
                <b>${formatMarketNumber(value)}</b>
                <small>AED</small>
              </span>
            `,
          }),
        },
      );

      label.addTo(leafletMap);
    });

    /*
     * PREMIUM MAP LAYER CONTROL
     */
    const LayerToggleControl = L.Control.extend({
      options: {
        position: "topright",
      },

      onAdd: function () {
        const container = L.DomUtil.create(
          "div",
          "leaflet-control mashhour-map-layers",
        );

        const mobileTrigger = L.DomUtil.create(
          "button",
          "mashhour-layers-mobile-trigger",
          container,
        ) as HTMLButtonElement;

        mobileTrigger.type = "button";
        mobileTrigger.setAttribute("aria-expanded", "false");

        const updateMobileTrigger = (open: boolean) => {
          mobileTrigger.setAttribute(
            "aria-expanded",
            String(open),
          );

          mobileTrigger.innerHTML = `
            <span class="mashhour-layers-mobile-trigger__icon">
              ${
                open
                  ? "<i></i><i></i>"
                  : "<i></i><i></i><i></i>"
              }
            </span>

            <span>
              ${
                open
                  ? arabic
                    ? "إغلاق"
                    : "Close"
                  : arabic
                    ? "الطبقات"
                    : "Layers"
              }
            </span>
          `;
        };

        updateMobileTrigger(false);

        L.DomEvent.on(
          mobileTrigger,
          "click",
          function (event: Event) {
            L.DomEvent.stopPropagation(event);
            L.DomEvent.preventDefault(event);

            const open =
              !container.classList.contains(
                "is-mobile-open",
              );

            container.classList.toggle(
              "is-mobile-open",
              open,
            );

            updateMobileTrigger(open);
          },
        );

        const title = L.DomUtil.create(
          "div",
          "mashhour-map-layers__title",
          container,
        );

        title.innerHTML = `
          <small>${arabic ? "طبقات الخريطة" : "MAP LAYERS"}</small>
          <strong>${arabic ? "استكشف المنطقة" : "Explore the area"}</strong>
        `;

        const makeToggle = (
          label: string,
          sublabel: string,
          paneNames: string[],
          iconClass: string,
          activeInitially = true,
        ) => {
          const button = L.DomUtil.create(
            "button",
            `mashhour-map-toggle ${activeInitially ? "is-active" : ""}`,
            container,
          ) as HTMLButtonElement;

          button.type = "button";
          button.setAttribute(
            "aria-pressed",
            activeInitially ? "true" : "false",
          );

          button.innerHTML = `
            <span class="mashhour-map-toggle__icon ${iconClass}">
              <i></i>
            </span>

            <span class="mashhour-map-toggle__copy">
              <strong>${label}</strong>
              <small>${sublabel}</small>
            </span>

            <span class="mashhour-map-toggle__switch">
              <i></i>
            </span>
          `;

          L.DomEvent.on(button, "click", function (event) {
            L.DomEvent.stopPropagation(event);
            L.DomEvent.preventDefault(event);

            const currentlyActive =
              button.getAttribute("aria-pressed") === "true";

            const nextActive = !currentlyActive;

            button.setAttribute(
              "aria-pressed",
              String(nextActive),
            );

            button.classList.toggle(
              "is-active",
              nextActive,
            );

            paneNames.forEach((paneName) => {
              const pane = leafletMap.getPane(paneName);

              if (pane) {
                pane.style.display = nextActive ? "" : "none";
              }
            });

            if (paneNames.includes("priceHeatPane")) {
              const legend = leafletMap
                .getContainer()
                .querySelector<HTMLElement>(".market-price-legend");

              if (legend) {
                legend.style.display = nextActive ? "" : "none";
              }
            }
          });

          return button;
        };

        makeToggle(
          arabic ? "المشاريع" : "Projects",
          arabic
            ? `${mappedProjects.length.toLocaleString()} مشروع على الخريطة`
            : `${mappedProjects.length.toLocaleString()} mapped projects`,
          ["markerPane"],
          "is-projects",
          true,
        );

        makeToggle(
          arabic ? "مترو دبي" : "Dubai Metro",
          arabic ? "الحالي والمستقبلي" : "Operating + future",
          ["metroNetworkPane"],
          "is-metro",
          true,
        );

        /*
         * Market Prices intentionally disabled.
         *
         * Existing benchmark data is rentPerSqFt, not sale price per sq ft.
         * Re-enable only after verified sale-price data is available.
         */


        makeToggle(
          arabic ? "قطار الاتحاد" : "Etihad Rail",
          arabic ? "شبكة السكك الحديدية" : "Rail network",
          ["etihadRailPane"],
          "is-rail",
          true,
        );

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        return container;
      },
    });

    leafletMap.addControl(new LayerToggleControl());

    /*
     * PRICE LEGEND
     */
    const MarketLegendControl = L.Control.extend({
      options: {
        position: "bottomright",
      },

      onAdd: function () {
        const legend = L.DomUtil.create(
          "div",
          "leaflet-control market-price-legend",
        );

        legend.style.display = "none";

        const finiteBreak = (value: number) =>
          Number.isFinite(value)
            ? formatMarketNumber(Math.round(value))
            : "";

        const ranges = marketColors.map((color, index) => {
          const low = priceBreaks[index];
          const high = priceBreaks[index + 1];

          let text = "";

          if (!Number.isFinite(low)) {
            text = `${arabic ? "حتى" : "Up to"} ${finiteBreak(high)}`;
          } else if (!Number.isFinite(high)) {
            text = `${finiteBreak(low)}+`;
          } else {
            text = `${finiteBreak(low)} – ${finiteBreak(high)}`;
          }

          return `
            <div class="market-price-legend__row">
              <i style="--market-color:${color}"></i>
              <span>${text}</span>
            </div>
          `;
        }).join("");

        legend.innerHTML = `
          <div class="market-price-legend__head">
            <div>
              <small>${arabic ? "مؤشر السوق" : "MARKET INTELLIGENCE"}</small>
              <strong>${arabic ? "متوسط المنطقة / قدم²" : "Area benchmark / sq ft"}</strong>
            </div>
            <b>AED</b>
          </div>

          <div class="market-price-legend__scale">
            ${marketColors.map((color) => `<i style="background:${color}"></i>`).join("")}
          </div>

          <div class="market-price-legend__ranges">
            ${ranges}
          </div>

          <p>
            ${
              arabic
                ? "النطاقات نسبية حسب بيانات المناطق المتاحة."
                : "Relative tiers based on available area market data."
            }
          </p>
        `;

        L.DomEvent.disableClickPropagation(legend);
        L.DomEvent.disableScrollPropagation(legend);

        return legend;
      },
    });

    leafletMap.addControl(new MarketLegendControl());

    const updateMarketZoom = () => {
      const zoom = leafletMap.getZoom();
      const labelPane = leafletMap.getPane("marketPriceLabelPane");

      if (!labelPane || pricePane.style.display === "none") {
        return;
      }

      labelPane.style.display = zoom >= 11 ? "" : "none";
    };

    leafletMap.on("zoomend", updateMarketZoom);

    const clusters = (L as typeof L & {
      markerClusterGroup: (options?: object) => L.LayerGroup;
    }).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 38,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      animate: true,
      animateAddingMarkers: false,
      disableClusteringAtZoom: 15,

      iconCreateFunction: (cluster: {
        getChildCount: () => number;
      }) => {
        const count = cluster.getChildCount();

        const sizeClass =
          count >= 500
            ? "is-xl"
            : count >= 150
              ? "is-lg"
              : count >= 50
                ? "is-md"
                : "is-sm";

        const compactCount =
          count >= 1000
            ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`
            : String(count);

        return L.divIcon({
          className: "mashhour-cluster-shell",
          html: `
            <div class="mashhour-cluster ${sizeClass}">
              <span>${compactCount}</span>
              <i></i>
            </div>
          `,
          iconSize: [46, 46],
          iconAnchor: [23, 23],
        });
      },
    });
      mappedProjects.forEach(({ project, live }) => {
        if (!live.coordinates) return;
        const name = project["Project Name | اسم المشروع"];
        const developer = live.developer || project["Developer | المطور"] || "Developer";
        const logo = live.developerLogo
          ? `<img src="${escapeHtml(live.developerLogo)}" alt="">`
          : `<b>${escapeHtml(developer.slice(0, 2).toUpperCase())}</b>`;
        const marker = L.marker([live.coordinates.lat, live.coordinates.lng], {
          icon: L.divIcon({
            className: "developer-map-marker",
            html: `<span>${logo}</span>`,
            iconSize: [38, 44],
            iconAnchor: [19, 42],
          }),
          title: name,
        });
        marker.bindTooltip(escapeHtml(name), { direction: "top", offset: [0, -34] });
        marker.on("click", () => {
          window.location.href = `/projects/detail?name=${encodeURIComponent(name)}`;
        });
        markerRegistry.set(name, marker);
        clusters.addLayer(marker);
      });
      leafletMap.addLayer(clusters);
    })();
    return () => {
      cancelled = true;
      mapInstance.current = null;
      markerRegistry.clear();
      map?.remove();
    };
  }, [mappedProjects, operatingMetro]);

  // Language switch only needs new tiles — rebuilding the map would lose the
  // user's current pan and zoom.
  useEffect(() => {
    tileLayer.current?.setUrl(tileUrlFor(arabic));
  }, [arabic]);

  const revealProject = (name: string, point: MapPoint) => {
    mapInstance.current?.flyTo(point, 16, { animate: true, duration: 0.8 });
    window.setTimeout(() => projectMarkers.current.get(name)?.openTooltip(), 850);
  };

  return <main><Header />
    <PageIntro
      eyebrow={arabic ? "خريطة المشاريع + النقل" : "PROJECTS + TRANSPORT MAP"}
      title={arabic ? "المشاريع ومترو دبي." : "Projects and Dubai Metro."}
      intro={arabic ? "ابحث في دليل المشاريع الكامل واعرض أي دبوس مشروع موثّق مباشرة على الخريطة. خطوط النقل المستقبلية المتقطعة بتوضح الممرات والمحطات المُعلنة رسمياً." : "Search the complete project catalogue and reveal any verified project pin directly on the map. Dashed future transport lines show publicly announced corridors and stations."}
      action={<strong className="page-count">{allProjects.length.toLocaleString()} {arabic ? "مشروع" : "PROJECTS"} · {mappedProjects.length.toLocaleString()} {arabic ? "دبوس دقيق" : "EXACT PINS"}</strong>}
    />
    <section className="map-workspace">
      <div className="map-panel">
        <div className="map-summary"><strong>{allProjects.length.toLocaleString()}</strong><span>{arabic ? "مشروع في الدليل" : "catalogue projects"} · {mappedProjects.length.toLocaleString()} {arabic ? "دبوس موثّق" : "sourced pins"} · {(allProjects.length - mappedProjects.length).toLocaleString()} {arabic ? "إحداثية قيد الانتظار" : "coordinates pending"}</span></div>
        <div className="transport-summary">
          <span>{arabic ? "شبكة النقل" : "TRANSPORT OVERLAY"}</span>
          <strong>{arabic ? "مسارات تشغيل دقيقة" : "Precise operating tracks"}</strong>
          <small>{arabic ? "الخط الأحمر والأخضر ومسار 2020 ومحاذاة الخط الأزرق تحت الإنشاء بتستخدم هندسة سكة حقيقية. الخط الذهبي مُعلن لـ 2032، يبقى ممره المتقطع لسه إرشادي." : "Red, Green, Route 2020 and the Blue construction alignment use mapped rail geometry. Gold is announced for 2032, so its dashed corridor remains indicative."}</small>
        </div>
        <SearchBox value={query} onChange={setQuery} placeholder={arabic ? "ابحث عن مشروع أو مطور أو منطقة" : "Search a project, developer or area"} />
        <div className="map-results">{matches.map(({ project, live }) => {
          const name = project["Project Name | اسم المشروع"];
          const developer = live?.developer || project["Developer | المطور"] || (arabic ? "مطور قيد المراجعة" : "Developer under review");
          return <a
            href={`/projects/detail?name=${encodeURIComponent(name)}`}
            key={name}
            onClick={(event) => {
              if (!live?.coordinates) return;
              event.preventDefault();
              revealProject(name, [live.coordinates.lat, live.coordinates.lng]);
            }}
          >
            <span className={live?.developerLogo ? "result-logo" : !live?.coordinates ? "result-pending" : ""}>{live?.developerLogo ? <img src={live.developerLogo} alt="" /> : developer.slice(0, 2).toUpperCase()}</span>
            <div><strong>{live?.title || name}</strong><small>{areaFrom(live?.location || project["Location / Community | المنطقة"])} · {developer}</small>{live?.coordinates ? <small className="verified-location">{arabic ? "اعرض الدبوس المؤكد" : "SHOW EXACT PIN"}</small> : <small className="pending-location">{arabic ? "الإحداثيات قيد التحقق" : "MAP COORDINATES UNDER VERIFICATION"}</small>}</div><b>{live?.coordinates ? "◎" : "→"}</b>
          </a>;
        })}</div>
      </div>
      <div className="map-canvas live-map-canvas">
        <div ref={mapElement} className="leaflet-project-map" />
        <details className="metro-map-legend">
          <summary><span>{arabic ? "خطوط المترو" : "METRO LINES"}</span><b>{metroLines.length}</b></summary>
          <div className="metro-legend-list">
            {metroLines.map((line) => <div className="metro-legend-item" key={line.id}>
              <i style={{ backgroundColor: line.color }} className={line.status === "operating" ? "" : "future"} />
              <span><strong>{arabic ? line.nameAr : line.name}</strong><small>{arabic ? line.name : line.nameAr}</small></span>
              <b>{line.timing}</b>
            </div>)}
          </div>
          <div className="metro-symbol-key">
            <span><i className="solid" />{arabic ? "متاح" : "OPERATING"}</span>
            <span><i className="dashed" />{arabic ? "مستقبلي" : "FUTURE"}</span>
            <span><i className="station" />{arabic ? "محطة / موقع" : "STATION / LOCATION"}</span>
          </div>
          <p>{arabic ? "هندسة الخط الأحمر والأخضر ومسار 2020 والخط الأزرق تحت الإنشاء مصدرها علاقات مسارات OpenStreetMap؛ أسماء المحطات اتراجعت مقابل هيئة الطرق والمواصلات (RTA). الخط الذهبي لسه ممر مُعلن — مش هندسة سكة نهائية. تأكد من RTA قبل السفر." : "Red, Green, Route 2020 and Blue construction geometry are sourced from OpenStreetMap route relations; station names are cross-checked with RTA. Gold remains an announced corridor—not final track geometry. Check RTA before travel."}</p>
          <div className="metro-source-links">
            <a href="https://www.rta.ae/wps/portal/rta/ae/public-transport/metro-stations-map" target="_blank" rel="noreferrer">{arabic ? "شبكة RTA ↗" : "RTA NETWORK ↗"}</a>
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">{arabic ? "مسارات OSM ↗" : "OSM TRACKS ↗"}</a>
            <a href="https://www.mediaoffice.ae/en/news/2025/june/09-06/mohammed-bin-rashid-lays-foundation-stone-for-dubai-metro-blue-line" target="_blank" rel="noreferrer">{arabic ? "الخط الأزرق ↗" : "BLUE LINE ↗"}</a>
            <a href="https://www.mediaoffice.ae/en/news/2026/april/22-04/mohammed-bin-rashid-approves-dubai-metro-gold-line" target="_blank" rel="noreferrer">{arabic ? "الخط الذهبي ↗" : "GOLD LINE ↗"}</a>
          </div>
        </details>
      </div>
    </section>
    <DataNotice /><Footer />
  </main>;
}
