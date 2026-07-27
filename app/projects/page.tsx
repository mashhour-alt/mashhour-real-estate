"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DataNotice,
  Footer,
  Header,
  PageIntro,
  ProjectVisual,
  SearchBox,
  useDldReconciliationReport,
  usePlatformData,
  useProjectEnrichment,
  useProjectLiveData,
} from "../components";
import { areaFrom, constructionProgressFromRecord, isDldLinked, money } from "../data";

export default function ProjectsPage() {
  const data = usePlatformData();
  const enrichment = useProjectEnrichment();
  const liveData = useProjectLiveData();
  const dldReport = useDldReconciliationReport();
  const [query, setQuery] = useState("");
  const [area, setArea] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("area") || "");
  const [developer, setDeveloper] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("developer") || "");
  const [unitType, setUnitType] = useState("");
  const [handover, setHandover] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sourceStatus, setSourceStatus] = useState("");
  const [sort, setSort] = useState("recommended");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [visible, setVisible] = useState(24);
  const projectCoverage = useCallback((project: NonNullable<typeof data>["projects"][number]) => {
    const name = project["Project Name | اسم المشروع"];
    const source = liveData[name];
    const verified = enrichment[name];
    const price = verified?.officialStartingPrice ?? source?.startingPrice ?? project["Starting Price AED | السعر المبدئي"];
    const handover = source?.deliveryDate ?? project["Handover | التسليم"];
    const units = verified?.unitTypes
      || source?.propertyTypes?.join(", ")
      || project["Unit Type | نوع الوحدة"];
    const payment = Boolean(
      source?.detailedPaymentPlans?.some((plan) => plan.phases?.length)
      || project["Booking % | الحجز"] != null
      || project["During Construction % | أثناء الإنشاء"] != null
      || project["At Handover % | عند التسليم"] != null
    );
    const media = Boolean(source?.media?.length || source?.images?.length);
    const brochure = Boolean(source?.brochureUrl);
    const completed = [Boolean(price), Boolean(handover), Boolean(units), payment, media, brochure].filter(Boolean).length;
    return { price: Boolean(price), handover: Boolean(handover), units: Boolean(units), payment, media, brochure, completed, complete: completed === 6 };
  }, [enrichment, liveData]);
  const updateFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setVisible(24);
  };
  const areas = useMemo(() => Array.from(new Set((data?.projects || []).map((item) => areaFrom(item["Location / Community | المنطقة"])))).sort(), [data]);
  const developers = useMemo(() => Array.from(new Set((data?.projects || []).map((item) => item["Developer | المطور"]).filter((item): item is string => Boolean(item)))).sort(), [data]);
  const unitTypes = useMemo(() => Array.from(new Set((data?.projects || []).flatMap((item) => (item["Unit Type | نوع الوحدة"] || "").split(/[,/|]/).map((value) => value.trim())).filter(Boolean))).sort(), [data]);
  const projects = useMemo(() => (data?.projects || []).filter((project) => {
    const name = project["Project Name | اسم المشروع"];
    const text = `${project["Project Name | اسم المشروع"]} ${project["Developer | المطور"]} ${areaFrom(project["Location / Community | المنطقة"])}`.toLowerCase();
    const price = enrichment[name]?.officialStartingPrice || liveData[name]?.startingPrice || project["Starting Price AED | السعر المبدئي"];
    const projectHandover = `${liveData[name]?.deliveryDate || ""} ${project["Handover | التسليم"] || ""}`.toLowerCase();
    const projectUnits = `${enrichment[name]?.unitTypes || ""} ${liveData[name]?.propertyTypes?.join(" ") || ""} ${liveData[name]?.bedrooms?.join(" ") || ""} ${project["Unit Type | نوع الوحدة"] || ""}`.toLowerCase();
    const hasSource = Boolean(enrichment[name]?.verified || liveData[name]);
    const coverage = projectCoverage(project);
    return (!query || text.includes(query.toLowerCase()))
      && (!area || areaFrom(project["Location / Community | المنطقة"]) === area)
      && (!developer || project["Developer | المطور"] === developer)
      && (!unitType || projectUnits.includes(unitType.toLowerCase()))
      && (!handover || projectHandover.includes(handover.toLowerCase()))
      && (!maxPrice || (typeof price === "number" && price <= Number(maxPrice)))
      && (!sourceStatus || (
        sourceStatus === "verified"
          ? Boolean(enrichment[name]?.verified)
          : sourceStatus === "complete"
            ? coverage.complete
            : hasSource
      ));
  }).sort((a, b) => {
    const price = (project: typeof a) => enrichment[project["Project Name | اسم المشروع"]]?.officialStartingPrice || liveData[project["Project Name | اسم المشروع"]]?.startingPrice || project["Starting Price AED | السعر المبدئي"] || Number.MAX_SAFE_INTEGER;
    if (sort === "price-low") return price(a) - price(b);
    if (sort === "price-high") return price(b) - price(a);
    if (sort === "name") return a["Project Name | اسم المشروع"].localeCompare(b["Project Name | اسم المشروع"]);
    return 0;
  }), [data, query, area, developer, unitType, handover, maxPrice, sourceStatus, sort, enrichment, liveData, projectCoverage]);
  const activeFilterCount = [query, area, developer, unitType, handover, maxPrice, sourceStatus].filter(Boolean).length;
  const advancedFilterCount = [unitType, handover, maxPrice, sourceStatus].filter(Boolean).length;
  const resetFilters = () => {
    setQuery(""); setArea(""); setDeveloper(""); setUnitType(""); setHandover(""); setMaxPrice(""); setSourceStatus(""); setSort("recommended");
    setVisible(24);
  };
  const totalCount = data?.projects.length || 0;
  const dldPendingCount = data?.projects.filter((project) =>
    project["Data Status | حالة البيانات"]?.includes("legal match pending"),
  ).length || 0;
  const dldProjects = data?.projects.filter(isDldLinked) || [];
  const dldLinkedCount = dldProjects.length;
  const dldEscrowVerifiedCount = dldProjects.filter((project) =>
    project["Escrow Account Status | حالة حساب الضمان"] === "Verified Yes",
  ).length;
  const dldProgressCount = dldProjects.filter((project) =>
    constructionProgressFromRecord(project) != null,
  ).length;
  const coverage = useMemo(() => {
    const records = data?.projects || [];
    return records.reduce((summary, project) => {
      const item = projectCoverage(project);
      summary.source += Number(Boolean(liveData[project["Project Name | اسم المشروع"]]));
      summary.price += Number(item.price);
      summary.units += Number(item.units);
      summary.payment += Number(item.payment);
      summary.media += Number(item.media);
      summary.brochure += Number(item.brochure);
      summary.complete += Number(item.complete);
      return summary;
    }, { source: 0, price: 0, units: 0, payment: 0, media: 0, brochure: 0, complete: 0 });
  }, [data, liveData, projectCoverage]);

  return (
    <main><Header />
      <PageIntro eyebrow="PROJECT DATABASE" title="Dubai projects. One evolving record." intro="The catalogue combines the working sheet with DLD project records and developer sources. Missing fields remain visible for review instead of making the whole project disappear." action={<strong className="page-count">{projects.length.toLocaleString()} RESULTS</strong>} />
      <section className="page-body">
        <div className="audit-progress">
          <div className="audit-heading"><span>DLD RECONCILIATION AUDIT</span><strong>{totalCount.toLocaleString()} unique project records currently indexed</strong></div>
          <div className="audit-stats">
            <div><strong>{dldLinkedCount.toLocaleString()}</strong><span>records carrying an official DLD source link</span></div>
            <div><strong>{dldEscrowVerifiedCount.toLocaleString()}</strong><span>DLD-linked records with verified escrow</span></div>
            <div><strong>{dldProgressCount.toLocaleString()}</strong><span>DLD-linked records with explicit progress</span></div>
            <div><strong>{dldPendingCount.toLocaleString()}</strong><span>marketing names awaiting legal-name reconciliation</span></div>
            <div><strong>{dldReport?.recordsMerged || 0}</strong><span>legal-name matches completed in this audit</span></div>
          </div>
          <div className="coverage-bar"><i style={{ width: totalCount ? `${(dldLinkedCount / totalCount) * 100}%` : "0%" }} /></div>
          <p>Only records carrying the official DLD open-data source are counted as DLD-linked. Handover, progress and escrow remain visibly pending whenever the source record does not provide a confirmed value.</p>
        </div>
        <div className="data-coverage-panel">
          <div className="audit-heading"><span>PROJECT PACK COMPLETENESS</span><strong>{coverage.complete.toLocaleString()} projects now carry all six core sales fields</strong></div>
          <div className="coverage-stat-grid">
            <div><strong>{coverage.source.toLocaleString()}</strong><span>source-matched records</span></div>
            <div><strong>{coverage.price.toLocaleString()}</strong><span>starting prices</span></div>
            <div><strong>{coverage.units.toLocaleString()}</strong><span>unit-type records</span></div>
            <div><strong>{coverage.payment.toLocaleString()}</strong><span>payment plans</span></div>
            <div><strong>{coverage.media.toLocaleString()}</strong><span>real project galleries</span></div>
            <div><strong>{coverage.brochure.toLocaleString()}</strong><span>downloadable brochures</span></div>
          </div>
          <p>A complete pack has a price, handover, unit types, payment structure, real project media and a brochure. Missing information stays marked as pending and is never auto-filled.</p>
        </div>
        <div className="smart-filter-shell">
          <div className="smart-filter-primary">
            <SearchBox value={query} onChange={updateFilter(setQuery)} placeholder="Search project, developer or area" />
            <select aria-label="Area" value={area} onChange={(event) => updateFilter(setArea)(event.target.value)}><option value="">All areas</option>{areas.map((item) => <option key={item}>{item}</option>)}</select>
            <select aria-label="Developer" value={developer} onChange={(event) => updateFilter(setDeveloper)(event.target.value)}><option value="">All developers</option>{developers.map((item) => <option key={item}>{item}</option>)}</select>
            <button className={advancedOpen ? "advanced-toggle active" : "advanced-toggle"} onClick={() => setAdvancedOpen((value) => !value)}>More filters {advancedFilterCount > 0 && <b>{advancedFilterCount}</b>} <span>{advancedOpen ? "−" : "+"}</span></button>
          </div>
          {advancedOpen && <div className="smart-filter-advanced">
            <label><span>UNIT TYPE</span><select value={unitType} onChange={(event) => updateFilter(setUnitType)(event.target.value)}><option value="">Any unit</option>{unitTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>HANDOVER</span><select value={handover} onChange={(event) => updateFilter(setHandover)(event.target.value)}><option value="">Any date</option>{["2026", "2027", "2028", "2029", "2030"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>MAXIMUM PRICE</span><select value={maxPrice} onChange={(event) => updateFilter(setMaxPrice)(event.target.value)}><option value="">Any budget</option><option value="750000">Up to AED 750K</option><option value="1000000">Up to AED 1M</option><option value="1500000">Up to AED 1.5M</option><option value="2000000">Up to AED 2M</option><option value="3000000">Up to AED 3M</option><option value="5000000">Up to AED 5M</option></select></label>
            <label><span>DATA CONFIDENCE</span><select value={sourceStatus} onChange={(event) => updateFilter(setSourceStatus)(event.target.value)}><option value="">All records</option><option value="matched">Source matched</option><option value="complete">Complete project pack</option><option value="verified">Officially verified</option></select></label>
          </div>}
          <div className="smart-filter-footer">
            <strong><span>{projects.length.toLocaleString()}</span> matching projects</strong>
            <div><select aria-label="Sort projects" value={sort} onChange={(event) => updateFilter(setSort)(event.target.value)}><option value="recommended">Recommended order</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Project name A–Z</option></select>{activeFilterCount > 0 && <button onClick={resetFilters}>Clear all ×</button>}</div>
          </div>
        </div>
        {!projects.length && <div className="project-filter-empty"><span>0</span><h2>No exact match.</h2><p>Try widening the budget, handover date or area.</p><button onClick={resetFilters}>Reset filters</button></div>}
        <div className="project-grid platform-project-grid">
          {projects.slice(0, visible).map((project, index) => (
            <a className="project-card" href={`/projects/detail?name=${encodeURIComponent(project["Project Name | اسم المشروع"])}`} key={`${project["Project Name | اسم المشروع"]}-${index}`}>
              <div className="card-art">
                <ProjectVisual project={project} live={liveData[project["Project Name | اسم المشروع"]]} />
                <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
                <span className={enrichment[project["Project Name | اسم المشروع"]]?.verified ? "verification-chip verified" : project["Data Status | حالة البيانات"]?.includes("legal match pending") ? "verification-chip" : liveData[project["Project Name | اسم المشروع"]] ? "verification-chip reference-matched" : "verification-chip"}>
                  {enrichment[project["Project Name | اسم المشروع"]]?.verified ? "OFFICIAL DEVELOPER ✓" : project["Data Status | حالة البيانات"]?.includes("legal match pending") ? "DLD MATCH PENDING" : liveData[project["Project Name | اسم المشروع"]] ? "SOURCE MATCHED ✓" : "SOURCE PENDING"}
                </span>
                <strong className="developer-badge">{liveData[project["Project Name | اسم المشروع"]]?.developer || project["Developer | المطور"] || "Developer under review"}</strong>
              </div>
              <div className="card-body"><p>{enrichment[project["Project Name | اسم المشروع"]]?.community || areaFrom(liveData[project["Project Name | اسم المشروع"]]?.location || project["Location / Community | المنطقة"])}</p><h3>{enrichment[project["Project Name | اسم المشروع"]]?.officialName || liveData[project["Project Name | اسم المشروع"]]?.title || project["Project Name | اسم المشروع"]}</h3><div className="developer-name"><small>DEVELOPER</small><strong>{liveData[project["Project Name | اسم المشروع"]]?.developer || project["Developer | المطور"] || "Under review"}</strong></div><dl><div><dt>FROM</dt><dd>{money(enrichment[project["Project Name | اسم المشروع"]]?.officialStartingPrice || liveData[project["Project Name | اسم المشروع"]]?.startingPrice || project["Starting Price AED | السعر المبدئي"])}</dd></div><div><dt>HANDOVER</dt><dd>{project["Handover | التسليم"] || "TBA"}</dd></div></dl><div className={projectCoverage(project).complete ? "pack-status complete" : "pack-status"}><span>{projectCoverage(project).complete ? "COMPLETE PROJECT PACK" : `${projectCoverage(project).completed}/6 CORE FIELDS`}</span><i><b style={{ width: `${(projectCoverage(project).completed / 6) * 100}%` }} /></i></div><span className="card-link">Open gallery & full data <b>↗</b></span></div>
            </a>
          ))}
        </div>
        {visible < projects.length && <button className="load-more" onClick={() => setVisible((value) => value + 24)}>Load more ↓</button>}
      </section>
      <DataNotice /><Footer />
    </main>
  );
}
