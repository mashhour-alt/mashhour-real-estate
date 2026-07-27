"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Footer,
  Header,
  PageIntro,
  ProjectVisual,
  SearchBox,
  usePlatformData,
  useProjectEnrichment,
  useProjectLiveData,
} from "../components";
import { areaFrom, money, type Project } from "../data";

const STORAGE_KEY = "mashhour-comparison";
const MAX_PROJECTS = 4;

const projectName = (project: Project) => project["Project Name | اسم المشروع"];
const numericHandover = (value: string | null) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const year = value.match(/20\d{2}/)?.[0];
  const quarter = value.match(/Q([1-4])/i)?.[1];
  return year ? Number(year) * 10 + Number(quarter || 4) : Number.POSITIVE_INFINITY;
};

export default function ComparePage() {
  const data = usePlatformData();
  const enrichment = useProjectEnrichment();
  const liveData = useProjectLiveData();
  const [selectedNames, setSelectedNames] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const requested = new URLSearchParams(window.location.search).get("project");
    let saved: string[] = [];
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      saved = [];
    }
    return Array.from(new Set(requested ? [...saved, requested] : saved)).slice(0, MAX_PROJECTS);
  });
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (selectedNames.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedNames));
    else localStorage.removeItem(STORAGE_KEY);
  }, [selectedNames]);

  const projects = useMemo(() => {
    const all = data?.projects || [];
    return selectedNames.map((name) => all.find((item) => projectName(item) === name)).filter((item): item is Project => Boolean(item));
  }, [data, selectedNames]);

  const choices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.projects || []).filter((project) => {
      if (selectedNames.includes(projectName(project))) return false;
      const searchable = `${projectName(project)} ${project["Developer | المطور"] || ""} ${project["Location / Community | المنطقة"] || ""}`.toLowerCase();
      return !needle || searchable.includes(needle);
    }).slice(0, 12);
  }, [data, query, selectedNames]);

  const priceFor = (project: Project) =>
    enrichment[projectName(project)]?.officialStartingPrice ||
    liveData[projectName(project)]?.startingPrice ||
    project["Starting Price AED | السعر المبدئي"];
  const finitePrices = projects.map(priceFor).filter((value): value is number => typeof value === "number" && value > 0);
  const bestPrice = finitePrices.length ? Math.min(...finitePrices) : null;
  const bestHandover = Math.min(...projects.map((project) => numericHandover(project["Handover | التسليم"])));
  const amenityCounts = projects.map((project) => liveData[projectName(project)]?.amenities?.length || enrichment[projectName(project)]?.amenities?.length || 0);
  const bestAmenities = amenityCounts.length ? Math.max(...amenityCounts) : 0;

  const addProject = (name: string) => {
    setSelectedNames((current) => current.includes(name) || current.length >= MAX_PROJECTS ? current : [...current, name]);
    setQuery("");
    if (selectedNames.length + 1 >= MAX_PROJECTS) setPickerOpen(false);
  };
  const removeProject = (name: string) => setSelectedNames((current) => current.filter((item) => item !== name));

  const paymentText = (project: Project) => {
    const live = liveData[projectName(project)];
    if (live?.paymentPlans?.length) return live.paymentPlans.slice(0, 2).join(" • ");
    const booking = project["Booking % | الحجز"];
    const construction = project["During Construction % | أثناء الإنشاء"];
    const handover = project["At Handover % | عند التسليم"];
    return [booking != null ? `${booking}% booking` : "", construction != null ? `${construction}% construction` : "", handover != null ? `${handover}% handover` : ""].filter(Boolean).join(" • ") || "Under verification";
  };

  return (
    <main>
      <Header />
      <PageIntro
        eyebrow="DECISION WORKSPACE"
        title="Compare projects. Choose with confidence."
        intro="Put up to four Dubai projects side by side. The strongest available value in each decision-critical row is highlighted automatically."
        action={<strong className="page-count">{projects.length} / {MAX_PROJECTS} SELECTED</strong>}
      />

      <section className="compare-workspace">
        <div className="compare-toolbar">
          <div>
            <span>YOUR SHORTLIST</span>
            <strong>{projects.length ? `${projects.length} projects ready to compare` : "Start by choosing two projects"}</strong>
          </div>
          <button className="compare-add" disabled={projects.length >= MAX_PROJECTS} onClick={() => setPickerOpen((value) => !value)}>
            {pickerOpen ? "Close selector ×" : "＋ Add project"}
          </button>
        </div>

        {pickerOpen && projects.length < MAX_PROJECTS ? (
          <div className="compare-picker">
            <SearchBox value={query} onChange={setQuery} placeholder="Search by project, developer or area" />
            <div className="compare-picker-results">
              {choices.map((project) => (
                <button key={projectName(project)} onClick={() => addProject(projectName(project))}>
                  <span><strong>{projectName(project)}</strong><small>{project["Developer | المطور"] || "Developer under review"} · {areaFrom(project["Location / Community | المنطقة"])}</small></span>
                  <b>＋</b>
                </button>
              ))}
              {!choices.length && <p>No matching projects found.</p>}
            </div>
          </div>
        ) : null}

        {!projects.length ? (
          <section className="empty-workspace compare-empty">
            <span>＋</span>
            <h2>Your comparison starts here.</h2>
            <p>Choose projects from the full directory or add one using the selector above.</p>
            <button className="button primary" onClick={() => setPickerOpen(true)}>Choose projects <b>↗</b></button>
          </section>
        ) : (
          <div className="comparison-scroll" aria-label="Project comparison">
            <div className="comparison-grid" style={{ "--compare-columns": projects.length } as React.CSSProperties}>
              <div className="comparison-label comparison-label-head"><span>PROJECTS</span><small>Swipe horizontally on mobile</small></div>
              {projects.map((project) => {
                const live = liveData[projectName(project)];
                return (
                  <article className="comparison-project" key={projectName(project)}>
                    <button className="comparison-remove" aria-label={`Remove ${projectName(project)}`} onClick={() => removeProject(projectName(project))}>×</button>
                    <ProjectVisual project={project} live={live} />
                    <div><small>{areaFrom(live?.location || project["Location / Community | المنطقة"])}</small><h2>{live?.title || projectName(project)}</h2><span>{live?.developer || project["Developer | المطور"] || "Under review"}</span></div>
                  </article>
                );
              })}

              <ComparisonRow label="Starting price" hint="Lowest available price">
                {projects.map((project) => <Metric key={projectName(project)} best={bestPrice != null && priceFor(project) === bestPrice} value={money(priceFor(project))} />)}
              </ComparisonRow>
              <ComparisonRow label="Location" hint="Community">
                {projects.map((project) => <Metric key={projectName(project)} value={enrichment[projectName(project)]?.community || areaFrom(liveData[projectName(project)]?.location || project["Location / Community | المنطقة"])} />)}
              </ComparisonRow>
              <ComparisonRow label="Developer" hint="Project owner">
                {projects.map((project) => <Metric key={projectName(project)} value={liveData[projectName(project)]?.developer || project["Developer | المطور"] || "Under review"} />)}
              </ComparisonRow>
              <ComparisonRow label="Handover" hint="Earliest date highlighted">
                {projects.map((project) => <Metric key={projectName(project)} best={numericHandover(project["Handover | التسليم"]) === bestHandover && Number.isFinite(bestHandover)} value={project["Handover | التسليم"] || liveData[projectName(project)]?.deliveryDate || "TBA"} />)}
              </ComparisonRow>
              <ComparisonRow label="Payment plan" hint="Published structure">
                {projects.map((project) => <Metric key={projectName(project)} value={paymentText(project)} compact />)}
              </ComparisonRow>
              <ComparisonRow label="Unit types" hint="Available mix">
                {projects.map((project) => {
                  const live = liveData[projectName(project)];
                  const value = live?.bedrooms?.length ? live.bedrooms.join(", ") : live?.propertyTypes?.join(", ") || project["Unit Type | نوع الوحدة"] || "Under verification";
                  return <Metric key={projectName(project)} value={value} compact />;
                })}
              </ComparisonRow>
              <ComparisonRow label="Amenities" hint="Most complete list">
                {projects.map((project, index) => {
                  const amenities = liveData[projectName(project)]?.amenities || enrichment[projectName(project)]?.amenities || [];
                  return <Metric key={projectName(project)} best={bestAmenities > 0 && amenityCounts[index] === bestAmenities} value={amenities.length ? `${amenities.length} verified amenities` : "Under verification"} />;
                })}
              </ComparisonRow>
              <ComparisonRow label="Explore" hint="Full project record">
                {projects.map((project) => <a className="comparison-open" key={projectName(project)} href={`/projects/detail?name=${encodeURIComponent(projectName(project))}`}>View full project <b>↗</b></a>)}
              </ComparisonRow>
            </div>
          </div>
        )}
        <p className="compare-footnote">Best-value markers use the verified data currently available. Pricing and availability can change and should be reconfirmed before reservation.</p>
      </section>
      <Footer />
    </main>
  );
}

function ComparisonRow({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return <>
    <div className="comparison-label"><strong>{label}</strong><small>{hint}</small></div>
    {children}
  </>;
}

function Metric({ value, best = false, compact = false }: { value: string; best?: boolean; compact?: boolean }) {
  return <div className={`comparison-metric${best ? " best" : ""}${compact ? " compact" : ""}`}>{best && <span>BEST VALUE</span>}<strong>{value}</strong></div>;
}
