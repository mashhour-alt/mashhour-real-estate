"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import ProjectMap, { type MapProject } from "./ProjectMap";

type Project = {
  "Project Name | اسم المشروع": string;
  "Developer | المطور": string;
  "Segment | القطاع": string | null;
  "Unit Type | نوع الوحدة": string | null;
  "Location / Community | المنطقة": string | null;
  "Handover | التسليم": string | null;
  "Starting Price AED | السعر المبدئي": number | null;
  "Booking % | الحجز": number | null;
  "During Construction % | أثناء الإنشاء": number | null;
  "At Handover % | عند التسليم": number | null;
  "Escrow Account Status | حالة حساب الضمان": string | null;
  "Data Status | حالة البيانات": string | null;
};

type Developer = {
  Developer: string;
  Tier: string | null;
  "Overall /10": number | null;
  "Delivery /10": number | null;
  "Quality /10": number | null;
  "Safety /10": number | null;
};

type Area = {
  Area: string;
  Segment: string;
  "Asset Type": string;
  "PSF Benchmark": number | null;
  "Gross Yield": number | null;
  "Demand /10": number | null;
  Tier: string | null;
};

type Data = { projects: Project[]; developers: Developer[]; areas: Area[] };
type Lang = "en" | "ar" | "it";

const copy = {
  en: {
    nav: ["Map", "Projects", "Compare", "Market", "Developers"],
    eyebrow: "Dubai off-plan intelligence",
    titleA: "See the deal.",
    titleB: "Not the sales pitch.",
    intro:
      "Search, filter and compare Dubai off-plan projects using one structured market reference.",
    explore: "Explore projects",
    compare: "Compare projects",
    search: "Search by project, developer or area",
    allAreas: "All areas",
    allDevelopers: "All developers",
    projects: "Projects",
    developers: "Developers",
    areas: "Area benchmarks",
    verified: "Escrow matched",
    comparison: "Live comparison",
    comparisonSub: "Select up to 5 projects. The clearest differences stay visible.",
    emptyCompare: "Add projects from the cards below to start comparing.",
    market: "Dubai area benchmarks",
    marketSub: "Indicative reference points from the workbook, not a valuation.",
    developerTitle: "Developer scorecard",
    developerSub: "A structured view of delivery, quality and safety.",
    leadTitle: "Need a shortlist built around your budget?",
    leadSub: "Share the basics and Mashhour Real Estate will prepare a focused comparison.",
    send: "Request a shortlist",
    success: "Thank you — your request is ready for follow-up.",
    mapTitle: "Dubai project map",
    mapSub: "Explore mapped communities, then open any project for the complete record.",
    mapMapped: "SELECTED AREA",
    mapHint: "Select a project cluster on the map.",
    mapEmpty: "Pins use community centres and are indicative, not plot boundaries.",
  },
  ar: {
    nav: ["الخريطة", "المشاريع", "المقارنة", "السوق", "المطورون"],
    eyebrow: "مرجع الأوف بلان في دبي",
    titleA: "شوف الصفقة.",
    titleB: "مش كلام المبيعات.",
    intro: "ابحث وفلتر وقارن مشاريع دبي الأوف بلان من قاعدة بيانات منظمة واحدة.",
    explore: "استكشف المشاريع",
    compare: "قارن المشاريع",
    search: "ابحث بالمشروع أو المطور أو المنطقة",
    allAreas: "كل المناطق",
    allDevelopers: "كل المطورين",
    projects: "مشروع",
    developers: "مطور",
    areas: "مؤشر منطقة",
    verified: "حساب ضمان مطابق",
    comparison: "مقارنة مباشرة",
    comparisonSub: "اختار لحد 5 مشاريع وشوف الفروق الأساسية بوضوح.",
    emptyCompare: "ضيف مشاريع من الكروت اللي تحت علشان تبدأ المقارنة.",
    market: "مؤشرات مناطق دبي",
    marketSub: "مؤشرات استرشادية من الشيت وليست تقييمًا عقاريًا.",
    developerTitle: "تقييم المطورين",
    developerSub: "نظرة منظمة على التسليم والجودة والأمان.",
    leadTitle: "محتاج قائمة مشاريع مناسبة لميزانيتك؟",
    leadSub: "سيب بياناتك وMashhour Real Estate يجهز لك مقارنة مركزة.",
    send: "اطلب القائمة",
    success: "شكرًا — طلبك جاهز للمتابعة.",
    mapTitle: "خريطة مشاريع دبي",
    mapSub: "استكشف المناطق واضغط على أي مشروع لفتح كل بياناته.",
    mapMapped: "المنطقة المختارة",
    mapHint: "اختار تجمع مشاريع من الخريطة.",
    mapEmpty: "النقاط في مراكز المناطق استرشادية وليست حدود قطع الأراضي.",
  },
  it: {
    nav: ["Mappa", "Progetti", "Confronta", "Mercato", "Developer"],
    eyebrow: "Intelligence off-plan a Dubai",
    titleA: "Vedi l’affare.",
    titleB: "Non il discorso di vendita.",
    intro: "Cerca, filtra e confronta i progetti off-plan di Dubai in un unico riferimento.",
    explore: "Esplora i progetti",
    compare: "Confronta",
    search: "Cerca progetto, developer o zona",
    allAreas: "Tutte le zone",
    allDevelopers: "Tutti i developer",
    projects: "Progetti",
    developers: "Developer",
    areas: "Zone",
    verified: "Escrow verificato",
    comparison: "Confronto live",
    comparisonSub: "Seleziona fino a 5 progetti e confronta i dati essenziali.",
    emptyCompare: "Aggiungi progetti dalle schede per iniziare.",
    market: "Benchmark delle zone",
    marketSub: "Riferimenti indicativi del file, non una valutazione.",
    developerTitle: "Scorecard developer",
    developerSub: "Consegna, qualità e sicurezza in una vista strutturata.",
    leadTitle: "Vuoi una shortlist per il tuo budget?",
    leadSub: "Condividi i dettagli e Mashhour Real Estate preparerà il confronto.",
    send: "Richiedi shortlist",
    success: "Grazie — la tua richiesta è pronta.",
    mapTitle: "Mappa progetti Dubai",
    mapSub: "Esplora le comunità e apri ogni progetto per tutti i dettagli.",
    mapMapped: "ZONA SELEZIONATA",
    mapHint: "Seleziona un gruppo di progetti sulla mappa.",
    mapEmpty: "I punti indicano il centro della comunità, non i confini del lotto.",
  },
};

const money = (value: number | null) =>
  value
    ? new Intl.NumberFormat("en-AE", {
        style: "currency",
        currency: "AED",
        maximumFractionDigits: 0,
      }).format(value)
    : "On request";

const areaFrom = (value: string | null) => {
  if (!value) return "Dubai";
  const parts = value.split(",").map((item) => item.trim()).filter(Boolean);
  return parts[1] || parts[0] || "Dubai";
};

const projectImages = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=900&q=82",
];

const imageFor = (project: Project) => {
  const key = `${project["Project Name | اسم المشروع"]}${project["Developer | المطور"]}`;
  const hash = Array.from(key).reduce((total, char) => total + char.charCodeAt(0), 0);
  return projectImages[hash % projectImages.length];
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const propertyFinderUrl = (project: Project) =>
  `https://www.propertyfinder.ae/en/new-projects/${slugify(project["Developer | المطور"])}/${slugify(project["Project Name | اسم المشروع"])}`;

const developerWebsites: Record<string, string> = {
  "Emaar Properties": "https://www.emaar.com/",
  "Sobha Realty": "https://sobharealty.com/",
  "Nakheel": "https://www.nakheel.com/",
  "Meraas": "https://meraas.com/",
  "Meraas Holding": "https://meraas.com/",
  "Dubai Holding Real Estate": "https://dubaiholding.com/en/real-estate/",
  "Omniyat": "https://www.omniyat.com/",
  "Majid Al Futtaim": "https://www.majidalfuttaim.com/",
  "Select Group": "https://www.select-group.ae/",
  "Ellington Properties": "https://ellingtonproperties.ae/",
  "Ellington": "https://ellingtonproperties.ae/",
  "Damac Properties": "https://www.damacproperties.com/",
  "Azizi Developments": "https://www.azizidevelopments.com/",
  "Binghatti Developers": "https://www.binghatti.com/",
  "Imtiaz Developments": "https://imtiaz.ae/",
  "Aldar Properties PJSC": "https://www.aldar.com/",
  "ARADA": "https://www.arada.com/",
  "Nshama": "https://nshama.ae/",
  "Samana Developers": "https://www.samanadevelopers.com/",
  "Object 1": "https://object-1.com/",
  "Danube Properties": "https://danubeproperties.com/",
  "Mr Eight Development": "https://mreight.ae/",
  "Zaya": "https://zaya.com/",
};

const developerUrl = (name: string) =>
  developerWebsites[name] ||
  `https://www.google.com/search?q=${encodeURIComponent(`${name} official website Dubai developer`)}`;

export default function Home() {
  const [data, setData] = useState<Data | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [developer, setDeveloper] = useState("");
  const [visible, setVisible] = useState(12);
  const [compare, setCompare] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sent, setSent] = useState(false);
  const t = copy[lang];

  useEffect(() => {
    fetch("/data/offplan.json")
      .then((response) => response.json())
      .then(setData);
  }, []);

  const areas = useMemo(
    () =>
      Array.from(
        new Set((data?.projects || []).map((project) => areaFrom(project["Location / Community | المنطقة"]))),
      ).sort(),
    [data],
  );
  const developers = useMemo(
    () =>
      Array.from(
        new Set((data?.projects || []).map((project) => project["Developer | المطور"]).filter(Boolean)),
      ).sort(),
    [data],
  );

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return (data?.projects || []).filter((project) => {
      const projectArea = areaFrom(project["Location / Community | المنطقة"]);
      const haystack = [
        project["Project Name | اسم المشروع"],
        project["Developer | المطور"],
        projectArea,
      ]
        .join(" ")
        .toLowerCase();
      return (!needle || haystack.includes(needle)) &&
        (!area || projectArea === area) &&
        (!developer || project["Developer | المطور"] === developer);
    });
  }, [data, query, area, developer]);

  const verifiedCount = useMemo(
    () =>
      (data?.projects || []).filter((project) =>
        project["Escrow Account Status | حالة حساب الضمان"]?.includes("Verified"),
      ).length,
    [data],
  );

  const toggleCompare = (project: Project) => {
    const name = project["Project Name | اسم المشروع"];
    setCompare((current) => {
      if (current.some((item) => item["Project Name | اسم المشروع"] === name)) {
        return current.filter((item) => item["Project Name | اسم المشروع"] !== name);
      }
      return current.length < 5 ? [...current, project] : current;
    });
  };

  const submitLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  useEffect(() => {
    if (!selectedProject) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedProject(null);
    };
    document.addEventListener("keydown", close);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", close);
      document.body.classList.remove("modal-open");
    };
  }, [selectedProject]);

  const selectedDeveloper = selectedProject
    ? data?.developers.find(
        (item) =>
          item.Developer === selectedProject["Developer | المطور"] ||
          selectedProject["Developer | المطور"].includes(item.Developer),
      )
    : null;
  const selectedArea = selectedProject
    ? data?.areas.find((item) => item.Area === areaFrom(selectedProject["Location / Community | المنطقة"]))
    : null;

  return (
    <main dir={lang === "ar" ? "rtl" : "ltr"}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Mashhour Real Estate home">
          <span className="logo-window">
            <img src="/assets/mashhour-black.png" alt="Mashhour Real Estate" />
          </span>
          <span>REAL ESTATE</span>
        </a>
        <nav>
          {t.nav.map((item, index) => (
            <a key={item} href={["#map", "#projects", "#compare", "#market", "#developers"][index]}>
              {item}
            </a>
          ))}
        </nav>
        <div className="lang-switch" aria-label="Language">
          {(["en", "ar", "it"] as Lang[]).map((item) => (
            <button className={lang === item ? "active" : ""} key={item} onClick={() => setLang(item)}>
              {item.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><span />{t.eyebrow}</p>
            <h1>{t.titleA}<br /><em>{t.titleB}</em></h1>
            <p className="hero-intro">{t.intro}</p>
            <div className="hero-actions">
              <a className="button primary" href="#projects">{t.explore} <b>↗</b></a>
              <a className="button ghost" href="#compare">{t.compare} <b>→</b></a>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="red-orbit" />
            <div className="tower tower-one"><i /><i /><i /><i /></div>
            <div className="tower tower-two"><i /><i /><i /></div>
            <div className="tower tower-three"><i /><i /><i /><i /></div>
            <div className="hero-stamp">DUBAI<br /><strong>2026</strong></div>
            <p>OFF-PLAN<br />MARKET VIEW</p>
          </div>
        </div>
        <div className="stats">
          <div><strong>{data?.projects.length.toLocaleString() || "—"}</strong><span>{t.projects}</span></div>
          <div><strong>{data?.developers.length.toLocaleString() || "—"}</strong><span>{t.developers}</span></div>
          <div><strong>{data?.areas.length.toLocaleString() || "—"}</strong><span>{t.areas}</span></div>
          <div><strong>{verifiedCount.toLocaleString()}</strong><span>{t.verified}</span></div>
        </div>
      </section>

      <section className="section map-section" id="map">
        <div className="section-head">
          <div><span className="section-number">01</span><p>LOCATION INTELLIGENCE</p><h2>{t.mapTitle}</h2><small>{t.mapSub}</small></div>
        </div>
        <ProjectMap
          projects={filtered as MapProject[]}
          onSelect={(project) => setSelectedProject(project as Project)}
          labels={{ mapped: t.mapMapped, projects: t.projects, hint: t.mapHint, empty: t.mapEmpty }}
        />
      </section>

      <section className="section light" id="projects">
        <div className="section-head">
          <div><span className="section-number">02</span><p>PROJECT DATABASE</p><h2>{t.explore}</h2></div>
          <span className="result-count">{filtered.length.toLocaleString()} results</span>
        </div>
        <div className="filters">
          <label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} /></label>
          <select value={area} onChange={(e) => setArea(e.target.value)}><option value="">{t.allAreas}</option>{areas.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={developer} onChange={(e) => setDeveloper(e.target.value)}><option value="">{t.allDevelopers}</option>{developers.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <div className="project-grid">
          {filtered.slice(0, visible).map((project, index) => {
            const selected = compare.some((item) => item["Project Name | اسم المشروع"] === project["Project Name | اسم المشروع"]);
            return (
              <article
                className="project-card"
                key={`${project["Project Name | اسم المشروع"]}-${index}`}
                role="button"
                tabIndex={0}
                aria-label={`Open details for ${project["Project Name | اسم المشروع"]}`}
                onClick={() => setSelectedProject(project)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedProject(project);
                }}
              >
                <div className="card-art">
                  <img
                    src={`/api/project-image?url=${encodeURIComponent(propertyFinderUrl(project))}`}
                    alt={`${project["Project Name | اسم المشروع"]} — ${project["Developer | المطور"]}`}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = imageFor(project);
                    }}
                  />
                  <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="official-source">PROPERTY FINDER</span>
                  <strong className="developer-badge">{project["Developer | المطور"]}</strong>
                </div>
                <div className="card-body">
                  <p>{areaFrom(project["Location / Community | المنطقة"])}</p>
                  <h3>{project["Project Name | اسم المشروع"]}</h3>
                  <div className="developer-name">
                    <small>DEVELOPER</small>
                    <strong>{project["Developer | المطور"]}</strong>
                  </div>
                  <dl>
                    <div><dt>FROM</dt><dd>{money(project["Starting Price AED | السعر المبدئي"])}</dd></div>
                    <div><dt>HANDOVER</dt><dd>{project["Handover | التسليم"] || "TBA"}</dd></div>
                  </dl>
                  <div className="card-actions">
                    <button className="details-button" onClick={(event) => { event.stopPropagation(); setSelectedProject(project); }}>
                      View details ↗
                    </button>
                    <button className={selected ? "compare-button selected" : "compare-button"} onClick={(event) => { event.stopPropagation(); toggleCompare(project); }}>
                    {selected ? "✓ Selected" : compare.length >= 5 ? "5 selected" : "+ Compare"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {visible < filtered.length && <button className="load-more" onClick={() => setVisible((n) => n + 12)}>Load more projects ↓</button>}
      </section>

      <section className="section dark" id="compare">
        <div className="section-head inverse">
          <div><span className="section-number">03</span><p>DECISION TOOL</p><h2>{t.comparison}</h2><small>{t.comparisonSub}</small></div>
          <span className="compare-count">{compare.length}/5</span>
        </div>
        {compare.length === 0 ? (
          <div className="empty-compare"><span>＋</span><p>{t.emptyCompare}</p></div>
        ) : (
          <div className="compare-table-wrap">
            <table>
              <thead><tr><th>Metric</th>{compare.map((project) => <th key={project["Project Name | اسم المشروع"]}><span>{project["Project Name | اسم المشروع"]}</span><small>{project["Developer | المطور"]}</small><button onClick={() => toggleCompare(project)}>×</button></th>)}</tr></thead>
              <tbody>
                <tr><td>Developer</td>{compare.map((p) => <td key={p["Project Name | اسم المشروع"]}>{p["Developer | المطور"]}</td>)}</tr>
                <tr><td>Area</td>{compare.map((p) => <td key={p["Project Name | اسم المشروع"]}>{areaFrom(p["Location / Community | المنطقة"])}</td>)}</tr>
                <tr><td>Starting price</td>{compare.map((p) => <td key={p["Project Name | اسم المشروع"]}>{money(p["Starting Price AED | السعر المبدئي"])}</td>)}</tr>
                <tr><td>Handover</td>{compare.map((p) => <td key={p["Project Name | اسم المشروع"]}>{p["Handover | التسليم"] || "TBA"}</td>)}</tr>
                <tr><td>Booking</td>{compare.map((p) => <td key={p["Project Name | اسم المشروع"]}>{p["Booking % | الحجز"] != null ? `${p["Booking % | الحجز"]! * 100}%` : "—"}</td>)}</tr>
                <tr><td>At handover</td>{compare.map((p) => <td key={p["Project Name | اسم المشروع"]}>{p["At Handover % | عند التسليم"] != null ? `${p["At Handover % | عند التسليم"]! * 100}%` : "—"}</td>)}</tr>
                <tr><td>Escrow</td>{compare.map((p) => <td key={p["Project Name | اسم المشروع"]}><span className={p["Escrow Account Status | حالة حساب الضمان"]?.includes("Verified") ? "status verified" : "status"}>{p["Escrow Account Status | حالة حساب الضمان"] || "Unverified"}</span></td>)}</tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="section warm" id="market">
        <div className="section-head"><div><span className="section-number">04</span><p>AREA INTELLIGENCE</p><h2>{t.market}</h2><small>{t.marketSub}</small></div></div>
        <div className="area-grid">
          {(data?.areas || []).filter((item) => item["PSF Benchmark"]).slice(0, 8).map((item, index) => (
            <article className="area-card" key={`${item.Area}-${item["Asset Type"]}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.Area}</h3><p>{item["Asset Type"]} · {item.Tier}</p>
              <div><strong>AED {item["PSF Benchmark"]?.toLocaleString()}</strong><small>PSF benchmark</small></div>
              <div><strong>{item["Gross Yield"] ? `${(item["Gross Yield"] * 100).toFixed(1)}%` : "—"}</strong><small>Gross yield</small></div>
            </article>
          ))}
        </div>
      </section>

      <section className="section light" id="developers">
        <div className="section-head"><div><span className="section-number">05</span><p>TRACK RECORD</p><h2>{t.developerTitle}</h2><small>{t.developerSub}</small></div></div>
        <div className="developer-list">
          {(data?.developers || []).filter((item) => item["Overall /10"]).sort((a, b) => (b["Overall /10"] || 0) - (a["Overall /10"] || 0)).slice(0, 10).map((item, index) => (
            <article key={item.Developer}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <div><h3><a href={developerUrl(item.Developer)} target="_blank" rel="noreferrer">{item.Developer} ↗</a></h3><p>{item.Tier}</p></div>
              <div className="score-bar"><i style={{ width: `${(item["Overall /10"] || 0) * 10}%` }} /></div>
              <strong>{item["Overall /10"]?.toFixed(1)}</strong><span>/10</span>
            </article>
          ))}
        </div>
      </section>

      <section className="lead-section">
        <div><p>MASHHOUR REAL ESTATE</p><h2>{t.leadTitle}</h2><span>{t.leadSub}</span></div>
        <form onSubmit={submitLead}>
          <input required placeholder={lang === "ar" ? "الاسم" : "Name"} />
          <input required type="tel" placeholder={lang === "ar" ? "رقم الهاتف" : "Phone"} />
          <input required type="email" placeholder={lang === "ar" ? "البريد الإلكتروني" : "Email"} />
          <select defaultValue=""><option value="" disabled>{lang === "ar" ? "الميزانية" : "Budget"}</option><option>Under AED 1M</option><option>AED 1M–2M</option><option>AED 2M–5M</option><option>AED 5M+</option></select>
          <button>{t.send} ↗</button>
          {sent && <p className="success">{t.success}</p>}
        </form>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><span className="logo-window"><img src="/assets/mashhour-white.png" alt="Mashhour Real Estate" /></span><span>REAL ESTATE</span></a>
        <p>Dubai off-plan comparison & market intelligence.</p>
        <span>© 2026 Mashhour Real Estate</span>
      </footer>

      {selectedProject && (
        <div className="project-modal" role="dialog" aria-modal="true" aria-label={`${selectedProject["Project Name | اسم المشروع"]} details`}>
          <button className="modal-backdrop" aria-label="Close project details" onClick={() => setSelectedProject(null)} />
          <article className="modal-panel">
            <button className="modal-close" aria-label="Close" onClick={() => setSelectedProject(null)}>×</button>
            <div className="modal-hero">
              <img
                src={`/api/project-image?url=${encodeURIComponent(propertyFinderUrl(selectedProject))}`}
                alt={selectedProject["Project Name | اسم المشروع"]}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = imageFor(selectedProject);
                }}
              />
              <div className="modal-title">
                <p>{areaFrom(selectedProject["Location / Community | المنطقة"])}</p>
                <h2>{selectedProject["Project Name | اسم المشروع"]}</h2>
                <strong>{selectedProject["Developer | المطور"]}</strong>
              </div>
            </div>
            <div className="modal-content">
              <section className="detail-summary">
                <div><small>STARTING PRICE</small><strong>{money(selectedProject["Starting Price AED | السعر المبدئي"])}</strong></div>
                <div><small>HANDOVER</small><strong>{selectedProject["Handover | التسليم"] || "TBA"}</strong></div>
                <div><small>SEGMENT</small><strong>{selectedProject["Segment | القطاع"] || "—"}</strong></div>
                <div><small>UNIT TYPE</small><strong>{selectedProject["Unit Type | نوع الوحدة"] || "Multiple / TBA"}</strong></div>
              </section>

              <section className="detail-block">
                <div className="detail-heading"><span>01</span><h3>Project information</h3></div>
                <dl className="detail-grid">
                  <div><dt>Full location</dt><dd>{selectedProject["Location / Community | المنطقة"] || "Dubai"}</dd></div>
                  <div><dt>Developer</dt><dd>{selectedProject["Developer | المطور"]}</dd></div>
                  <div><dt>Escrow status</dt><dd><span className={selectedProject["Escrow Account Status | حالة حساب الضمان"]?.includes("Verified") ? "status verified-light" : "status"}>{selectedProject["Escrow Account Status | حالة حساب الضمان"] || "Unverified"}</span></dd></div>
                  <div><dt>Data status</dt><dd>{selectedProject["Data Status | حالة البيانات"] || "—"}</dd></div>
                </dl>
              </section>

              <section className="detail-block">
                <div className="detail-heading"><span>02</span><h3>Payment plan</h3></div>
                <div className="payment-plan">
                  <div style={{ flex: selectedProject["Booking % | الحجز"] || 0 }}><strong>{selectedProject["Booking % | الحجز"] != null ? `${selectedProject["Booking % | الحجز"]! * 100}%` : "—"}</strong><span>Booking</span></div>
                  <div style={{ flex: selectedProject["During Construction % | أثناء الإنشاء"] || 0 }}><strong>{selectedProject["During Construction % | أثناء الإنشاء"] != null ? `${selectedProject["During Construction % | أثناء الإنشاء"]! * 100}%` : "—"}</strong><span>Construction</span></div>
                  <div style={{ flex: selectedProject["At Handover % | عند التسليم"] || 0 }}><strong>{selectedProject["At Handover % | عند التسليم"] != null ? `${selectedProject["At Handover % | عند التسليم"]! * 100}%` : "—"}</strong><span>Handover</span></div>
                </div>
              </section>

              <section className="detail-block">
                <div className="detail-heading"><span>03</span><h3>Developer & area intelligence</h3></div>
                <div className="intelligence-grid">
                  <div><small>DEVELOPER SCORE</small><strong>{selectedDeveloper?.["Overall /10"]?.toFixed(1) || "—"}<em>/10</em></strong><span>{selectedDeveloper?.Tier || "Not scored"}</span></div>
                  <div><small>DELIVERY</small><strong>{selectedDeveloper?.["Delivery /10"]?.toFixed(1) || "—"}<em>/10</em></strong></div>
                  <div><small>AREA PSF</small><strong>{selectedArea?.["PSF Benchmark"] ? `AED ${selectedArea["PSF Benchmark"].toLocaleString()}` : "—"}</strong></div>
                  <div><small>GROSS YIELD</small><strong>{selectedArea?.["Gross Yield"] ? `${(selectedArea["Gross Yield"] * 100).toFixed(1)}%` : "—"}</strong></div>
                </div>
              </section>

              <section className="source-actions">
                <a href={propertyFinderUrl(selectedProject)} target="_blank" rel="noreferrer">View original project source <b>↗</b></a>
                <a href={developerUrl(selectedProject["Developer | المطور"])} target="_blank" rel="noreferrer">Developer website <b>↗</b></a>
              </section>
              <p className="source-note">Project imagery and public listing details are linked to Property Finder. Prices and availability may change; verify the latest developer price list and SPA before advising a client.</p>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
