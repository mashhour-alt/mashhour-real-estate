"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VoiceAssistant } from "./voice-assistant";
import type {
  DldReconciliationReport,
  PlatformData,
  Project,
  ProjectAliasMap,
  ProjectDetailSource,
  ProjectEnrichmentMap,
  ProjectLiveData,
  ProjectLiveDataMap,
} from "./data";

const links = [
  ["/", "Home", "الرئيسية"],
  ["/map", "Map", "الخريطة"],
  ["/projects", "Projects", "المشاريع"],
  ["/compare", "Compare", "المقارنة"],
  ["/areas", "Areas", "المناطق"],
  ["/developers", "Developers", "المطورون"],
  ["/articles", "Articles", "المقالات"],
  ["/calculators", "Calculator", "الحاسبة"],
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [arabic, setArabic] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("menu-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="platform-header">
        <Link className="platform-brand" href="/" aria-label="Mashhour Real Estate home">
          <span className="logo-window"><img src="/assets/mashhour-black.png" alt="" /></span>
          <span>REAL ESTATE</span>
        </Link>
        <div className="header-actions">
          <button className="language-button" onClick={() => setArabic((value) => !value)}>{arabic ? "EN" : "ع"}</button>
          <button className="menu-button" aria-label="Open menu" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(true)}>
            <span /><span /><span />
          </button>
        </div>
      </header>
      <div className={open ? "menu-shell open" : "menu-shell"} aria-hidden={!open}>
        <button className="menu-backdrop" aria-label="Close menu" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} />
        <aside id="site-menu" className="menu-drawer" role="dialog" aria-modal="true" aria-label="Main menu" dir={arabic ? "rtl" : "ltr"}>
          <div className="menu-drawer-head">
            <span>{arabic ? "القائمة" : "Menu"}</span>
            <button className="menu-close" aria-label="Close menu" onClick={() => setOpen(false)}>×</button>
          </div>
          <nav className="drawer-nav">
            {links.map(([href, en, ar], index) => (
              <a className={isActive(href) ? "active" : ""} key={href} href={href} onClick={() => setOpen(false)}>
                <small>{String(index).padStart(2, "0")}</small>
                <strong>{arabic ? ar : en}</strong>
              </a>
            ))}
          </nav>
          <div className="drawer-language">
            <span>{arabic ? "اللغة" : "Language"}</span>
            <div>
              <button className={!arabic ? "active" : ""} onClick={() => setArabic(false)}>EN</button>
              <button className={arabic ? "active" : ""} onClick={() => setArabic(true)}>AR</button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export function Footer() {
  return (
    <footer className="platform-footer">
      <div><strong>MASHHOUR REAL ESTATE</strong><p>Dubai off-plan intelligence, made clearer.</p></div>
      <div className="footer-links"><a href="/projects">Projects</a><a href="/areas">Areas</a><a href="/developers">Developers</a><a href="https://wa.me/971582239619" target="_blank" rel="noreferrer">WhatsApp</a><a href="mailto:mahmoudmashhournasr@gmail.com">Email</a></div>
      <span>© 2026 Mashhour Real Estate</span>
    </footer>
  );
}

export function ContactDock() {
  return (
    <>
      <nav className="contact-dock" aria-label="Direct contact">
        <a className="whatsapp" href="https://wa.me/971582239619?text=Hello%20Mahmoud%2C%20I%20am%20interested%20in%20Dubai%20off-plan%20property." target="_blank" rel="noreferrer">WhatsApp</a>
        <a href="tel:+971582239619">Call</a>
        <a href="mailto:mahmoudmashhournasr@gmail.com?subject=Mashhour%20Real%20Estate%20enquiry">Email</a>
      </nav>
      <VoiceAssistant />
    </>
  );
}

export function LeadSection() {
  const [sent, setSent] = useState(false);

  function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = [
      "New Mashhour Real Estate enquiry",
      `Name: ${String(form.get("name") || "").trim()}`,
      `Phone: ${String(form.get("phone") || "").trim()}`,
      `Interest: ${String(form.get("interest") || "").trim()}`,
    ].join("\n");
    setSent(true);
    window.open(`https://wa.me/971582239619?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="lead-section" id="contact">
      <div>
        <p>DIRECT TO MAHMOUD</p>
        <h2>Tell me what you’re looking for.</h2>
        <span>Your enquiry opens as a prepared WhatsApp message, so you stay in control and get a direct response.</span>
      </div>
      <form onSubmit={submitLead}>
        <input name="name" required autoComplete="name" placeholder="Your name" aria-label="Your name" />
        <input name="phone" required autoComplete="tel" inputMode="tel" placeholder="Phone / WhatsApp" aria-label="Phone or WhatsApp" />
        <select name="interest" required defaultValue="" aria-label="Property interest">
          <option value="" disabled>What are you looking for?</option>
          <option>Investment property</option>
          <option>Home in Dubai</option>
          <option>Project information</option>
          <option>Broker collaboration</option>
        </select>
        <button type="submit">Send on WhatsApp ↗</button>
        {sent ? <p className="lead-success" role="status">Your WhatsApp message is ready. Press send to complete the enquiry.</p> : null}
      </form>
    </section>
  );
}

export function PageIntro({ eyebrow, title, intro, action }: { eyebrow: string; title: string; intro: string; action?: React.ReactNode }) {
  return (
    <section className="page-intro">
      <div><p><i />{eyebrow}</p><h1>{title}</h1><span>{intro}</span></div>
      {action}
    </section>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="platform-search"><span>⌕</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

export function usePlatformData() {
  const [data, setData] = useState<PlatformData | null>(null);
  useEffect(() => {
    fetch("/data/project-catalog.json").then((response) => response.json()).then(setData);
  }, []);
  return data;
}

export function useProjectAliases() {
  const [aliases, setAliases] = useState<ProjectAliasMap>({});
  useEffect(() => {
    fetch("/data/project-aliases.json").then((response) => response.json()).then(setAliases);
  }, []);
  return aliases;
}

export function useDldReconciliationReport() {
  const [report, setReport] = useState<DldReconciliationReport | null>(null);
  useEffect(() => {
    fetch("/data/dld-reconciliation-report.json").then((response) => response.json()).then(setReport);
  }, []);
  return report;
}

export function useProjectEnrichment() {
  const [enrichment, setEnrichment] = useState<ProjectEnrichmentMap>({});
  useEffect(() => {
    fetch("/data/project-enrichment.json").then((response) => response.json()).then(setEnrichment);
  }, []);
  return enrichment;
}

export function useProjectLiveData() {
  const [projects, setProjects] = useState<ProjectLiveDataMap>({});
  useEffect(() => {
    Promise.all([
      fetch("/data/project-live-data.json").then((response) => response.json()),
      fetch("/data/google-maps-coordinate-verifications.json").then((response) => response.json()),
    ]).then(([live, verified]) => {
      const merged = { ...live } as ProjectLiveDataMap;
      Object.entries(verified as Record<string, { coordinates: { lat: number; lng: number } }>).forEach(([name, entry]) => {
        merged[name] = {
          sourceProvider: "Google Maps",
          sourceUpdatedAt: "2026-07-26",
          sourceProjectId: `google-maps:${name}`,
          referenceUrl: null,
          title: name,
          developer: null,
          developerLogo: null,
          images: [],
          coordinates: entry.coordinates,
          location: null,
          amenities: [],
          bedrooms: [],
          propertyTypes: [],
          deliveryDate: null,
          startingPrice: null,
          priceRange: null,
          paymentPlans: [],
          constructionPhase: null,
          constructionProgress: null,
          stockAvailability: null,
          ...(merged[name] || {}),
          coordinates: entry.coordinates,
        };
      });
      setProjects(merged);
    });
  }, []);
  return projects;
}

export function useProjectDetail(referenceUrl: string | null | undefined) {
  const [result, setResult] = useState<{ source: string; detail: ProjectDetailSource } | null>(null);
  useEffect(() => {
    if (!referenceUrl) return;
    const controller = new AbortController();
    fetch(`/api/project-detail?source=${encodeURIComponent(btoa(referenceUrl))}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Project detail unavailable");
        return response.json();
      })
      .then((detail) => setResult({ source: referenceUrl, detail }))
      .catch(() => undefined);
    return () => controller.abort();
  }, [referenceUrl]);
  return result && result.source === referenceUrl ? result.detail : null;
}

export function ProjectVisual({
  project,
  live,
  className = "",
}: {
  project: Project;
  live?: ProjectLiveData;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const image = live?.images?.[0];
  const developer = live?.developer || project["Developer | المطور"] || "Developer under review";
  const name = live?.title || project["Project Name | اسم المشروع"];
  return (
    <div className={`project-visual ${image && !failed ? "has-media" : "awaiting-media"} ${className}`.trim()}>
      {image && !failed ? (
        <img src={image} alt={`${name} project`} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className="project-visual-placeholder">
          <small>PROJECT MEDIA</small>
          <strong>{name}</strong>
          <span>{developer}</span>
        </div>
      )}
      {live?.developerLogo ? (
        <span className="project-developer-logo">
          <img src={live.developerLogo} alt={`${developer} logo`} loading="lazy" />
        </span>
      ) : null}
      {live?.images?.length ? <b className="media-count">{live.images.length} PHOTOS</b> : null}
    </div>
  );
}

export function DataNotice() {
  return (
    <aside className="data-notice">
      <span>DATA STANDARD</span>
      <p>Locations, imagery, availability and pricing are published only after source verification. Missing fields stay visibly marked instead of being guessed.</p>
    </aside>
  );
}
