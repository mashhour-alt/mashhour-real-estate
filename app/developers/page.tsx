"use client";

import { useMemo, useState } from "react";
import { DataNotice, Footer, Header, PageIntro, SearchBox, usePlatformData, useProjectLiveData } from "../components";
import { useLanguage } from "../language-context";
import { areaFrom, developerUrl, money, type Developer } from "../data";

export default function DevelopersPage() {
  const data = usePlatformData();
  const liveData = useProjectLiveData();
  const { arabic } = useLanguage();
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState("");
  const [sort, setSort] = useState("projects");
  const directory = useMemo(() => {
    const scored = new Map((data?.developers || []).map((developer) => [developer.Developer.trim().toLowerCase(), developer]));
    const names = Array.from(new Set((data?.projects || []).map((project) => project["Developer | المطور"]?.trim()).filter((name): name is string => Boolean(name))));
    return names.map((name): Developer => scored.get(name.toLowerCase()) || {
      Developer: name,
      Tier: "PROFILE UNDER REVIEW",
      "Overall /10": null,
      "Delivery /10": null,
      "Quality /10": null,
      "Safety /10": null,
    });
  }, [data]);
  const profiles = useMemo(() => directory.map((developer) => {
    const projects = (data?.projects || []).filter((project) => project["Developer | المطور"] === developer.Developer);
    const areas = Array.from(new Set(projects.map((project) => areaFrom(project["Location / Community | المنطقة"])).filter(Boolean)));
    const prices = projects.map((project) => liveData[project["Project Name | اسم المشروع"]]?.startingPrice || project["Starting Price AED | السعر المبدئي"]).filter((value): value is number => typeof value === "number");
    const logo = projects.map((project) => liveData[project["Project Name | اسم المشروع"]]?.developerLogo).find(Boolean) || null;
    return { developer, projects, areas, priceFrom: prices.length ? Math.min(...prices) : null, logo };
  }).filter(({ developer }) => developer.Developer.toLowerCase().includes(query.toLowerCase()) && (!tier || developer.Tier === tier)).sort((a, b) => {
    if (sort === "score") return (b.developer["Overall /10"] || 0) - (a.developer["Overall /10"] || 0);
    if (sort === "name") return a.developer.Developer.localeCompare(b.developer.Developer);
    return b.projects.length - a.projects.length;
  }), [data, directory, liveData, query, tier, sort]);
  const tiers = useMemo(() => Array.from(new Set(directory.map((item) => item.Tier).filter((item): item is string => Boolean(item)))).sort(), [directory]);
  const totalProjects = profiles.reduce((sum, item) => sum + item.projects.length, 0);

  return (
    <main>
      <Header />
      <PageIntro
        eyebrow={arabic ? "دليل المطورين" : "DEVELOPER DIRECTORY"}
        title={arabic ? "كل مطور مرتبط، ظاهر." : "Every linked developer, visible."}
        intro={arabic ? "كل مطور مذكور في دليل المشاريع بيظهر هنا. درجات السجل بتظهر بس لما تتراجع؛ الملفات غير المُقيّمة بتفضل ظاهرة بدل ما تفقد مشاريعها." : "Every developer named in the project catalogue now appears here. Track-record scores are shown only when reviewed; unscored profiles remain visible instead of losing their projects."}
        action={<strong className="page-count">{profiles.length} {arabic ? "مطوّر" : "DEVELOPERS"}</strong>}
      />
      <section className="page-body">
        <div className="developer-summary">
          <div><strong>{profiles.length}</strong><span>{arabic ? "مطوّر مطابق" : "matching developers"}</span></div>
          <div><strong>{totalProjects.toLocaleString()}</strong><span>{arabic ? "مشروع مرتبط" : "linked projects"}</span></div>
          <div><strong>{profiles.filter((item) => developerUrl(item.developer.Developer)).length}</strong><span>{arabic ? "موقع رسمي مطابق" : "official websites matched"}</span></div>
        </div>
        <div className="developer-filters">
          <SearchBox value={query} onChange={setQuery} placeholder={arabic ? "ابحث عن مطور" : "Search a developer"} />
          <select aria-label="Developer tier" value={tier} onChange={(event) => setTier(event.target.value)}><option value="">{arabic ? "كل الفئات" : "All tiers"}</option>{tiers.map((item) => <option key={item}>{item}</option>)}</select>
          <select aria-label="Sort developers" value={sort} onChange={(event) => setSort(event.target.value)}><option value="projects">{arabic ? "الأكثر مشاريع" : "Most projects"}</option><option value="score">{arabic ? "الأعلى تقييماً" : "Highest score"}</option><option value="name">{arabic ? "الاسم أ–ي" : "Name A–Z"}</option></select>
        </div>
        <div className="developer-cards">
          {profiles.map(({ developer, projects, areas, priceFrom, logo }, index) => (
            <article key={developer.Developer}>
              <div className="developer-card-head">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div className="developer-logo">{logo ? <img src={logo} alt={`${developer.Developer} logo`} /> : <b>{developer.Developer.slice(0, 2).toUpperCase()}</b>}</div>
                <strong>{developer["Overall /10"]?.toFixed(1) || "—"}<small>/10</small></strong>
              </div>
              <div className="developer-card-copy"><p>{developer.Tier === "PROFILE UNDER REVIEW" ? (arabic ? "الملف قيد المراجعة" : "PROFILE UNDER REVIEW") : developer.Tier}</p><h2>{developer.Developer}</h2><span>{areas.slice(0, 3).join(" · ") || (arabic ? "محفظة دبي" : "Dubai portfolio")}</span></div>
              <dl>
                <div><dt>{arabic ? "المشاريع" : "PROJECTS"}</dt><dd>{projects.length}</dd></div>
                <div><dt>{arabic ? "المناطق" : "AREAS"}</dt><dd>{areas.length}</dd></div>
                <div><dt>{arabic ? "من" : "FROM"}</dt><dd>{money(priceFrom)}</dd></div>
              </dl>
              <div className="developer-scores">
                {([["Delivery", "التسليم", developer["Delivery /10"]], ["Quality", "الجودة", developer["Quality /10"]], ["Safety", "السلامة", developer["Safety /10"]]] as const).map(([label, labelAr, value]) => <div key={label}><span>{arabic ? labelAr : label}</span><i><b style={{ width: `${(value || 0) * 10}%` }} /></i><strong>{value?.toFixed(1) || "—"}</strong></div>)}
              </div>
              <div className="developer-card-actions">
                <a className="primary" href={`/projects?developer=${encodeURIComponent(developer.Developer)}`}>{arabic ? `عرض ${projects.length} مشروع` : `View ${projects.length} projects`} <b>→</b></a>
                {developerUrl(developer.Developer) ? <a href={developerUrl(developer.Developer)} target="_blank" rel="noreferrer" aria-label={`${developer.Developer} official website`}>{arabic ? "الموقع الرسمي ↗" : "Official ↗"}</a> : <span>{arabic ? "الرابط الرسمي قيد المراجعة" : "Official link under review"}</span>}
              </div>
            </article>
          ))}
        </div>
        {!profiles.length && <div className="project-filter-empty"><span>0</span><h2>{arabic ? "لم يتم العثور على مطور." : "No developer found."}</h2><p>{arabic ? "جرّب اسماً مختلفاً أو فئة أخرى." : "Try a different name or tier."}</p><button onClick={() => { setQuery(""); setTier(""); }}>{arabic ? "إعادة ضبط الفلاتر" : "Reset filters"}</button></div>}
      </section>
      <DataNotice />
      <Footer />
    </main>
  );
}
