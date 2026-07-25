"use client";

import { useEffect } from "react";
import {
  areaFrom,
  developerUrl,
  imageFor,
  money,
  projectImageSrc,
  propertyFinderUrl,
  whatsappLink,
} from "@/lib/format";
import { useLang, useSiteData } from "@/lib/site-context";
import type { Project } from "@/lib/types";

const percent = (value: number | null) => (value != null ? `${value * 100}%` : "—");

export default function ProjectModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const { data } = useSiteData();
  const { lang } = useLang();

  useEffect(() => {
    if (!project) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", close);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", close);
      document.body.classList.remove("modal-open");
    };
  }, [project, onClose]);

  if (!project) return null;

  const developerName = project["Developer | المطور"];
  const selectedDeveloper = data?.developers.find(
    (item) => item.Developer === developerName || developerName.includes(item.Developer),
  );
  const selectedArea = data?.areas.find(
    (item) => item.Area === areaFrom(project["Location / Community | المنطقة"]),
  );
  const escrow = project["Escrow Account Status | حالة حساب الضمان"];

  return (
    <div
      className="project-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${project["Project Name | اسم المشروع"]} details`}
    >
      <button className="modal-backdrop" aria-label="Close project details" onClick={onClose} />
      <article className="modal-panel">
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <div className="modal-hero">
          <img
            src={projectImageSrc(project)}
            alt={project["Project Name | اسم المشروع"]}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = imageFor(project);
            }}
          />
          <div className="modal-title">
            <p>{areaFrom(project["Location / Community | المنطقة"])}</p>
            <h2>{project["Project Name | اسم المشروع"]}</h2>
            <strong>{developerName}</strong>
          </div>
        </div>

        <div className="modal-content">
          <section className="detail-summary">
            <div>
              <small>STARTING PRICE</small>
              <strong>{money(project["Starting Price AED | السعر المبدئي"])}</strong>
            </div>
            <div>
              <small>HANDOVER</small>
              <strong>{project["Handover | التسليم"] || "TBA"}</strong>
            </div>
            <div>
              <small>SEGMENT</small>
              <strong>{project["Segment | القطاع"] || "—"}</strong>
            </div>
            <div>
              <small>UNIT TYPE</small>
              <strong>{project["Unit Type | نوع الوحدة"] || "Multiple / TBA"}</strong>
            </div>
          </section>

          <section className="detail-block">
            <div className="detail-heading">
              <span>01</span>
              <h3>Project information</h3>
            </div>
            <dl className="detail-grid">
              <div>
                <dt>Full location</dt>
                <dd>{project["Location / Community | المنطقة"] || "Dubai"}</dd>
              </div>
              <div>
                <dt>Developer</dt>
                <dd>{developerName}</dd>
              </div>
              <div>
                <dt>Escrow status</dt>
                <dd>
                  <span className={escrow?.includes("Verified") ? "status verified-light" : "status"}>
                    {escrow || "Unverified"}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Data status</dt>
                <dd>{project["Data Status | حالة البيانات"] || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="detail-block">
            <div className="detail-heading">
              <span>02</span>
              <h3>Payment plan</h3>
            </div>
            <div className="payment-plan">
              <div style={{ flex: project["Booking % | الحجز"] || 0 }}>
                <strong>{percent(project["Booking % | الحجز"])}</strong>
                <span>Booking</span>
              </div>
              <div style={{ flex: project["During Construction % | أثناء الإنشاء"] || 0 }}>
                <strong>{percent(project["During Construction % | أثناء الإنشاء"])}</strong>
                <span>Construction</span>
              </div>
              <div style={{ flex: project["At Handover % | عند التسليم"] || 0 }}>
                <strong>{percent(project["At Handover % | عند التسليم"])}</strong>
                <span>Handover</span>
              </div>
            </div>
          </section>

          <section className="detail-block">
            <div className="detail-heading">
              <span>03</span>
              <h3>Developer &amp; area intelligence</h3>
            </div>
            <div className="intelligence-grid">
              <div>
                <small>DEVELOPER SCORE</small>
                <strong>
                  {selectedDeveloper?.["Overall /10"]?.toFixed(1) || "—"}
                  <em>/10</em>
                </strong>
                <span>{selectedDeveloper?.Tier || "Not scored"}</span>
              </div>
              <div>
                <small>DELIVERY</small>
                <strong>
                  {selectedDeveloper?.["Delivery /10"]?.toFixed(1) || "—"}
                  <em>/10</em>
                </strong>
              </div>
              <div>
                <small>AREA PSF</small>
                <strong>
                  {selectedArea?.["PSF Benchmark"]
                    ? `AED ${selectedArea["PSF Benchmark"].toLocaleString()}`
                    : "—"}
                </strong>
              </div>
              <div>
                <small>GROSS YIELD</small>
                <strong>
                  {selectedArea?.["Gross Yield"]
                    ? `${(selectedArea["Gross Yield"] * 100).toFixed(1)}%`
                    : "—"}
                </strong>
              </div>
            </div>
          </section>

          <a
            className="whatsapp-cta"
            href={whatsappLink(project, lang)}
            target="_blank"
            rel="noreferrer"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                fill="currentColor"
                d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.2c-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.3M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2"
              />
            </svg>
            {lang === "ar"
              ? "استفسر على واتساب"
              : lang === "it"
                ? "Chiedi su WhatsApp"
                : "Enquire on WhatsApp"}
          </a>

          <section className="source-actions">
            <a href={propertyFinderUrl(project)} target="_blank" rel="noreferrer">
              View original project source <b>↗</b>
            </a>
            <a href={developerUrl(developerName)} target="_blank" rel="noreferrer">
              Developer website <b>↗</b>
            </a>
          </section>
          <p className="source-note">
            Project imagery and public listing details are linked to Property Finder. Prices and
            availability may change; verify the latest developer price list and SPA before advising a
            client.
          </p>
        </div>
      </article>
    </div>
  );
}
