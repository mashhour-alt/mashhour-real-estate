"use client";

import { ContactDock, DataNotice, Footer, Header, LeadSection, usePlatformData } from "./components";
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
