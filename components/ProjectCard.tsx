"use client";

import { areaFrom, imageFor, money, projectImageSrc, whatsappLink } from "@/lib/format";
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
  const { t, lang } = useLang();
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
          <a
            className="card-whatsapp"
            href={whatsappLink(project, lang)}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            title="WhatsApp"
            onClick={(event) => event.stopPropagation()}
          >
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
              <path
                fill="currentColor"
                d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.2c-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.3M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2"
              />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
