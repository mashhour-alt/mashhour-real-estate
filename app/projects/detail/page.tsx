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
  useUnitPricing,
} from "../../components";
import { areaFrom, constructionProgressFromRecord, developerUrl, isDldLinked, money, slugify } from "../../data";
import { PageSeo, compact } from "../../seo";

const humanize = (value: string | null | undefined) =>
  value ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Under review";

const amenityIcon = (value: string) => {
  const name = value.toLowerCase();

  if (name.includes("pool") || name.includes("swim")) return "≋";
  if (name.includes("gym") || name.includes("fitness")) return "H";
  if (name.includes("kid") || name.includes("play")) return "✦";
  if (name.includes("parking")) return "P";
  if (name.includes("security") || name.includes("cctv")) return "◇";
  if (name.includes("concierge") || name.includes("lobby")) return "●";
  if (name.includes("beach") || name.includes("water")) return "≈";
  if (name.includes("garden") || name.includes("park")) return "♧";
  if (name.includes("bbq") || name.includes("barbecue")) return "♨";
  if (name.includes("cinema")) return "▶";
  if (name.includes("spa") || name.includes("sauna")) return "✧";
  if (name.includes("restaurant") || name.includes("cafe")) return "◇";
  if (name.includes("jog") || name.includes("track")) return "↗";
  if (name.includes("cycle") || name.includes("bike")) return "○";
  if (name.includes("mosque") || name.includes("prayer")) return "⌂";
  if (name.includes("retail") || name.includes("shop")) return "□";
  if (name.includes("school")) return "▤";
  if (name.includes("clinic") || name.includes("medical")) return "+";
  if (name.includes("tennis") || name.includes("court")) return "◎";

  return "✦";
};

export default function ProjectDetailPage() {
  const data = usePlatformData();
  const aliases = useProjectAliases();
  const enrichmentMap = useProjectEnrichment();
  const liveMap = useProjectLiveData();
  const unitPricing = useUnitPricing();
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
  const pricing = unitPricing[project["Project Name | اسم المشروع"]];

  const unitTypes = Array.from(
    new Set(
      [
        ...(pricing?.unitTypes || []).map((unit) => unit.type),
        ...(sourceDetail?.propertyTypes || []),
        ...(live?.propertyTypes || []),
      ].filter(Boolean),
    ),
  );

  const startingPrice =
    pricing?.startingPrice ??
    enrichment?.officialStartingPrice ??
    live?.startingPrice ??
    project["Starting Price AED | السعر المبدئي"];

  const handover =
    sourceDetail?.deliveryDate ||
    live?.deliveryDate ||
    project["Handover | التسليم"] ||
    "TBA";

  return (
    <main><Header />
      <PageSeo
        title={`${displayName} | Dubai Off-Plan Project`}
        description={`${displayName} by ${developer} in ${community}. Starting price, handover, payment plan and source-verified project data.`}
        structuredData={compact({
          "@context": "https://schema.org",
          "@type": "Residence",
          name: displayName,
          address: compact({
            "@type": "PostalAddress",
            addressLocality: community,
            addressRegion: "Dubai",
            addressCountry: "AE",
          }),
          // Only emitted when the record actually carries the value.
          url: enrichment?.officialSource || undefined,
          image: imageMedia[0]?.url,
          geo: coordinates
            ? { "@type": "GeoCoordinates", latitude: coordinates.lat, longitude: coordinates.lng }
            : undefined,
        })}
      />
      <section className="lux-project-hero">
        <ProjectVisual project={project} live={live} className="lux-project-cover" />

        <div className="lux-project-cover-shade" />

        <div className="lux-project-topline">
          <a href="/projects">PROJECTS</a>
          <span>—</span>
          <strong>{community}</strong>
        </div>

        <div className="lux-project-title">
          <span className="lux-project-kicker">DUBAI OFF-PLAN RESIDENCE</span>

          <h1>{displayName}</h1>

          <a
            href={`/developers/${slugify(developer)}`}
            className="lux-project-developer"
          >
            <small>BY</small>
            <strong>{developer}</strong>
          </a>

          <p>⌖ {community}, Dubai</p>
        </div>

        <div className="lux-project-glass-card">
          <div className="lux-glass-price">
            <small>STARTING FROM</small>
            <strong>{money(startingPrice)}</strong>
            <span>AED</span>
          </div>

          <div className="lux-glass-row">
            <span>
              <small>HANDOVER</small>
              <strong>{handover}</strong>
            </span>
            <i>▣</i>
          </div>

          <div className="lux-glass-row">
            <span>
              <small>UNIT TYPES</small>
              <strong>
                {unitTypes.slice(0, 3).join(" · ") ||
                  enrichment?.unitTypes ||
                  humanize(project["Unit Type | نوع الوحدة"])}
              </strong>
            </span>
            <i>▦</i>
          </div>

          <div className="lux-glass-row">
            <span>
              <small>PROJECT STATUS</small>
              <strong>{status}</strong>
            </span>
            <i>◇</i>
          </div>

          <a
            href={`https://wa.me/971582239619?text=${encodeURIComponent(
              `Hello Mahmoud, I am interested in ${displayName}. Please send me the verified project pack.`,
            )}`}
            target="_blank"
            rel="noreferrer"
            className="lux-hero-cta"
          >
            Request project details ↗
          </a>
        </div>

        <div className="lux-project-verified">
          {enrichment?.verified
            ? "✓ OFFICIAL SOURCE VERIFIED"
            : live
              ? "✓ PROJECT SOURCE MATCHED"
              : "PROJECT RECORD UNDER REVIEW"}
        </div>
      </section>
      <nav className="lux-project-nav" aria-label="Project page sections">
        <a href="#overview">Overview</a>
        <a href="#pricing">Residences</a>
        <a href="#payment">Payment plan</a>
        <a href="#amenities">Amenities</a>
        <a href="#gallery">Gallery</a>
        <a href="#layouts">Floor plans</a>
        <a href="#location">Location</a>
      </nav>

      <section className="detail-layout lux-detail-layout">
        <article>
          <section className="lux-key-facts">
            <div>
              <small>STARTING PRICE</small>
              <strong>{money(startingPrice)}</strong>
            </div>

            <div>
              <small>HANDOVER</small>
              <strong>{handover}</strong>
            </div>

            <div>
              <small>COMMUNITY</small>
              <strong>{community}</strong>
            </div>

            <div>
              <small>DEVELOPER</small>
              <strong>{developer}</strong>
            </div>
          </section>

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

          {unitTypes.length ? (
            <section className="lux-residence-selector">
              <div className="lux-section-heading">
                <span>02</span>
                <div>
                  <small>RESIDENCES</small>
                  <h2>Choose your residence</h2>
                </div>
              </div>

              <div className="lux-unit-tabs">
                {unitTypes.map((type, index) => (
                  <div className={index === 0 ? "active" : ""} key={type}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{type}</strong>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {pricing ? (
            <div className="content-block lux-pricing" id="pricing"><span>02</span><h2>Starting price by unit type</h2>
              <div className="unit-price-table">
                <div className="unit-price-head"><span>Unit type</span><span>Starting price</span><span>AED / sq ft</span></div>
                {pricing.unitTypes.map((unit) => (
                  <div className="unit-price-row" key={unit.type}>
                    <strong>{unit.type}</strong>
                    <b>{money(unit.startingPrice)}</b>
                    <span>{unit.avgPricePerSqFt ? `AED ${unit.avgPricePerSqFt.toLocaleString()}` : "Not currently available"}</span>
                  </div>
                ))}
              </div>
              <p className="source-note">
                {pricing.source} · {pricing.developer} · inventory dated {pricing.inventoryDate}
                {pricing.completionDate ? ` · completion ${pricing.completionDate}` : ""}. Prices are point-in-time and must be reconfirmed before reservation.
              </p>
            </div>
          ) : null}

          <div className="content-block" id="payment"><span>{pricing ? "03" : "02"}</span><h2>Payment plan</h2><div className="payment-plan">
            {detailedPlan?.length ? detailedPlan.map((phase, index) => (
              <div key={`${phase.label}-${index}`}><strong>{phase.value != null ? `${phase.value}%` : "—"}</strong><span>{phase.label || `Phase ${index + 1}`}</span></div>
            )) : <>
              <div><strong>{project["Booking % | الحجز"] != null ? `${project["Booking % | الحجز"] * 100}%` : "—"}</strong><span>Booking</span></div>
              <div><strong>{project["During Construction % | أثناء الإنشاء"] != null ? `${project["During Construction % | أثناء الإنشاء"] * 100}%` : "—"}</strong><span>Construction</span></div>
              <div><strong>{project["At Handover % | عند التسليم"] != null ? `${project["At Handover % | عند التسليم"] * 100}%` : "—"}</strong><span>Handover</span></div>
            </>}
          </div><p className="source-note">Payment milestones are shown from the most detailed matched project record available and must be reconfirmed before reservation.</p></div>

          <div className="content-block lux-amenities" id="amenities">
            <div className="lux-section-heading">
              <span>04</span>
              <div>
                <small>LIFESTYLE & WELLNESS</small>
                <h2>Everything within reach</h2>
              </div>
            </div>

            {amenities.length ? (
              <div className="lux-amenity-grid">
                {amenities.map((item) => (
                  <div className="lux-amenity" key={item}>
                    <i>{amenityIcon(item)}</i>
                    <strong>{item}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="gallery-placeholder">
                <strong>Amenities under review</strong>
                <p>The project's public amenity list has not been matched yet.</p>
              </div>
            )}
          </div>

          <div className="content-block" id="gallery"><span>04</span><h2>Full project gallery</h2>
            {imageMedia.length ? <div className="project-gallery">{imageMedia.map((item, index) => <a href={item.url} target="_blank" rel="noreferrer" key={`${item.url}-${index}`}><img src={item.preview || item.url} alt={`${displayName} media ${index + 1}`} loading="lazy" /><span>{item.type === "master-plan" ? "MASTER PLAN" : `IMAGE ${index + 1}`}</span></a>)}</div> : <div className="gallery-placeholder"><strong>Real project media pending</strong><p>No generic substitute is shown while the official or reference gallery is unavailable.</p></div>}
            {videoMedia.length ? <div className="project-videos">{videoMedia.map((item, index) => <video src={item.url} controls preload="metadata" key={`${item.url}-${index}`}>Project video</video>)}</div> : null}
          </div>

          <div className="content-block" id="layouts"><span>05</span><h2>Layouts &amp; floor plans</h2>
            {floorPlans.length ? <div className="floor-plan-grid">{floorPlans.map((layout, index) => <a href={layout.url} target="_blank" rel="noreferrer" key={`${layout.url}-${index}`}><img src={layout.url} alt={`${displayName} floor plan ${index + 1}`} loading="lazy" /><div><strong>{layout.layoutType}</strong><span>{layout.bedrooms === 0 ? "Studio" : layout.bedrooms != null ? `${layout.bedrooms} bedroom` : layout.propertyType}</span>{layout.area ? <small>{layout.area.toLocaleString()} sq ft</small> : null}</div></a>)}</div> : <div className="gallery-placeholder"><strong>Floor plans are being sourced</strong><p>Layouts appear here only when a project-level floor-plan file is available.</p></div>}
          </div>

          <div className="content-block lux-location" id="location">
            <div className="lux-section-heading">
              <span>07</span>
              <div>
                <small>LOCATION</small>
                <h2>Connected to Dubai</h2>
              </div>
            </div>

            {coordinates ? (
              <div className="lux-location-grid">
                <div className="lux-map">
                  <iframe
                    title={`${displayName} location`}
                    src={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=15&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <div className="lux-location-info">
                  <span>PROJECT LOCATION</span>
                  <h3>{community}</h3>
                  <p>Dubai, United Arab Emirates</p>

                  <dl>
                    <div>
                      <dt>LATITUDE</dt>
                      <dd>{coordinates.lat.toFixed(6)}</dd>
                    </div>
                    <div>
                      <dt>LONGITUDE</dt>
                      <dd>{coordinates.lng.toFixed(6)}</dd>
                    </div>
                  </dl>

                  <a
                    href={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Google Maps ↗
                  </a>
                </div>
              </div>
            ) : (
              <div className="gallery-placeholder">
                <strong>Plot coordinates pending</strong>
                <p>The project will not be pinned approximately at an area centre.</p>
              </div>
            )}
          </div>
        </article>

        <aside className="project-contact lux-contact-card">
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
