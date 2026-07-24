"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Articles from "@/components/Articles";
import SectionHead from "@/components/SectionHead";
import { findAreaBySlug } from "@/lib/areas";
import { useLang, useSiteData } from "@/lib/site-context";

export default function AreaDetailPage() {
  const { t } = useLang();
  const { data, loading } = useSiteData();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "";

  const area = useMemo(
    () => (data ? findAreaBySlug(slug, data.areas, data.projects) : null),
    [data, slug],
  );

  if (loading) {
    return (
      <section className="section light">
        <p className="page-loading">{t.loading}</p>
      </section>
    );
  }

  if (!area) {
    return (
      <section className="section light">
        <SectionHead number="!" eyebrow="AREA" title={t.areaNotFound} />
        <Link className="button primary" href="/areas">
          ← {t.areasTitle}
        </Link>
      </section>
    );
  }

  return (
    <section className="section light">
      <div className="area-breadcrumb">
        <Link href="/areas">← {t.areasTitle}</Link>
      </div>

      <SectionHead
        number="◆"
        eyebrow={area.tier ? area.tier.toUpperCase() : "DUBAI COMMUNITY"}
        title={area.name}
        sub={`${area.projectCount.toLocaleString()} ${t.projects}`}
        aside={
          <Link
            className="button primary area-projects-cta"
            href={`/projects?area=${encodeURIComponent(area.name)}`}
          >
            {t.viewAreaProjects} <b>↗</b>
          </Link>
        }
      />

      {/* Headline benchmarks */}
      <div className="area-headline">
        <div>
          <small>PSF BENCHMARK</small>
          <strong>{area.psf ? `AED ${area.psf.toLocaleString()}` : "—"}</strong>
        </div>
        <div>
          <small>GROSS YIELD</small>
          <strong>{area.yield ? `${(area.yield * 100).toFixed(1)}%` : "—"}</strong>
        </div>
        <div>
          <small>DEMAND</small>
          <strong>{area.demand != null ? `${area.demand}/10` : "—"}</strong>
        </div>
        <div>
          <small>{t.projects.toUpperCase()}</small>
          <strong>{area.projectCount}</strong>
        </div>
      </div>

      {/* Segment breakdown when the area has more than one asset type */}
      {area.segments.length > 1 && (
        <div className="area-segments">
          <div className="detail-heading">
            <span>◇</span>
            <h3>{t.areaSegments}</h3>
          </div>
          <div className="area-segment-grid">
            {area.segments.map((segment, index) => (
              <article key={`${segment.Segment}-${segment["Asset Type"]}-${index}`}>
                <p>
                  {segment.Segment} · {segment["Asset Type"]}
                </p>
                <dl>
                  <div>
                    <dt>PSF</dt>
                    <dd>
                      {segment["PSF Benchmark"]
                        ? `AED ${segment["PSF Benchmark"].toLocaleString()}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Yield</dt>
                    <dd>
                      {segment["Gross Yield"]
                        ? `${(segment["Gross Yield"] * 100).toFixed(1)}%`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Demand</dt>
                    <dd>{segment["Demand /10"] != null ? `${segment["Demand /10"]}/10` : "—"}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="area-cta-row">
        <Link
          className="button primary"
          href={`/projects?area=${encodeURIComponent(area.name)}`}
        >
          {t.viewAreaProjects} <b>↗</b>
        </Link>
        <Link className="button ghost" href="/roi">
          {t.roiTitle} <b>→</b>
        </Link>
      </div>

      {/* Area articles appear here once the database is enabled */}
      <Articles scope="area" scopeRef={area.name} heading={t.articlesAreas} />
    </section>
  );
}
