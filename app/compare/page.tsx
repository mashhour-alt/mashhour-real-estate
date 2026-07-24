"use client";

import Link from "next/link";
import SectionHead from "@/components/SectionHead";
import { areaFrom, money, projectKey } from "@/lib/format";
import { COMPARE_LIMIT, useCompare, useLang } from "@/lib/site-context";
import type { Project } from "@/lib/types";

const percent = (value: number | null) => (value != null ? `${value * 100}%` : "—");

const ROWS: { label: string; value: (project: Project) => React.ReactNode }[] = [
  { label: "Developer", value: (p) => p["Developer | المطور"] },
  { label: "Area", value: (p) => areaFrom(p["Location / Community | المنطقة"]) },
  { label: "Starting price", value: (p) => money(p["Starting Price AED | السعر المبدئي"]) },
  { label: "Handover", value: (p) => p["Handover | التسليم"] || "TBA" },
  { label: "Booking", value: (p) => percent(p["Booking % | الحجز"]) },
  { label: "At handover", value: (p) => percent(p["At Handover % | عند التسليم"]) },
  {
    label: "Escrow",
    value: (p) => (
      <span
        className={
          p["Escrow Account Status | حالة حساب الضمان"]?.includes("Verified")
            ? "status verified"
            : "status"
        }
      >
        {p["Escrow Account Status | حالة حساب الضمان"] || "Unverified"}
      </span>
    ),
  },
];

export default function ComparePage() {
  const { t } = useLang();
  const { compare, removeCompare } = useCompare();

  return (
    <section className="section dark">
      <SectionHead
        number="03"
        eyebrow="DECISION TOOL"
        title={t.comparison}
        sub={t.comparisonSub}
        inverse
        aside={
          <span className="compare-count">
            {compare.length}/{COMPARE_LIMIT}
          </span>
        }
      />

      {compare.length === 0 ? (
        <div className="empty-compare">
          <span>＋</span>
          <p>{t.emptyCompare}</p>
          <Link className="button primary inverse-button" href="/projects">
            {t.goToProjects} <b>↗</b>
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop / tablet: matrix table */}
          <div className="compare-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  {compare.map((project) => (
                    <th key={projectKey(project)}>
                      <span>{project["Project Name | اسم المشروع"]}</span>
                      <small>{project["Developer | المطور"]}</small>
                      <button onClick={() => removeCompare(project)} aria-label="Remove">
                        ×
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    {compare.map((project) => (
                      <td key={projectKey(project)}>{row.value(project)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: one stacked card per project */}
          <div className="compare-stack">
            {compare.map((project) => (
              <article className="compare-card" key={projectKey(project)}>
                <header>
                  <div>
                    <strong>{project["Project Name | اسم المشروع"]}</strong>
                    <small>{project["Developer | المطور"]}</small>
                  </div>
                  <button onClick={() => removeCompare(project)} aria-label="Remove">
                    ×
                  </button>
                </header>
                <dl>
                  {ROWS.map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.value(project)}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
