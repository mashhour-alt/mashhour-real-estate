"use client";

import { useMemo, useState } from "react";
import { Footer, Header, SearchBox, usePlatformData } from "../components";
import { useLanguage } from "../language-context";
import type { Area } from "../data";
import { PageSeo } from "../seo";
import { areaSlug, getAreaGuide } from "./area-guides";

export default function AreasPage() {
  const data = usePlatformData();
  const { arabic } = useLanguage();
  const [query, setQuery] = useState("");

  const areas = useMemo(() => {
    const map = new Map<string, Area>();

    (data?.areas || []).forEach((item) => {
      if (!map.has(item.Area)) map.set(item.Area, item);
    });

    return Array.from(map.values()).filter((item) =>
      item.Area.toLowerCase().includes(query.toLowerCase())
    );
  }, [data, query]);

  return (
    <main className="areas-premium-page">
      <Header />

      <PageSeo
        title="Dubai Areas | Community Guides & Off-Plan Projects"
        description="Explore Dubai communities through location guides, market benchmarks, infrastructure context and off-plan projects."
      />

      <section className="areas-premium-hero">
        <div className="areas-premium-hero-bg" />
        <div className="areas-premium-hero-shade" />

        <div className="areas-premium-hero-copy">
          <span className="areas-kicker">
            {arabic ? "دليل دبي العقاري" : "DUBAI AREA INTELLIGENCE"}
          </span>

          <h1>
            {arabic ? (
              <>
                اكتشف دبي
                <br />
                <em>من منطقة لمنطقة.</em>
              </>
            ) : (
              <>
                Understand Dubai.
                <br />
                <em>Area by area.</em>
              </>
            )}
          </h1>

          <p>
            {arabic
              ? "مش مجرد أسماء على الخريطة. اكتشف موقع كل منطقة، طرقها الرئيسية، البنية التحتية، مؤشرات السوق والمشاريع المتاحة."
              : "More than names on a map. Explore location, connectivity, infrastructure, market benchmarks and available projects."}
          </p>

          <div className="areas-hero-meta">
            <div>
              <strong>{areas.length}</strong>
              <span>{arabic ? "منطقة مغطاة" : "AREAS COVERED"}</span>
            </div>
            <div>
              <strong>01</strong>
              <span>{arabic ? "مرجع منظم" : "STRUCTURED REFERENCE"}</span>
            </div>
          </div>
        </div>

        <div className="areas-premium-hero-label">
          <small>{arabic ? "ابحث. افهم. قارن." : "SEARCH. UNDERSTAND. COMPARE."}</small>
          <b>↘</b>
        </div>
      </section>

      <section className="areas-premium-toolbar">
        <div>
          <span>{arabic ? "المناطق" : "THE DIRECTORY"}</span>
          <h2>{arabic ? "اختر مكانك في دبي." : "Find your place in Dubai."}</h2>
        </div>

        <div className="areas-search-wrap">
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder={arabic ? "ابحث عن منطقة..." : "Search an area..."}
          />
        </div>
      </section>

      <section className="areas-premium-grid">
        {areas.map((item, index) => {
          const guide = getAreaGuide(item.Area);

          return (
            <article className="area-premium-card" key={item.Area}>
              <a
                className="area-premium-image"
                href={`/areas/${areaSlug(item.Area)}`}
                aria-label={item.Area}
              >
                <img src={guide.image} alt={item.Area} loading="lazy" />
                <div className="area-premium-image-shade" />

                <span className="area-premium-index">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="area-premium-type">
                  {guide.eyebrow}
                </span>

                <div className="area-premium-image-copy">
                  <h2>{item.Area}</h2>
                  <p>
                    {item["Asset Type"] || (arabic ? "مجتمع دبي" : "Dubai community")}
                  </p>
                </div>

                <b className="area-premium-arrow">↗</b>
              </a>

              <div className="area-premium-info">
                <p>
                  {arabic
                    ? "دليل متكامل للموقع، الطرق، البنية التحتية والسوق العقاري."
                    : guide.intro}
                </p>

                <div className="area-premium-stats">
                  <div>
                    <small>{arabic ? "السعر / قدم²" : "PSF BENCHMARK"}</small>
                    <strong>
                      {item["PSF Benchmark"]
                        ? `AED ${item["PSF Benchmark"].toLocaleString()}`
                        : "—"}
                    </strong>
                  </div>

                  <div>
                    <small>{arabic ? "العائد الإجمالي" : "GROSS YIELD"}</small>
                    <strong>
                      {item["Gross Yield"]
                        ? `${(item["Gross Yield"] * 100).toFixed(1)}%`
                        : "—"}
                    </strong>
                  </div>
                </div>

                <div className="area-premium-actions">
                  <a href={`/areas/${areaSlug(item.Area)}`}>
                    {arabic ? "دليل المنطقة" : "AREA GUIDE"} <b>↗</b>
                  </a>

                  <a href={`/projects?area=${encodeURIComponent(item.Area)}`}>
                    {arabic ? "المشاريع" : "PROJECTS"}
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {!areas.length && (
        <div className="areas-empty">
          {arabic ? "لا توجد منطقة مطابقة للبحث." : "No matching area found."}
        </div>
      )}

      <Footer />
    </main>
  );
}
