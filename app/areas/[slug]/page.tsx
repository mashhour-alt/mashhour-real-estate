"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Footer, Header, usePlatformData } from "../../components";
import { useLanguage } from "../../language-context";
import { PageSeo } from "../../seo";
import { getAreaBySlug } from "../area-guides";

export default function AreaDetailPage() {
  const params = useParams<{ slug: string }>();
  const data = usePlatformData();
  const { arabic } = useLanguage();

  const areaNames = useMemo(() => {
    const names = new Set<string>();
    (data?.areas || []).forEach((item) => names.add(item.Area));
    return Array.from(names);
  }, [data]);

  const resolved = getAreaBySlug(params.slug, areaNames);

  if (!data) {
    return (
      <main>
        <Header />
        <div className="area-guide-loading">LOADING AREA INTELLIGENCE...</div>
      </main>
    );
  }

  if (!resolved) {
    return (
      <main>
        <Header />
        <section className="area-guide-not-found">
          <span>404 / AREA</span>
          <h1>{arabic ? "المنطقة غير موجودة." : "Area not found."}</h1>
          <a href="/areas">{arabic ? "العودة للمناطق ↗" : "Back to areas ↗"}</a>
        </section>
        <Footer />
      </main>
    );
  }

  const { name, guide } = resolved;

  const benchmark = (data.areas || []).find((item) => item.Area === name);

  const projectCount = (data.projects || []).filter((project) => {
    const candidate = String(
      (project as unknown as Record<string, unknown>).Area ||
      (project as unknown as Record<string, unknown>).area ||
      ""
    );
    return candidate.toLowerCase() === name.toLowerCase();
  }).length;

  const mapUrl =
    `https://www.openstreetmap.org/export/embed.html?bbox=` +
    `${guide.lng - 0.035}%2C${guide.lat - 0.025}%2C${guide.lng + 0.035}%2C${guide.lat + 0.025}` +
    `&layer=mapnik&marker=${guide.lat}%2C${guide.lng}`;

  return (
    <main className="area-guide-page">
      <Header />

      <PageSeo
        title={`${name} Area Guide | Dubai Real Estate`}
        description={`Explore ${name}: location, roads, surrounding communities, infrastructure, market benchmarks and available property projects.`}
      />

      <section className="area-guide-hero">
        <img src={guide.image} alt={name} />
        <div className="area-guide-hero-overlay" />

        <div className="area-guide-breadcrumb">
          <a href="/areas">{arabic ? "المناطق" : "AREAS"}</a>
          <span>/</span>
          <b>{name}</b>
        </div>

        <div className="area-guide-hero-copy">
          <span>{guide.eyebrow}</span>
          <h1>{name}</h1>
          <p>{guide.intro}</p>
        </div>

        <div className="area-guide-hero-stats">
          <div>
            <small>{arabic ? "السعر / قدم²" : "PSF BENCHMARK"}</small>
            <strong>
              {benchmark?.["PSF Benchmark"]
                ? `AED ${benchmark["PSF Benchmark"].toLocaleString()}`
                : "—"}
            </strong>
          </div>

          <div>
            <small>{arabic ? "العائد الإجمالي" : "GROSS YIELD"}</small>
            <strong>
              {benchmark?.["Gross Yield"]
                ? `${(benchmark["Gross Yield"] * 100).toFixed(1)}%`
                : "—"}
            </strong>
          </div>

          <div>
            <small>{arabic ? "المشاريع" : "PROJECTS"}</small>
            <strong>{projectCount || "—"}</strong>
          </div>
        </div>
      </section>

      <section className="area-guide-intro">
        <aside>
          <span>01</span>
          <small>{arabic ? "نظرة عامة" : "OVERVIEW"}</small>
        </aside>

        <div>
          <h2>
            {arabic
              ? `فهم ${name} قبل اختيار المشروع.`
              : `Understand ${name} before choosing the project.`}
          </h2>

          <p>{guide.intro}</p>

          <blockquote>
            {arabic
              ? "الموقع الجيد مش مجرد عنوان. القيمة الحقيقية تبدأ من الاتصال بالمدينة، البنية التحتية، ونضج المجتمع."
              : "A location is more than an address. Its real value starts with connectivity, infrastructure and the maturity of the community."}
          </blockquote>
        </div>
      </section>

      <section className="area-guide-editorial">
        <article className="area-guide-story">
          <div className="area-guide-story-number">02</div>

          <div className="area-guide-story-copy">
            <span>{arabic ? "الموقع الجغرافي" : "LOCATION"}</span>
            <h2>{arabic ? "أين تقع المنطقة؟" : "Where is it?"}</h2>
            <p>{guide.location}</p>
          </div>

          <div className="area-guide-facts">
            <div>
              <small>{arabic ? "خط العرض" : "LATITUDE"}</small>
              <strong>{guide.lat.toFixed(4)}</strong>
            </div>
            <div>
              <small>{arabic ? "خط الطول" : "LONGITUDE"}</small>
              <strong>{guide.lng.toFixed(4)}</strong>
            </div>
          </div>
        </article>

        <article className="area-guide-story area-guide-story-dark">
          <div className="area-guide-story-number">03</div>

          <div className="area-guide-story-copy">
            <span>{arabic ? "الحركة والاتصال" : "CONNECTIVITY"}</span>
            <h2>{arabic ? "الشوارع الرئيسية." : "Main roads."}</h2>

            <div className="area-guide-chip-list">
              {guide.roads.map((road) => (
                <b key={road}>{road}</b>
              ))}
            </div>
          </div>

          <div className="area-guide-neighbours">
            <small>{arabic ? "المناطق المحيطة" : "SURROUNDING AREAS"}</small>
            {guide.neighbours.map((item, index) => (
              <div key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="area-guide-story">
          <div className="area-guide-story-number">04</div>

          <div className="area-guide-story-copy">
            <span>{arabic ? "التطوير" : "DEVELOPMENT"}</span>
            <h2>{arabic ? "المطور الرئيسي." : "Master development."}</h2>
            <p>{guide.developer}</p>
          </div>

          <div className="area-guide-big-word">
            <small>{arabic ? "السياق" : "CONTEXT"}</small>
            <strong>MASTER<br />PLAN</strong>
          </div>
        </article>

        <article className="area-guide-story area-guide-story-warm">
          <div className="area-guide-story-number">05</div>

          <div className="area-guide-story-copy">
            <span>{arabic ? "الحياة اليومية" : "INFRASTRUCTURE"}</span>
            <h2>{arabic ? "البنية التحتية." : "Built for daily life."}</h2>
            <p>{guide.infrastructure}</p>
          </div>

          <div className="area-guide-icon-grid">
            <div><b>⌂</b><span>{arabic ? "سكن" : "LIVING"}</span></div>
            <div><b>↔</b><span>{arabic ? "طرق" : "ROADS"}</span></div>
            <div><b>✦</b><span>{arabic ? "خدمات" : "SERVICES"}</span></div>
            <div><b>○</b><span>{arabic ? "مجتمع" : "COMMUNITY"}</span></div>
          </div>
        </article>
      </section>

      <section className="area-guide-future">
        <div className="area-guide-future-index">06</div>

        <div className="area-guide-future-copy">
          <span>{arabic ? "النظرة المستقبلية" : "THE OUTLOOK"}</span>
          <h2>
            {arabic
              ? "إلى أين تتجه المنطقة؟"
              : "Where does the area go from here?"}
          </h2>
          <p>{guide.future}</p>

          <small>
            {arabic
              ? "يتم عرض التوجه المستقبلي كسياق تحليلي، وليس كضمان للعائد أو الأداء المستقبلي."
              : "Future outlook is presented as market context, not as a guarantee of investment performance."}
          </small>
        </div>
      </section>

      <section className="area-guide-map-section">
        <div className="area-guide-map-head">
          <div>
            <span>07 / {arabic ? "الخريطة" : "LOCATION MAP"}</span>
            <h2>{arabic ? "شوف مكانها في دبي." : "See it in Dubai."}</h2>
          </div>

          <div>
            <small>COORDINATES</small>
            <strong>{guide.lat.toFixed(4)}, {guide.lng.toFixed(4)}</strong>
          </div>
        </div>

        <div className="area-guide-map-frame">
          <iframe
            title={`${name} map`}
            src={mapUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      <section className="area-guide-project-cta">
        <div>
          <span>{arabic ? "الخطوة التالية" : "NEXT / PROJECTS"}</span>
          <h2>
            {arabic
              ? `اكتشف المشاريع الموجودة في ${name}.`
              : `Explore projects in ${name}.`}
          </h2>
          <p>
            {arabic
              ? "انتقل مباشرة إلى المشاريع وابدأ مقارنة الأسعار، المطورين وخطط الدفع."
              : "Move from area intelligence to the actual projects, prices, developers and payment plans."}
          </p>
        </div>

        <a href={`/projects?area=${encodeURIComponent(name)}`}>
          <span>{arabic ? "عرض المشاريع" : "EXPLORE PROJECTS"}</span>
          <b>↗</b>
        </a>
      </section>

      <Footer />
    </main>
  );
}
