"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import SectionHead from "@/components/SectionHead";
import { buildAreaSummaries } from "@/lib/areas";
import { useLang, useSiteData } from "@/lib/site-context";

export default function AreasPage() {
  const { t } = useLang();
  const { data, loading } = useSiteData();
  const [query, setQuery] = useState("");

  const areas = useMemo(() => {
    if (!data) return [];
    const all = buildAreaSummaries(data.areas, data.projects);
    const needle = query.toLowerCase().trim();
    return needle
      ? all.filter((area) =>
          `${area.name} ${area.tier || ""}`.toLowerCase().includes(needle),
        )
      : all;
  }, [data, query]);

  return (
    <section className="section light">
      <SectionHead
        number="04"
        eyebrow="AREA INTELLIGENCE"
        title={t.areasTitle}
        sub={t.areasSub}
        aside={
          <span className="result-count">
            {areas.length.toLocaleString()} {t.results}
          </span>
        }
      />

      <div className="filters single">
        <label className="search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.allAreas}
            type="search"
          />
        </label>
      </div>

      {loading ? (
        <p className="page-loading">{t.loading}</p>
      ) : (
        <div className="areas-grid">
          {areas.map((area, index) => (
            <Link className="area-tile" key={area.slug} href={`/areas/${area.slug}`}>
              <span className="area-tile-index">{String(index + 1).padStart(2, "0")}</span>
              <h3>{area.name}</h3>
              <p>{area.tier || "—"}</p>
              <dl>
                <div>
                  <dt>PSF</dt>
                  <dd>{area.psf ? `AED ${area.psf.toLocaleString()}` : "—"}</dd>
                </div>
                <div>
                  <dt>YIELD</dt>
                  <dd>{area.yield ? `${(area.yield * 100).toFixed(1)}%` : "—"}</dd>
                </div>
                <div>
                  <dt>{t.projects.toUpperCase()}</dt>
                  <dd>{area.projectCount}</dd>
                </div>
              </dl>
              <b className="area-tile-arrow">→</b>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
