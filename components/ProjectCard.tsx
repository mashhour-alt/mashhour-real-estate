"use client";

import { areaFrom, imageFor, money, projectImageSrc } from "@/lib/format";
import { useCompare, useLang } from "@/lib/site-context";
import type { Project } from "@/lib/types";

export default function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: (project: Project) => void;
}) {
  const { t } = useLang();
  const { toggleCompare, isCompared, full } = useCompare();
  const selected = isCompared(project);

  return (
    <article
      className="project-card"
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${project["Project Name | اسم المشروع"]}`}
      onClick={() => onOpen(project)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(project);
        }
      }}
    >
      <div className="card-art">
        <img
          src={projectImageSrc(project)}
          alt={`${project["Project Name | اسم المشروع"]} — ${project["Developer | المطور"]}`}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = imageFor(project);
          }}
        />
        <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
        <span className="official-source">PROPERTY FINDER</span>
        <strong className="developer-badge">{project["Developer | المطور"]}</strong>
      </div>
      <div className="card-body">
        <p>{areaFrom(project["Location / Community | المنطقة"])}</p>
        <h3>{project["Project Name | اسم المشروع"]}</h3>
        <div className="developer-name">
          <small>DEVELOPER</small>
          <strong>{project["Developer | المطور"]}</strong>
        </div>
        <dl>
          <div>
            <dt>FROM</dt>
            <dd>{money(project["Starting Price AED | السعر المبدئي"])}</dd>
          </div>
          <div>
            <dt>HANDOVER</dt>
            <dd>{project["Handover | التسليم"] || "TBA"}</dd>
          </div>
        </dl>
        <div className="card-actions">
          <button
            className="details-button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(project);
            }}
          >
            {t.viewDetails} ↗
          </button>
          <button
            className={selected ? "compare-button selected" : "compare-button"}
            onClick={(event) => {
              event.stopPropagation();
              toggleCompare(project);
            }}
          >
            {selected ? `✓ ${t.selected}` : full ? t.maxSelected : `+ ${t.addCompare}`}
          </button>
        </div>
      </div>
    </article>
  );
}
