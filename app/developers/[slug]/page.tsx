"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Footer,
  Header,
  ProjectVisual,
  SearchBox,
  usePlatformData,
  useDeveloperProfiles,
  useProjectLiveData,
} from "../../components";
import { useLanguage } from "../../language-context";
import { CompareButton, ComparisonBar } from "../../comparison";
import { areaFrom, developerUrl, money, slugify, type Developer } from "../../data";
import { PageSeo, compact } from "../../seo";

export default function DeveloperProfilePage() {
  const data = usePlatformData();
  const liveData = useProjectLiveData();
  const profiles = useDeveloperProfiles();
  const { arabic } = useLanguage();
  const [slug, setSlug] = useState("");
  const [projectQuery, setProjectQuery] = useState("");

  useEffect(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    setSlug(decodeURIComponent(parts[parts.length - 1] || ""));
  }, []);

  const developerName = useMemo(() => {
    if (!data || !slug) return null;
    const names = Array.from(new Set(data.projects.map((p) => p["Developer | المطور"]).filter((n): n is string => Boolean(n))));
    return names.find((name) => slugify(name) === slug) || null;
  }, [data, slug]);

  const developerRecord: Developer | null = useMemo(() => {
    if (!data || !developerName) return null;
    return data.developers.find((d) => d.Developer.trim().toLowerCase() === developerName.trim().toLowerCase()) || {
      Developer: developerName,
      Tier: null,
      "Overall /10": null,
      "Delivery /10": null,
      "Quality /10": null,
      "Safety /10": null,
    };
  }, [data, developerName]);

  const projects = useMemo(
    () => (data?.projects || []).filter((p) => p["Developer | المطور"] === developerName),
    [data, developerName],
  );
  const areas = useMemo(
    () => Array.from(new Set(projects.map((p) => areaFrom(p["Location / Community | المنطقة"])).filter(Boolean))),
    [projects],
  );
  // Search is scoped to this developer's own projects — name or community.
  const visibleProjects = useMemo(() => {
    const term = projectQuery.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((p) => {
      const name = p["Project Name | اسم المشروع"] || "";
      const location = p["Location / Community | المنطقة"] || "";
      return name.toLowerCase().includes(term) || location.toLowerCase().includes(term);
    });
  }, [projects, projectQuery]);
  const prices = projects
    .map((p) => liveData[p["Project Name | اسم المشروع"]]?.startingPrice || p["Starting Price AED | السعر المبدئي"])
    .filter((v): v is number => typeof v === "number" && v > 0);
  const priceMin = prices.length ? Math.min(...prices) : null;
  const priceMax = prices.length ? Math.max(...prices) : null;
  const logo = projects.map((p) => liveData[p["Project Name | اسم المشروع"]]?.developerLogo).find(Boolean) || null;
  const official = developerName ? developerUrl(developerName) : "";
  const isVerified = Boolean(developerRecord?.Tier && developerRecord.Tier !== "PROFILE UNDER REVIEW");
  const profile = developerName
    ? Object.entries(profiles).find(([name]) => name.trim().toLowerCase() === developerName.trim().toLowerCase())?.[1] || null
    : null;

  const currentYear = new Date().getFullYear();
  const upcomingCount = projects.filter((p) => {
    const handover = p["Handover | التسليم"];
    const year = handover?.match(/20\d{2}/)?.[0];
    return year ? Number(year) >= currentYear : false;
  }).length;

  if (data && !developerName) {
    return (
      <main>
        <Header />
        <section className="page-body" style={{ padding: "80px 0", textAlign: "center" }}>
          <h1>{arabic ? "المطور غير موجود" : "Developer not found"}</h1>
          <p style={{ color: "#777" }}>
            <a href="/developers" style={{ color: "var(--red)" }}>{arabic ? "← ارجع لدليل المطورين" : "← Back to developer directory"}</a>
          </p>
        </section>
        <Footer />
      </main>
    );
  }

  if (!developerName || !developerRecord) {
    return (
      <main>
        <Header />
        <section className="page-body" style={{ padding: "80px 0", textAlign: "center", color: "#777" }}>
          {arabic ? "جارٍ التحميل…" : "Loading…"}
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <Header />
      <PageSeo
        title={`${developerName} Projects in Dubai`}
        description={`${developerName}: ${projects.length} linked project records across ${areas.length} Dubai areas, with prices, handover dates and source references.`}
        structuredData={compact({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: developerName,
          url: official || undefined,
          logo: logo || undefined,
          areaServed: areas.length ? areas : undefined,
        })}
      />
      <section className="developer-profile-hero">
        <div className="developer-profile-logo">
          {logo ? <img src={logo} alt={`${developerName} logo`} /> : <b>{developerName.slice(0, 2).toUpperCase()}</b>}
        </div>
        <div className="developer-profile-head">
          <p>{arabic ? "ملف المطور" : "DEVELOPER PROFILE"}</p>
          <h1>{developerName}</h1>
          <span className={isVerified ? "verification-chip large verified" : "verification-chip large"}>
            {isVerified
              ? (arabic ? "ملف مُراجع ✓" : "REVIEWED PROFILE ✓")
              : (arabic ? "الملف قيد المراجعة" : "PROFILE UNDER REVIEW")}
          </span>
        </div>
        {official ? (
          <a className="button ghost developer-profile-official" href={official} target="_blank" rel="noreferrer">
            {arabic ? "الموقع الرسمي ↗" : "Official website ↗"}
          </a>
        ) : null}
      </section>

      <section className="page-body">
        <div className="developer-summary">
          <div><strong>{projects.length}</strong><span>{arabic ? "سجل مشروع مرتبط" : "linked project records"}</span></div>
          <div><strong>{upcomingCount}</strong><span>{arabic ? "مشروع بتسليم قادم" : "upcoming handovers"}</span></div>
          <div><strong>{areas.length}</strong><span>{arabic ? "منطقة نشط بها" : "areas present"}</span></div>
          <div><strong>{priceMin ? `${money(priceMin)} – ${money(priceMax)}` : (arabic ? "غير متوفر حالياً" : "Not currently available")}</strong><span>{arabic ? "نطاق سعر البداية" : "starting price range"}</span></div>
        </div>

        {profile ? (
          <div className="developer-narrative">
            <div className="developer-narrative-block">
              <h3>{arabic ? "مين المطور" : "Who is the developer"}</h3>
              <p>{arabic ? profile.overview.ar : profile.overview.en}</p>
            </div>
            <div className="developer-narrative-block">
              <h3>{arabic ? "دخوله السوق" : "Market entry"}</h3>
              <p>{arabic ? profile.marketEntry.ar : profile.marketEntry.en}</p>
            </div>
            <div className="developer-narrative-block">
              <h3>{arabic ? "سابقة أعماله" : "Track record"}</h3>
              <p>{arabic ? profile.trackRecord.ar : profile.trackRecord.en}</p>
            </div>
            <div className="developer-narrative-block">
              <h3>{arabic ? "سمعته" : "Reputation"}</h3>
              <p>{arabic ? profile.reputation.ar : profile.reputation.en}</p>
            </div>
            <div className="developer-narrative-block">
              <h3>{arabic ? "أسعار إعادة البيع" : "Resale prices"}</h3>
              <p>{arabic ? profile.resale.ar : profile.resale.en}</p>
            </div>
            <div className="developer-narrative-block">
              <h3>{arabic ? "الشراكات" : "Partnerships"}</h3>
              <p>{arabic ? profile.partnerships.ar : profile.partnerships.en}</p>
            </div>
            <div className="developer-narrative-block">
              <h3>{arabic ? "الشهادات والتكريمات" : "Certifications & recognition"}</h3>
              <p>{arabic ? profile.certifications.ar : profile.certifications.en}</p>
            </div>
            {profile.sources?.length ? (
              <p className="developer-narrative-sources">{arabic ? "المصادر: " : "Sources: "}{profile.sources.join(" · ")}</p>
            ) : null}
          </div>
        ) : (
          <p className="input-hint" style={{ margin: "0 0 32px" }}>
            {arabic ? "ملف تحريري كامل لهذا المطور قيد الإعداد وهيتضاف قريباً." : "A full editorial profile for this developer is being researched and will be added soon."}
          </p>
        )}

        {developerRecord["Overall /10"] != null ? (
          <div className="developer-scores developer-profile-scores">
            {([["Delivery", "التسليم", developerRecord["Delivery /10"]], ["Quality", "الجودة", developerRecord["Quality /10"]], ["Safety", "السلامة", developerRecord["Safety /10"]]] as const).map(([label, labelAr, value]) => (
              <div key={label}><span>{arabic ? labelAr : label}</span><i><b style={{ width: `${(value || 0) * 10}%` }} /></i><strong>{value?.toFixed(1) || "—"}</strong></div>
            ))}
          </div>
        ) : (
          <p className="input-hint" style={{ margin: "0 0 32px" }}>
            {arabic ? "لسه معملناش تقييم داخلي لسجل التسليم لهذا المطور." : "No internal track-record review has been completed for this developer yet."}
          </p>
        )}

        <h2 style={{ fontSize: 20, margin: "40px 0 12px" }}>
          {arabic ? `مشاريع ${developerName}` : `Projects by ${developerName}`}
          <small className="developer-project-count">{visibleProjects.length} / {projects.length}</small>
        </h2>
        <SearchBox
          value={projectQuery}
          onChange={setProjectQuery}
          placeholder={arabic ? "ابحث في مشاريع هذا المطور" : "Search this developer's projects"}
        />
        {!visibleProjects.length ? (
          <p className="input-hint" style={{ margin: "18px 0 0" }}>
            {arabic ? "مفيش مشروع مطابق لبحثك." : "No project matches your search."}
          </p>
        ) : null}
        <div className="project-grid platform-project-grid">
          {visibleProjects.map((project, index) => {
            const live = liveData[project["Project Name | اسم المشروع"]];
            return (
              <a className="project-card" href={`/projects/detail?name=${encodeURIComponent(project["Project Name | اسم المشروع"])}`} key={`${project["Project Name | اسم المشروع"]}-${index}`}>
                <div className="card-art">
                  <ProjectVisual project={project} live={live} />
                  <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="card-body">
                  <p>{areaFrom(live?.location || project["Location / Community | المنطقة"])}</p>
                  <h3>{live?.title || project["Project Name | اسم المشروع"]}</h3>
                  <dl>
                    <div><dt>{arabic ? "من" : "FROM"}</dt><dd>{money(live?.startingPrice || project["Starting Price AED | السعر المبدئي"])}</dd></div>
                    <div><dt>{arabic ? "التسليم" : "HANDOVER"}</dt><dd>{project["Handover | التسليم"] || (arabic ? "لم يُحدد بعد" : "TBA")}</dd></div>
                  </dl>
                  <span className="card-link">{arabic ? "عرض المشروع ↗" : "View project ↗"}</span>
                  <CompareButton name={project["Project Name | اسم المشروع"]} />
                </div>
              </a>
            );
          })}
        </div>

        {areas.length ? (
          <>
            <h2 style={{ fontSize: 20, margin: "40px 0 8px" }}>{arabic ? "المناطق النشط بها المطور" : "Areas with an active presence"}</h2>
            <div className="developer-area-chips">
              {areas.map((area) => (
                <a key={area} href={`/projects?area=${encodeURIComponent(area)}&developer=${encodeURIComponent(developerName)}`}>{area}</a>
              ))}
            </div>
          </>
        ) : null}

        <div className="data-notice" style={{ marginTop: 40 }}>
          <span>{arabic ? "البيانات والمصادر" : "DATA & SOURCES"}</span>
          <p>
            {arabic
              ? "المشاريع بتترابط بالمطور عن طريق مطابقة اسم المطور في دليل المشاريع. درجات السجل (التسليم/الجودة/السلامة) بتظهر بس لما تتراجع داخلياً. السعر والتسليم بيتحدثوا من أحدث مصدر متاح لكل مشروع على حدة."
              : "Projects are linked to this developer by name-matching against the project catalogue. Track-record scores (delivery/quality/safety) are shown only once internally reviewed. Prices and handover dates update from each project's latest available source."}
          </p>
        </div>

        <div className="developer-claim-cta">
          <div>
            <h3>{arabic ? "هل تمثل هذا المطور؟" : "Represent this developer?"}</h3>
            <p>{arabic ? "راجع بيانات الشركة ووثّق الملف." : "Review and verify this profile."}</p>
          </div>
          <a
            className="button primary"
            href={`https://wa.me/971582239619?text=${encodeURIComponent(
              arabic
                ? `مرحباً محمود، أنا ممثل عن ${developerName} وحابب أراجع وأوثّق ملف الشركة على مشهور العقارية.`
                : `Hi Mahmoud, I represent ${developerName} and would like to review and verify our developer profile on Mashhour Real Estate.`,
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            {arabic ? "وثّق ملف المطور ↗" : "Verify Developer Profile ↗"}
          </a>
        </div>
      </section>
      <Footer />
      <ComparisonBar />
    </main>
  );
}
