"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/copy";
import { useLang, useSiteData } from "@/lib/site-context";
import LeadSection from "@/components/LeadSection";

export default function Home() {
  const { t } = useLang();
  const { data } = useSiteData();

  const verifiedCount = (data?.projects || []).filter((project) =>
    project["Escrow Account Status | حالة حساب الضمان"]?.includes("Verified"),
  ).length;

  const blurbs = t.sectionBlurbs as Record<string, string>;

  return (
    <>
      <section className="hero" id="top">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span />
              {t.eyebrow}
            </p>
            <h1>
              {t.titleA}
              <br />
              <em>{t.titleB}</em>
            </h1>
            <p className="hero-intro">{t.intro}</p>
            <div className="hero-actions">
              <Link className="button primary" href="/projects">
                {t.explore} <b>↗</b>
              </Link>
              <Link className="button ghost" href="/compare">
                {t.compare} <b>→</b>
              </Link>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="red-orbit" />
            <div className="tower tower-one">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="tower tower-two">
              <i />
              <i />
              <i />
            </div>
            <div className="tower tower-three">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="hero-stamp">
              DUBAI
              <br />
              <strong>2026</strong>
            </div>
            <p>
              OFF-PLAN
              <br />
              MARKET VIEW
            </p>
          </div>
        </div>
        <div className="stats">
          <div>
            <strong>{data?.projects.length.toLocaleString() || "—"}</strong>
            <span>{t.projects}</span>
          </div>
          <div>
            <strong>{data?.developers.length.toLocaleString() || "—"}</strong>
            <span>{t.developers}</span>
          </div>
          <div>
            <strong>{data?.areas.length.toLocaleString() || "—"}</strong>
            <span>{t.areas}</span>
          </div>
          <div>
            <strong>{verifiedCount.toLocaleString()}</strong>
            <span>{t.verified}</span>
          </div>
        </div>
      </section>

      <section className="section light">
        <div className="section-head">
          <div>
            <span className="section-number">01</span>
            <p>PLATFORM</p>
            <h2>{t.exploreSections}</h2>
            <small>{t.exploreSectionsSub}</small>
          </div>
        </div>
        <div className="hub-grid">
          {ROUTES.map((route, index) => (
            <Link className="hub-card" key={route.href} href={route.href}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{t.nav[index]}</h3>
              <p>{blurbs[route.key]}</p>
              <b>→</b>
            </Link>
          ))}
        </div>
      </section>

      <LeadSection />
    </>
  );
}
