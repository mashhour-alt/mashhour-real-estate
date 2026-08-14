"use client";

import { useMemo, useState } from "react";
import { Footer, Header, PageIntro, SearchBox, usePlatformData } from "../components";
import { useLanguage } from "../language-context";
import type { Area } from "../data";
import { PageSeo } from "../seo";

export default function AreasPage() {
  const data = usePlatformData();
  const { arabic } = useLanguage();
  const [query, setQuery] = useState("");
  const areas = useMemo(() => {
    const map = new Map<string, Area>();
    (data?.areas || []).forEach((item) => { if (!map.has(item.Area)) map.set(item.Area, item); });
    return Array.from(map.values()).filter((item) => item.Area.toLowerCase().includes(query.toLowerCase()));
  }, [data, query]);
  return <main><Header /><PageSeo title="Dubai Areas | Property Market & Off-Plan Projects" description="Browse Dubai communities with price-per-sqft benchmarks, gross yield references and the off-plan projects located in each area." /><PageIntro eyebrow={arabic ? "ذكاء المناطق" : "AREA INTELLIGENCE"} title={arabic ? "كل منطقة في دبي، متصلة." : "Every Dubai area, connected."} intro={arabic ? "افتح منطقة عشان تشوف معدلاتها، أدلة تحريرية، ومسار مباشر للمشاريع الموجودة فيها." : "Open an area to see its benchmarks, editorial guides and a direct path to the projects located there."} action={<strong className="page-count">{areas.length} {arabic ? "منطقة" : "AREAS"}</strong>} /><section className="page-body"><SearchBox value={query} onChange={setQuery} placeholder={arabic ? "ابحث عن منطقة" : "Search areas"} /><div className="area-directory">{areas.map((item, index) => <a href={`/projects?area=${encodeURIComponent(item.Area)}`} key={item.Area}><span>{String(index + 1).padStart(2, "0")}</span><h2>{item.Area}</h2><p>{item["Asset Type"]} · {item.Tier || (arabic ? "مرجع سوقي" : "Market reference")}</p><div><strong>{item["PSF Benchmark"] ? `AED ${item["PSF Benchmark"].toLocaleString()}` : "—"}</strong><small>{arabic ? "معدل السعر لكل قدم مربع" : "PSF benchmark"}</small></div><div><strong>{item["Gross Yield"] ? `${(item["Gross Yield"] * 100).toFixed(1)}%` : "—"}</strong><small>{arabic ? "العائد الإجمالي" : "Gross yield"}</small></div><b>{arabic ? "عرض المشاريع ↗" : "View projects ↗"}</b></a>)}</div></section><Footer /></main>;
}
