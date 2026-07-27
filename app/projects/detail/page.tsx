"use client";

import { useMemo } from "react";
import {
  DataNotice,
  Footer,
  Header,
  ProjectVisual,
  usePlatformData,
  useProjectDetail,
  useProjectAliases,
  useProjectEnrichment,
  useProjectLiveData,
} from "../../components";
import { areaFrom, constructionProgressFromRecord, developerUrl, isDldLinked, money } from "../../data";

const humanize = (value: string | null | undefined) =>
  value ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Under review";

export default function ProjectDetailPage() {
  const data = usePlatformData();
  const aliases = useProjectAliases();
  const enrichmentMap = useProjectEnrichment();
  const liveMap = useProjectLiveData();
  const name = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("name") : "";
  const resolvedName = name ? aliases[name] || name : "";
  const project = useMemo(() => data?.projects.find((item) => item["Project Name | اسم المشروع"] === resolvedName), [data, resolvedName]);
  const live = resolvedName ? liveMap[resolvedName] : undefined;
  const sourceDetail = useProjectDetail(live?.referenceUrl);

  if (!project) {
    return <main><Header /><section className="loading-page"><p>PROJECT RECORD</p><h1>{data ? "Project not found." : "Loading project…"}</h1><a href="/projects">← Back to projects</a></section></main>;
  }

  const enrichment = enrichmentMap[project["Project Name | اسم المشروع"]];
  const displayName = enrichment?.officialName || live?.title || project["Project Name | اسم المشروع"];
  const developer = live?.developer || project["Developer | المطور"] || "Developer under review";
  const official = developerUrl(developer);
  const community = enrichment?.community || areaFrom(live?.location || project["Location / Community | المنطقة"]);
  const amenities = enrichment?.amenities?.length
    ? enrichment.amenities
    : sourceDetail?.amenities?.length
      ? sourceDetail.amenities
      : live?.amenities || [];
  const sourceMedia = sourceDetail?.media?.length ? sourceDetail.media : live?.media || [];
  const media = sourceMedia.length
    ? sourceMedia
    : (live?.images || []).map((url) => ({ url, preview: url, type: "image" }));
  const imageMedia = media.filter((item) => item.type === "image" || item.type === "master-plan");
  const videoMedia = media.filter((item) => item.type === "video");
  const floorPlans = (sourceDetail?.unitOptions?.length ? sourceDetail.unitOptions : live?.unitOptions || []).flatMap((unit) =>
    (unit.layouts || []).flatMap((layout) =>
      (layout.floorPlans || []).map((url) => ({
        url,
        propertyType: unit.propertyType || "Residence",
        bedrooms: layout.bedrooms ?? unit.bedrooms,
        area: layout.area || unit.areaFrom,
        bathrooms: layout.bathrooms ?? unit.bathroomsFrom,
        layoutType: layout.layoutType || "Layout",
      })),
    ),
  );
  const coordinates = enrichment?.coordinates || live?.coordinates;
  const dldLinked = isDldLinked(project);
  const recordProgress = constructionProgressFromRecord(project);
  const escrowStatus = project["Escrow Account Status | حالة حساب الضمان"] === "Verified Yes"
    ? "Verified"
    : "Pending verification";
  const overview = enrichment?.overview || `${displayName} is a ${live?.propertyTypes?.length ? live.propertyTypes.join(" and ") : "residential"} project by ${developer} in ${community}. The record below combines the cleaned spreadsheet reference with currently available project media, amenities, unit types, payment information and precise source coordinates.`;
  const status = enrichment?.verified
    ? "Official developer source verified"
    : live
      ? "Reference media and location matched"
      : "Public source material pending";
  const detailFacts = [
    ["LEGAL RECORD", dldLinked ? "DLD source linked" : "Legal match pending"],
    ["DELIVERY", sourceDetail?.deliveryDate || live?.deliveryDate || project["Handover | التسليم"] || "To be announced"],
    ["CONSTRUCTION", humanize(sourceDetail?.constructionPhase || live?.constructionPhase)],
    ["PROGRESS", sourceDetail?.constructionProgress != null
      ? `${sourceDetail.constructionProgress}%`
      : live?.constructionProgress != null
        ? `${live.constructionProgress}%`
        : recordProgress != null
          ? `${recordProgress}%`
          : "Not published"],
    ["ESCROW", dldLinked ? escrowStatus : "DLD verification pending"],
    ["OWNERSHIP", humanize(sourceDetail?.ownershipType || live?.ownershipType)],
    ["UNIT OPTIONS", floorPlans.length ? `${floorPlans.length} verified layouts` : humanize(enrichment?.unitTypes || live?.propertyTypes?.join(", "))],
    ["AVAILABILITY", humanize(sourceDetail?.stockAvailability || live?.stockAvailability)],
  ];
  const detailedPlan = sourceDetail?.paymentPlans?.find((plan) => plan.phases?.length)?.phases;

  return (
    <main><Header />
      <section className="project-detail-hero">
        <ProjectVisual project={project} live={live} className="detail-project-visual" />
        <div className="detail-hero-copy"><p>{community}</p><h1>{displayName}</h1><strong>{developer}</strong></div>
        <span className={enrichment?.verified ? "verification-chip large verified" : live ? "verification-chip large reference-matched" : "verification-chip large"}>
          {enrichment?.verified ? "OFFICIAL RECORD VERIFIED ✓" : live ? "PROJECT SOURCE MATCHED ✓" : "SOURCE MATERIAL PENDING"}
        </span>
      </section>
      <nav className="project-section-nav" aria-label="Project page sections">
        <a href="#overview">Overview</a><a href="#payment">Payment</a><a href="#amenities">Amenities</a>
        <a href="#gallery">Gallery</a><a href="#layouts">Layouts</a><a href="#location">Location</a>
      </nav>

      <section className="detail-layout">
        <article>
          <div className="detail-metrics">
            <div><small>STARTING PRICE</small><strong>{money(enrichment?.officialStartingPrice ?? live?.startingPrice ?? project["Starting Price AED | السعر المبدئي"])}</strong></div>
            <div><small>HANDOVER</small><strong>{sourceDetail?.deliveryDate || live?.deliveryDate || project["Handover | التسليم"] || "TBA"}</strong></div>
            <div><small>UNIT TYPE</small><strong>{enrichment?.unitTypes || humanize(sourceDetail?.propertyTypes?.join(", ") || live?.propertyTypes?.join(", ") || project["Unit Type | نوع الوحدة"])}</strong></div>
            <div><small>DATA STATUS</small><strong>{status}</strong></div>
          </div>

          <div className="content-block" id="overview"><span>01</span><h2>Project overview</h2><p>{overview}</p>
            <div className="verified-meta">
              <span>Record refreshed {live?.sourceUpdatedAt || enrichment?.verifiedAt || "pending"}</span>
              <span>Exact coordinates: {coordinates ? "Matched" : "Pending"}</span>
              <span>Media: {media.length ? `${media.length} files` : "Pending"}</span>
              <span>Availability: {humanize(live?.stockAvailability)}</span>
            </div>
            <div className="project-fact-grid">
              {detailFacts.map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}
            </div>
          </div>

          <div className="content-block" id="payment"><span>02</span><h2>Payment plan</h2><div className="payment-plan">
            {detailedPlan?.length ? detailedPlan.map((phase, index) => (
              <div key={`${phase.label}-${index}`}><strong>{phase.value != null ? `${phase.value}%` : "—"}</strong><span>{phase.label || `Phase ${index + 1}`}</span></div>
            )) : <>
              <div><strong>{project["Booking % | الحجز"] != null ? `${project["Booking % | الحجز"] * 100}%` : "—"}</strong><span>Booking</span></div>
              <div><strong>{project["During Construction % | أثناء الإنشاء"] != null ? `${project["During Construction % | أثناء الإنشاء"] * 100}%` : "—"}</strong><span>Construction</span></div>
              <div><strong>{project["At Handover % | عند التسليم"] != null ? `${project["At Handover % | عند التسليم"] * 100}%` : "—"}</strong><span>Handover</span></div>
            </>}
          </div><p className="source-note">Payment milestones are shown from the most detailed matched project record available and must be reconfirmed before reservation.</p></div>

          <div className="content-block" id="amenities"><span>03</span><h2>Amenities</h2>
            {amenities.length ? <div className="amenity-list">{amenities.map((item) => <span key={item}>{item}</span>)}</div> : <div className="gallery-placeholder"><strong>Amenities under review</strong><p>The project’s public amenity list has not been matched yet.</p></div>}
          </div>

          <div className="content-block" id="gallery"><span>04</span><h2>Full project gallery</h2>
            {imageMedia.length ? <div className="project-gallery">{imageMedia.map((item, index) => <a href={item.url} target="_blank" rel="noreferrer" key={`${item.url}-${index}`}><img src={item.preview || item.url} alt={`${displayName} media ${index + 1}`} loading="lazy" /><span>{item.type === "master-plan" ? "MASTER PLAN" : `IMAGE ${index + 1}`}</span></a>)}</div> : <div className="gallery-placeholder"><strong>Real project media pending</strong><p>No generic substitute is shown while the official or reference gallery is unavailable.</p></div>}
            {videoMedia.length ? <div className="project-videos">{videoMedia.map((item, index) => <video src={item.url} controls preload="metadata" key={`${item.url}-${index}`}>Project video</video>)}</div> : null}
          </div>

          <div className="content-block" id="layouts"><span>05</span><h2>Layouts & floor plans</h2>
            {floorPlans.length ? <div className="floor-plan-grid">{floorPlans.map((layout, index) => <a href={layout.url} target="_blank" rel="noreferrer" key={`${layout.url}-${index}`}><img src={layout.url} alt={`${displayName} floor plan ${index + 1}`} loading="lazy" /><div><strong>{layout.layoutType}</strong><span>{layout.bedrooms === 0 ? "Studio" : layout.bedrooms != null ? `${layout.bedrooms} bedroom` : layout.propertyType}</span>{layout.area ? <small>{layout.area.toLocaleString()} sq ft</small> : null}</div></a>)}</div> : <div className="gallery-placeholder"><strong>Floor plans are being sourced</strong><p>Layouts appear here only when a project-level floor-plan file is available.</p></div>}
          </div>

          <div className="content-block location-record" id="location"><span>06</span><h2>Exact location record</h2>
            {coordinates ? <div className="coordinate-card"><div><small>LATITUDE</small><strong>{coordinates.lat.toFixed(6)}</strong></div><div><small>LONGITUDE</small><strong>{coordinates.lng.toFixed(6)}</strong></div><a href={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`} target="_blank" rel="noreferrer">Open precise location ↗</a></div> : <div className="gallery-placeholder"><strong>Plot coordinates pending</strong><p>The project will not be pinned approximately at an area centre.</p></div>}
          </div>
        </article>

        <aside className="project-contact">
          {live?.developerLogo ? <img className="detail-developer-logo" src={live.developerLogo} alt={`${developer} logo`} /> : null}
          <p>MASHHOUR REAL ESTATE</p><h2>Request the verified project pack.</h2>
          <a href={`https://wa.me/971582239619?text=${encodeURIComponent(`Hello Mahmoud, I am interested in ${displayName}. Please send me the verified project pack.`)}`} target="_blank" rel="noreferrer">WhatsApp enquiry ↗</a>
          <a className="secondary-link" href="tel:+971582239619">Call Mahmoud →</a>
          <a className="secondary-link" href={`mailto:mahmoudmashhournasr@gmail.com?subject=${encodeURIComponent(displayName)}`}>Email enquiry ↗</a>
          <a className="secondary-link" href={`/compare?project=${encodeURIComponent(project["Project Name | اسم المشروع"])}`}>Add to comparison →</a>
          {(sourceDetail?.brochureUrl || live?.brochureUrl) && <a className="secondary-link" href={sourceDetail?.brochureUrl || live?.brochureUrl || "#"} target="_blank" rel="noreferrer">Download project brochure ↗</a>}
          {enrichment?.officialSource && <a className="secondary-link verified-source" href={enrichment.officialSource} target="_blank" rel="noreferrer">Official project source ✓</a>}
          {enrichment?.videoUrl && <a className="secondary-link" href={enrichment.videoUrl} target="_blank" rel="noreferrer">Watch project on YouTube ↗</a>}
          {official && <a className="secondary-link" href={official} target="_blank" rel="noreferrer">Developer website ↗</a>}
          <small>Project media reference: {live?.sourceProvider || "official source pending"}. No Property Finder project link is shown. Price and availability must be reconfirmed before reservation.</small>
        </aside>
      </section>
      <DataNotice /><Footer />
    </main>
  );
}
