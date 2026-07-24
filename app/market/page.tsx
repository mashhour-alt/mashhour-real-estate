"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Articles from "@/components/Articles";
import SectionHead from "@/components/SectionHead";
import { useLang, useSiteData } from "@/lib/site-context";

export default function MarketPage() {
  const { t } = useLang();
  const { data, loading } = useSiteData();
  const [query, setQuery] = useState("");

  const areas = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return (data?.areas || [])
      .filter((item) => item["PSF Benchmark"])
      .filter((item) =>
        !needle ||
        `${item.Area} ${item["Asset Type"]} ${item.Tier || ""}`.toLowerCase().includes(needle),
      );
  }, [data, query]);

  return (
    <section className="section warm">
      <SectionHead
        number="04"
        eyebrow="AREA INTELLIGENCE"
        title={t.market}
        sub={t.marketSub}
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
        <div className="area-grid">
          {areas.map((item, index) => (
            <article className="area-card" key={`${item.Area}-${item["Asset Type"]}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.Area}</h3>
              <p>
                {item["Asset Type"]} · {item.Tier}
              </p>
              <div>
                <strong>AED {item["PSF Benchmark"]?.toLocaleString()}</strong>
                <small>PSF benchmark</small>
              </div>
              <div>
                <strong>
                  {item["Gross Yield"] ? `${(item["Gross Yield"] * 100).toFixed(1)}%` : "—"}
                </strong>
                <small>Gross yield</small>
              </div>
              <Link
                className="area-link"
                href={`/projects?area=${encodeURIComponent(item.Area)}`}
              >
                {t.explore} ↗
              </Link>
            </article>
          ))}
        </div>
      )}

      <Articles scope="area" heading={t.articlesAreas} />
    </section>
  );
}
