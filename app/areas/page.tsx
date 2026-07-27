"use client";

import { useMemo, useState } from "react";
import { Footer, Header, PageIntro, SearchBox, usePlatformData } from "../components";
import type { Area } from "../data";

export default function AreasPage() {
  const data = usePlatformData();
  const [query, setQuery] = useState("");
  const areas = useMemo(() => {
    const map = new Map<string, Area>();
    (data?.areas || []).forEach((item) => { if (!map.has(item.Area)) map.set(item.Area, item); });
    return Array.from(map.values()).filter((item) => item.Area.toLowerCase().includes(query.toLowerCase()));
  }, [data, query]);
  return <main><Header /><PageIntro eyebrow="AREA INTELLIGENCE" title="Every Dubai area, connected." intro="Open an area to see its benchmarks, editorial guides and a direct path to the projects located there." action={<strong className="page-count">{areas.length} AREAS</strong>} /><section className="page-body"><SearchBox value={query} onChange={setQuery} placeholder="Search areas" /><div className="area-directory">{areas.map((item, index) => <a href={`/projects?area=${encodeURIComponent(item.Area)}`} key={item.Area}><span>{String(index + 1).padStart(2, "0")}</span><h2>{item.Area}</h2><p>{item["Asset Type"]} · {item.Tier || "Market reference"}</p><div><strong>{item["PSF Benchmark"] ? `AED ${item["PSF Benchmark"].toLocaleString()}` : "—"}</strong><small>PSF benchmark</small></div><div><strong>{item["Gross Yield"] ? `${(item["Gross Yield"] * 100).toFixed(1)}%` : "—"}</strong><small>Gross yield</small></div><b>View projects ↗</b></a>)}</div></section><Footer /></main>;
}
