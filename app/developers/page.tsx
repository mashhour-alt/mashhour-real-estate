"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import SectionHead from "@/components/SectionHead";
import { developerUrl } from "@/lib/format";
import { useLang, useSiteData } from "@/lib/site-context";

export default function DevelopersPage() {
  const { t } = useLang();
  const { data, loading } = useSiteData();
  const [query, setQuery] = useState("");

  const developers = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return (data?.developers || [])
      .filter((item) => item["Overall /10"])
      .filter((item) =>
        !needle || `${item.Developer} ${item.Tier || ""}`.toLowerCase().includes(needle),
      )
      .sort((a, b) => (b["Overall /10"] || 0) - (a["Overall /10"] || 0));
  }, [data, query]);

  return (
    <section className="section light">
      <SectionHead
        number="05"
        eyebrow="TRACK RECORD"
        title={t.developerTitle}
        sub={t.developerSub}
        aside={
          <span className="result-count">
            {developers.length.toLocaleString()} {t.results}
          </span>
        }
      />

      <div className="filters single">
        <label className="search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.allDevelopers}
            type="search"
          />
        </label>
      </div>

      {loading ? (
        <p className="page-loading">{t.loading}</p>
      ) : (
        <div className="developer-list">
          {developers.map((item, index) => (
            <article key={item.Developer}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <div>
                <h3>
                  <a href={developerUrl(item.Developer)} target="_blank" rel="noreferrer">
                    {item.Developer} ↗
                  </a>
                </h3>
                <p>{item.Tier}</p>
                <Link
                  className="developer-projects-link"
                  href={`/projects?developer=${encodeURIComponent(item.Developer)}`}
                >
                  {t.projects} →
                </Link>
              </div>
              <div className="score-bar">
                <i style={{ width: `${(item["Overall /10"] || 0) * 10}%` }} />
              </div>
              <strong>{item["Overall /10"]?.toFixed(1)}</strong>
              <span>/10</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
