"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ContactDock, DataNotice, Footer, Header, LeadSection, usePlatformData, useProjectLiveData } from "./components";
import { useLanguage } from "./language-context";
import { projectImages } from "./data";

const destinations = [
  {
    href: "/projects",
    number: "01",
    title: { en: "Projects", ar: "المشاريع" },
    copy: {
      en: "Search Dubai off-plan inventory with focused filters and complete project pages.",
      ar: "استكشف مشاريع دبي على الخريطة (Off-Plan) بفلاتر دقيقة وصفحات مشاريع كاملة.",
    },
    image: projectImages[0],
  },
  {
    href: "/map",
    number: "02",
    title: { en: "Interactive map", ar: "الخريطة التفاعلية" },
    copy: {
      en: "Explore projects spatially with verified coordinates and clear mobile controls.",
      ar: "استكشف المشاريع على الخريطة بإحداثيات موثّقة وتحكم واضح من الموبايل.",
    },
    image: projectImages[1],
  },
  {
    href: "/areas",
    number: "03",
    title: { en: "Areas", ar: "المناطق" },
    copy: {
      en: "Understand communities, benchmarks, articles and every linked project.",
      ar: "تعرّف على المناطق ومعدلاتها والمقالات وكل المشاريع المرتبطة بيها.",
    },
    image: projectImages[2],
  },
  {
    href: "/developers",
    number: "04",
    title: { en: "Developers", ar: "المطورون" },
    copy: {
      en: "Review developer profiles, official links and structured track records.",
      ar: "راجع ملفات المطورين والروابط الرسمية والسجل الموثّق لمشاريعهم.",
    },
    image: projectImages[3],
  },
  {
    href: "/compare",
    number: "05",
    title: { en: "Compare", ar: "المقارنة" },
    copy: {
      en: "Put the numbers, payment plans and handover dates side by side.",
      ar: "قارن الأرقام وخطط الدفع ومواعيد التسليم جنب بعض.",
    },
    image: projectImages[4],
  },
  {
    href: "/calculators",
    number: "06",
    title: { en: "ROI / ROE", ar: "حاسبة العائد" },
    copy: {
      en: "Model investment returns using the dedicated calculator workspace.",
      ar: "احسب العائد على استثمارك باستخدام الحاسبة المخصصة.",
    },
    image: projectImages[5],
  },
];

type ArticleSummary = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  author: string;
  authorPhoto?: string;
  date: string;
  readMinutes?: number;
};

function useLatestArticles(limit: number) {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  useEffect(() => {
    fetch("/data/articles.json")
      .then((response) => response.json())
      .then((data: { articles: ArticleSummary[] }) => {
        const sorted = [...(data.articles || [])].sort((a, b) => (a.date < b.date ? 1 : -1));
        setArticles(sorted.slice(0, limit));
      })
      .catch(() => setArticles([]));
  }, [limit]);
  return articles;
}

function HomeArticles() {
  const { arabic } = useLanguage();
  const articles = useLatestArticles(5);
  if (!articles.length) return null;
  return (
    <section className="home-articles">
      <div className="section-kicker">
        <span>{arabic ? "ذكاء تحريري" : "EDITORIAL INTELLIGENCE"}</span>
        <h2>{arabic ? "آخر المقالات." : "Latest articles."}</h2>
        <a href="/articles">{arabic ? "كل المقالات ↗" : "All articles ↗"}</a>
      </div>
      <div className="home-articles-grid">
        {articles.map((item) => (
          <a href={`/articles/${item.slug}`} key={item.slug} className="home-article-card">
            <p>{item.category}</p>
            <h3>{item.title}</h3>
            <span>{item.excerpt}</span>
            <div>
              {item.authorPhoto ? <img className="home-article-author-photo" src={item.authorPhoto} alt={item.author} /> : null}
              <div><strong>{item.author}</strong><small>{item.date} · {item.readMinutes || 4} {arabic ? "دقائق" : "min"}</small></div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function HomeMiniMap() {
  const { arabic } = useLanguage();
  const liveData = useProjectLiveData();
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mappedProjects = useMemo(
    () => Object.entries(liveData).filter(([, live]) => Boolean(live?.coordinates)),
    [liveData],
  );

  useEffect(() => {
    if (!mapElement.current || !mappedProjects.length) return;
    let map: { remove: () => void } | undefined;
    let cancelled = false;
    (async () => {
      const leafletModule = await import("leaflet");
      await import("leaflet.markercluster");
      if (cancelled || !mapElement.current) return;
      const L = leafletModule.default;
      const leafletMap = L.map(mapElement.current, {
        center: [24.95, 55.05],
        zoom: 9,
        minZoom: 8,
        maxZoom: 14,
        zoomControl: true,
        dragging: true,
        scrollWheelZoom: false,
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: false,
        keyboard: false,
      });
      map = leafletMap;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        subdomains: "abc",
        maxZoom: 19,
      }).addTo(leafletMap);
      const clusters = (L as typeof L & { markerClusterGroup: (options?: object) => L.LayerGroup }).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 60,
      });
      mappedProjects.forEach(([, live]) => {
        if (!live?.coordinates) return;
        clusters.addLayer(L.circleMarker([live.coordinates.lat, live.coordinates.lng], {
          radius: 5,
          color: "#c1272d",
          weight: 2,
          fillColor: "#ffffff",
          fillOpacity: 1,
        }));
      });
      leafletMap.addLayer(clusters);
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [mappedProjects]);

  return (
    <section className="home-mini-map">
      <div className="section-kicker">
        <span>{arabic ? "ذكاء الخريطة" : "MAP INTELLIGENCE"}</span>
        <h2>{arabic ? "كل مشروع، فوق الخريطة." : "Every project, on the map."}</h2>
      </div>
      <div className="home-mini-map-frame">
        <div ref={mapElement} className="home-mini-map-canvas" />
        <a href="/map" className="home-mini-map-cta">{arabic ? "افتح الخريطة الكاملة ↗" : "Open the full interactive map ↗"}</a>
      </div>
    </section>
  );
}

export default function Home() {
  const data = usePlatformData();
  const { arabic } = useLanguage();
  return (
    <main>
      <Header />
      <section className="home-hero">
        <div className="home-copy">
          <p className="eyebrow"><span />{arabic ? "ذكاء عقارات دبي على الخريطة" : "DUBAI OFF-PLAN INTELLIGENCE"}</p>
          {arabic
            ? <h1>كل قرار.<br /><em>في مكانه الصح.</em></h1>
            : <h1>Every decision.<br /><em>In its right place.</em></h1>}
          <p>{arabic
            ? "المشاريع، المطورون، المناطق، ذكاء الخريطة وأدوات الاستثمار — دلوقتي في صفحات منفصلة ومصممة للديسكتوب والموبايل."
            : "Projects, developers, areas, map intelligence and investment tools—now separated into focused pages built for desktop and mobile."}</p>
          <div className="hero-actions">
            <a className="button primary" href="/projects">{arabic ? "استكشف المشاريع" : "Explore projects"} <b>↗</b></a>
            <a className="button ghost" href="/map">{arabic ? "افتح الخريطة" : "Open the map"} <b>→</b></a>
          </div>
        </div>
        <div className="home-visual">
          <img src={projectImages[0]} alt="Dubai luxury architecture" />
          <div className="home-visual-shade" />
          <span>{arabic ? <>مختارة بعناية<br /><strong>دبي</strong></> : <>CURATED<br /><strong>DUBAI</strong></>}</span>
          <div className="hero-property-note">
            <small>{arabic ? "ذكاء السوق" : "MARKET INTELLIGENCE"}</small>
            <strong>{arabic ? "رؤية واحدة واضحة لعقارات دبي على الخريطة." : "One clear view of Dubai off-plan."}</strong>
          </div>
        </div>
      </section>
      <section className="home-stats">
        <div><strong>{data?.projects.length.toLocaleString() || "—"}</strong><span>{arabic ? "مشروع" : "projects"}</span></div>
        <div><strong>{data?.developers.length.toLocaleString() || "—"}</strong><span>{arabic ? "مطوّر" : "developers"}</span></div>
        <div><strong>{data?.areas.length.toLocaleString() || "—"}</strong><span>{arabic ? "منطقة موثّقة" : "area benchmarks"}</span></div>
        <div><strong>1</strong><span>{arabic ? "مرجع موحّد" : "structured reference"}</span></div>
      </section>
      <HomeArticles />
      <HomeMiniMap />
      <section className="destination-section">
        <div className="section-kicker"><span>{arabic ? "المنصة" : "THE PLATFORM"}</span><h2>{arabic ? "اختار مساحة عملك." : "Choose your workspace."}</h2></div>
        <div className="destination-grid">
          {destinations.map((item) => (
            <a className="destination-card" href={item.href} key={item.href}>
              <div className="destination-image"><img src={item.image} alt="" loading="lazy" /><span>{item.number}</span></div>
              <div className="destination-copy"><div><h3>{arabic ? item.title.ar : item.title.en}</h3><p>{arabic ? item.copy.ar : item.copy.en}</p></div><b>↗</b></div>
            </a>
          ))}
        </div>
      </section>
      <DataNotice />
      <LeadSection />
      <Footer />
      <ContactDock />
    </main>
  );
}
