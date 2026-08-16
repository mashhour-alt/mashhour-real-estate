"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ContactDock, DataNotice, Footer, Header, LeadSection, usePlatformData, useProjectLiveData } from "./components";
import { useLanguage } from "./language-context";
import { MAPTILER_ATTRIBUTION, tileUrlFor } from "./map-tiles";
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
      L.tileLayer(tileUrlFor(arabic), {
        attribution: MAPTILER_ATTRIBUTION,
        maxZoom: 19,
        crossOrigin: true,
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
  }, [mappedProjects, arabic]);

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
    <main className="premium-home">
      <Header />

      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="premium-home-hero">
        <img
          src={projectImages[0]}
          alt="Dubai luxury real estate"
          className="premium-home-hero-image"
        />

        <div className="premium-home-hero-shade" />

        <div className="premium-home-hero-copy">
          <span className="premium-home-kicker">
            {arabic
              ? "متخصصون في عقارات دبي على الخريطة"
              : "DUBAI OFF-PLAN SPECIALISTS"}
          </span>

          {arabic ? (
            <h1>
              اكتشف
              <br />
              <em>استثمارك العقاري</em>
              <br />
              القادم
            </h1>
          ) : (
            <h1>
              Find Your
              <br />
              <em>Next Landmark</em>
              <br />
              Investment
            </h1>
          )}

          <p>
            {arabic
              ? "مشاريع موثقة. مطورون معروفون. بيانات واضحة تساعدك تاخد قرارك بثقة."
              : "Verified projects. Trusted developers. Clear data tailored to help you invest with confidence."}
          </p>

          <div className="premium-home-hero-actions">
            <a href="/projects" className="premium-home-button primary">
              {arabic ? "استكشف المشاريع" : "Explore projects"}
              <b>→</b>
            </a>

            <a href="/#contact" className="premium-home-button secondary">
              {arabic ? "تحدث مع مستشار" : "Talk to an expert"}
              <b>→</b>
            </a>
          </div>

          <div className="premium-home-trust">
            <i>✓</i>
            <span>
              {arabic
                ? "مقارنات وبيانات ومصادر في مكان واحد"
                : "Projects, comparisons and market intelligence in one place"}
            </span>
          </div>
        </div>

        <aside className="premium-home-invest-card">
          <div className="premium-invest-heading">
            <span>01</span>
            <div>
              <small>
                {arabic ? "لماذا دبي؟" : "WHY INVEST IN DUBAI?"}
              </small>
              <strong>
                {arabic ? "سوق عالمي للمستثمر" : "Built for global investors"}
              </strong>
            </div>
          </div>

          <div className="premium-invest-item">
            <i>⌂</i>
            <div>
              <strong>{arabic ? "بيئة ضريبية جاذبة" : "Investor-friendly taxation"}</strong>
              <span>
                {arabic
                  ? "هيكل ضريبي تنافسي للاستثمار العقاري."
                  : "A competitive tax environment for property investors."}
              </span>
            </div>
          </div>

          <div className="premium-invest-item">
            <i>↗</i>
            <div>
              <strong>{arabic ? "سوق نشط" : "Dynamic property market"}</strong>
              <span>
                {arabic
                  ? "فرص متعددة عبر مناطق وفئات سعرية مختلفة."
                  : "Opportunities across communities and price segments."}
              </span>
            </div>
          </div>

          <div className="premium-invest-item">
            <i>◇</i>
            <div>
              <strong>{arabic ? "أسلوب حياة عالمي" : "World-class lifestyle"}</strong>
              <span>
                {arabic
                  ? "بنية تحتية وخدمات ومجتمعات سكنية متطورة."
                  : "Infrastructure, services and premium communities."}
              </span>
            </div>
          </div>

          <div className="premium-invest-item">
            <i>✦</i>
            <div>
              <strong>{arabic ? "خيارات إقامة" : "Residency opportunities"}</strong>
              <span>
                {arabic
                  ? "خيارات إقامة مرتبطة بالاستثمار وفق الأنظمة السارية."
                  : "Investment-linked residency options subject to eligibility."}
              </span>
            </div>
          </div>

          <a href="/calculators">
            {arabic ? "اختبر أرقام استثمارك" : "Model your investment"}
            <b>→</b>
          </a>
        </aside>
      </section>

      {/* =====================================================
          TRUSTED DEVELOPERS
      ===================================================== */}
      <section className="premium-home-developers">
        <small>
          {arabic ? "مطوّرون رائدون في دبي" : "LEADING DUBAI DEVELOPERS"}
        </small>

        <div>
          <a href="/developers/emaar">EMAAR</a>
          <a href="/developers/meraas">MERAAS</a>
          <a href="/developers/nakheel">NAKHEEL</a>
          <a href="/developers/sobha-realty">SOBHA</a>
          <a href="/developers/damac-properties">DAMAC</a>
          <a href="/developers/binghatti">BINGHATTI</a>
        </div>
      </section>

      {/* =====================================================
          FEATURED DISCOVERY
      ===================================================== */}
      <section className="premium-home-section premium-home-discovery">
        <div className="premium-home-section-heading">
          <div>
            <small>
              {arabic ? "مختارة لك" : "HANDPICKED DISCOVERY"}
            </small>
            <h2>
              {arabic
                ? "ابدأ من المكان الصح."
                : "Premium choices. Smarter decisions."}
            </h2>
          </div>

          <a href="/projects">
            {arabic ? "عرض كل المشاريع" : "View all projects"} <b>→</b>
          </a>
        </div>

        <div className="premium-home-discovery-grid">
          {destinations.slice(0, 4).map((item, index) => (
            <a
              href={item.href}
              className="premium-home-discovery-card"
              key={item.href}
            >
              <img src={item.image} alt="" loading="lazy" />

              <div className="premium-discovery-shade" />

              <span>{item.number}</span>

              <div>
                <small>
                  {index === 0
                    ? arabic
                      ? "استكشف المخزون"
                      : "PROJECT INVENTORY"
                    : index === 1
                      ? arabic
                        ? "ذكاء الموقع"
                        : "LOCATION INTELLIGENCE"
                      : index === 2
                        ? arabic
                          ? "اختيار المنطقة"
                          : "COMMUNITY GUIDE"
                        : arabic
                          ? "سجل المطور"
                          : "DEVELOPER TRACK RECORD"}
                </small>

                <h3>{arabic ? item.title.ar : item.title.en}</h3>
                <p>{arabic ? item.copy.ar : item.copy.en}</p>

                <b>↗</b>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* =====================================================
          MARKET STATS
      ===================================================== */}
      <section className="premium-home-stats">
        <div>
          <i>▦</i>
          <strong>{data?.projects.length.toLocaleString() || "—"}+</strong>
          <span>{arabic ? "مشروع" : "Indexed projects"}</span>
        </div>

        <div>
          <i>◇</i>
          <strong>{data?.developers.length.toLocaleString() || "—"}+</strong>
          <span>{arabic ? "مطور" : "Developers"}</span>
        </div>

        <div>
          <i>⌖</i>
          <strong>{data?.areas.length.toLocaleString() || "—"}+</strong>
          <span>{arabic ? "منطقة" : "Dubai areas"}</span>
        </div>

        <div>
          <i>✓</i>
          <strong>360°</strong>
          <span>{arabic ? "نظرة على القرار" : "Decision workspace"}</span>
        </div>
      </section>

      {/* =====================================================
          WHY MASHHOUR
      ===================================================== */}
      <section className="premium-home-about">
        <div className="premium-home-about-visual">
          <img src={projectImages[5]} alt="Dubai real estate advisory" loading="lazy" />
          <div />

          <a href="/articles">
            <i>▶</i>
            <span>{arabic ? "اكتشف رؤيتنا" : "DISCOVER OUR INSIGHTS"}</span>
          </a>
        </div>

        <div className="premium-home-about-copy">
          <small>
            {arabic
              ? "لماذا مشهور للعقارات؟"
              : "WHY CHOOSE MASHHOUR REAL ESTATE"}
          </small>

          <h2>
            {arabic
              ? "شريكك العقاري في دبي"
              : "Your Partner in Dubai Real Estate"}
          </h2>

          <p>
            {arabic
              ? "مش هدفنا نعرض وحدات وبس. بنجمع بيانات المشروع والمطور والمنطقة والمقارنة في تجربة واحدة تساعدك تفهم القرار قبل ما تاخده."
              : "We do more than list properties. We bring project, developer, community and comparison intelligence into one clear decision experience."}
          </p>

          <div className="premium-home-benefit">
            <i>✓</i>
            <div>
              <strong>{arabic ? "بيانات واضحة" : "Structured data"}</strong>
              <span>
                {arabic
                  ? "تفاصيل المشروع متجمعة في صفحة واحدة."
                  : "Project information organized in one place."}
              </span>
            </div>
          </div>

          <div className="premium-home-benefit">
            <i>↗</i>
            <div>
              <strong>{arabic ? "مقارنة حقيقية" : "Smarter comparison"}</strong>
              <span>
                {arabic
                  ? "قارن السعر والتسليم وخطة الدفع والموقع."
                  : "Compare price, handover, payment and location."}
              </span>
            </div>
          </div>

          <div className="premium-home-benefit">
            <i>◇</i>
            <div>
              <strong>{arabic ? "دعم من البداية للنهاية" : "End-to-end support"}</strong>
              <span>
                {arabic
                  ? "من اختيار المشروع لحد الخطوة المناسبة التالية."
                  : "From discovery to the next appropriate step."}
              </span>
            </div>
          </div>

          <a href="/projects" className="premium-home-outline-button">
            {arabic ? "ابدأ البحث" : "Start exploring"} <b>→</b>
          </a>
        </div>
      </section>

      {/* =====================================================
          POPULAR COMMUNITIES
      ===================================================== */}
      <section className="premium-home-section premium-home-communities">
        <div className="premium-home-section-heading">
          <div>
            <small>{arabic ? "مناطق دبي" : "POPULAR COMMUNITIES"}</small>
            <h2>{arabic ? "اسكن. استثمر. اكتشف." : "Live. Invest. Thrive."}</h2>
          </div>

          <a href="/areas">
            {arabic ? "استكشف المناطق" : "Explore communities"} <b>→</b>
          </a>
        </div>

        <div className="premium-community-grid">
          {[
            {
              titleEn: "Dubai Marina",
              titleAr: "دبي مارينا",
              copyEn: "Waterfront living",
              copyAr: "حياة على الواجهة البحرية",
              image: projectImages[1],
            },
            {
              titleEn: "Downtown Dubai",
              titleAr: "داون تاون دبي",
              copyEn: "The heart of the city",
              copyAr: "قلب المدينة",
              image: projectImages[0],
            },
            {
              titleEn: "Dubai Hills Estate",
              titleAr: "دبي هيلز استيت",
              copyEn: "Green. Family. Luxury.",
              copyAr: "خضرة وعائلة وفخامة",
              image: projectImages[2],
            },
            {
              titleEn: "Dubai Creek Harbour",
              titleAr: "دبي كريك هاربور",
              copyEn: "The future of Dubai",
              copyAr: "واجهة دبي المستقبلية",
              image: projectImages[3],
            },
            {
              titleEn: "Palm Jumeirah",
              titleAr: "نخلة جميرا",
              copyEn: "Iconic lifestyle",
              copyAr: "أسلوب حياة أيقوني",
              image: projectImages[4],
            },
          ].map((area) => (
            <a href="/areas" className="premium-community-card" key={area.titleEn}>
              <img src={area.image} alt={area.titleEn} loading="lazy" />
              <div />
              <strong>{arabic ? area.titleAr : area.titleEn}</strong>
              <span>{arabic ? area.copyAr : area.copyEn}</span>
            </a>
          ))}
        </div>
      </section>

      {/* =====================================================
          INTERACTIVE MAP
      ===================================================== */}
      <section className="premium-home-map-wrapper">
        <HomeMiniMap />
      </section>

      {/* =====================================================
          ARTICLES
      ===================================================== */}
      <section className="premium-home-articles-wrapper">
        <HomeArticles />
      </section>

      {/* =====================================================
          PLATFORM SHORTCUTS
      ===================================================== */}
      <section className="premium-home-platform">
        <div className="premium-home-section-heading">
          <div>
            <small>{arabic ? "أدواتك" : "YOUR WORKSPACE"}</small>
            <h2>
              {arabic
                ? "كل أدوات القرار في مكان واحد."
                : "Everything you need to decide."}
            </h2>
          </div>
        </div>

        <div className="premium-platform-grid">
          {destinations.slice(4).map((item) => (
            <a href={item.href} key={item.href}>
              <span>{item.number}</span>
              <div>
                <h3>{arabic ? item.title.ar : item.title.en}</h3>
                <p>{arabic ? item.copy.ar : item.copy.en}</p>
              </div>
              <b>↗</b>
            </a>
          ))}

          <a href="/data-coverage">
            <span>07</span>
            <div>
              <h3>{arabic ? "تغطية البيانات" : "Data coverage"}</h3>
              <p>
                {arabic
                  ? "اعرف إزاي بنعرض البيانات المتاحة وحالة اكتمالها."
                  : "See how available data and completeness are presented."}
              </p>
            </div>
            <b>↗</b>
          </a>
        </div>
      </section>

      <DataNotice />

      <section className="premium-home-lead" id="contact">
        <div className="premium-home-lead-intro">
          <small>
            {arabic ? "خطوتك التالية" : "PERSONALIZED SERVICE"}
          </small>

          <h2>
            {arabic
              ? "خدمة شخصية. قرار أقوى."
              : "Personalized Service. Premium Results."}
          </h2>

          <p>
            {arabic
              ? "سواء كنت مستثمر أو بتدور على بيتك، خلينا نراجع احتياجاتك ونوصل للاختيار الأنسب."
              : "Whether you're an investor or end-user, start with your objectives and find the right property path."}
          </p>

          <a
            href="https://wa.me/971582239619"
            target="_blank"
            rel="noreferrer"
          >
            {arabic ? "تحدث مع مستشار" : "Speak with an expert"} <b>→</b>
          </a>
        </div>

        <div className="premium-home-lead-form">
          <LeadSection />
        </div>
      </section>

      <Footer />
      <ContactDock />
    </main>
  );
}
