"use client";

import { useMemo, useState } from "react";
import { DataNotice, Footer, FounderQuoteCarousel, Header, SearchBox, usePlatformData, useProjectLiveData, type FounderQuote } from "../components";
import { useLanguage } from "../language-context";
import { SponsoredLabel, useSponsorship } from "../sponsorship";
import { areaFrom, developerUrl, money, slugify, type Developer } from "../data";

const FOUNDER_QUOTES: FounderQuote[] = [
  {
    name: "Hussain Sajwani",
    nameAr: "حسين سجواني",
    developer: "Founder & Chairman, DAMAC Properties",
    developerAr: "المؤسس ورئيس مجلس الإدارة، داماك العقارية",
    quote: "\u201cMy dream is to have DAMAC towers in important gateway cities around the world.\u201d",
    quoteAr: "\u201cحلمي إن أشوف أبراج داماك في أهم مدن العالم.\u201d",
    source: "Arabian Business",
  },
  {
    name: "Mohamed Alabbar",
    nameAr: "محمد العبار",
    developer: "Founder & Chairman, Emaar Properties",
    developerAr: "المؤسس ورئيس مجلس الإدارة، إعمار العقارية",
    quote: "\u201cMake mistakes. Learn quickly. Develop yourself constantly.\u201d",
    quoteAr: "\u201cاغلط، اتعلم بسرعة، وطوّر نفسك باستمرار.\u201d",
    source: "Arageek",
  },
  {
    name: "Farhad Azizi",
    nameAr: "فرهاد عزيزي",
    developer: "CEO, Azizi Developments",
    developerAr: "الرئيس التنفيذي، عزيزي للتطوير العقاري",
    quote: "\u201cOur goal is to enhance the lives of our customers through world-class properties.\u201d",
    quoteAr: "\u201cهدفنا إننا نحسّن حياة عملائنا بعقارات بمستوى عالمي.\u201d",
    source: "UAE Stories",
  },
  {
    name: "Muhammad BinGhatti",
    nameAr: "محمد بن غاطي",
    developer: "Chairman, Binghatti Holding",
    developerAr: "رئيس مجلس الإدارة، بن غاطي القابضة",
    quote: "\u201cWe are striving to become the Apple of real estate.\u201d",
    quoteAr: "\u201cبنسعى إننا نبقى Apple صناعة العقارات.\u201d",
    source: "Sustainable Business Magazine",
  },
  {
    name: "Rizwan Sajan",
    nameAr: "رضوان سجان",
    developer: "Founder & Chairman, Danube Properties",
    developerAr: "المؤسس ورئيس مجلس الإدارة، دانوب العقارية",
    quote: "\u201cKnown as Dubai's \u20181% Man\u2019 for pioneering the 1% monthly payment plan.\u201d",
    quoteAr: "\u201cمعروف بلقب \u2018راجل الـ1%\u2019 في دبي، صاحب خطة الدفع الشهرية الشهيرة.\u201d",
    source: "Gulf News",
  },
];

export default function DevelopersPage() {
  const data = usePlatformData();
  const liveData = useProjectLiveData();
  const { arabic } = useLanguage();
  const sponsorship = useSponsorship();
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
      <FounderQuoteCarousel
        eyebrow={arabic ? "دليل المطورين" : "DEVELOPER DIRECTORY"}
        quotes={FOUNDER_QUOTES}
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
              <a className="developer-card-head" href={`/developers/${slugify(developer.Developer)}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div className="developer-logo">{logo ? <img src={logo} alt={`${developer.Developer} logo`} /> : <b>{developer.Developer.slice(0, 2).toUpperCase()}</b>}</div>
                <strong>{developer["Overall /10"]?.toFixed(1) || "—"}<small>/10</small></strong>
              </a>
              <a className="developer-card-copy" href={`/developers/${slugify(developer.Developer)}`}><p>{developer.Tier === "PROFILE UNDER REVIEW" ? (arabic ? "الملف قيد المراجعة" : "PROFILE UNDER REVIEW") : developer.Tier}</p><h2>{developer.Developer}</h2><span>{areas.slice(0, 3).join(" · ") || (arabic ? "محفظة دبي" : "Dubai portfolio")}</span></a>
              {sponsorship.featuredDevelopers.includes(developer.Developer) ? <SponsoredLabel variant="developer" /> : null}
              <dl>
                <div><dt>{arabic ? "المشاريع" : "PROJECTS"}</dt><dd>{projects.length}</dd></div>
                <div><dt>{arabic ? "المناطق" : "AREAS"}</dt><dd>{areas.length}</dd></div>
                <div><dt>{arabic ? "من" : "FROM"}</dt><dd>{money(priceFrom)}</dd></div>
              </dl>
              <div className="developer-scores">
                {([["Delivery", "التسليم", developer["Delivery /10"]], ["Quality", "الجودة", developer["Quality /10"]], ["Safety", "السلامة", developer["Safety /10"]]] as const).map(([label, labelAr, value]) => <div key={label}><span>{arabic ? labelAr : label}</span><i><b style={{ width: `${(value || 0) * 10}%` }} /></i><strong>{value?.toFixed(1) || "—"}</strong></div>)}
              </div>
              <div className="developer-card-actions">
                <a className="primary" href={`/developers/${slugify(developer.Developer)}`}>{arabic ? "عرض الملف" : "View profile"} <b>→</b></a>
                <a href={`/projects?developer=${encodeURIComponent(developer.Developer)}`}>{arabic ? `${projects.length} مشروع` : `${projects.length} projects`}</a>
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
