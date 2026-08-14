"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Footer,
  Header,
  ProjectVisual,
  usePlatformData,
  useProjectLiveData,
} from "../../components";
import { useLanguage } from "../../language-context";
import { CompareButton, ComparisonBar } from "../../comparison";
import { areaFrom, developerUrl, money, slugify, type Developer } from "../../data";

export default function DeveloperProfilePage() {
  const data = usePlatformData();
  const liveData = useProjectLiveData();
  const { arabic } = useLanguage();
  const [slug, setSlug] = useState("");

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
  const prices = projects
    .map((p) => liveData[p["Project Name | اسم المشروع"]]?.startingPrice || p["Starting Price AED | السعر المبدئي"])
    .filter((v): v is number => typeof v === "number" && v > 0);
  const avgPrice = prices.length ? Math.round(prices.reduce((s, v) => s + v, 0) / prices.length) : null;
  const logo = projects.map((p) => liveData[p["Project Name | اسم المشروع"]]?.developerLogo).find(Boolean) || null;
  const official = developerName ? developerUrl(developerName) : "";
  const isVerified = Boolean(developerRecord?.Tier && developerRecord.Tier !== "PROFILE UNDER REVIEW");

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
          <div><strong>{avgPrice ? money(avgPrice) : (arabic ? "غير متوفر حالياً" : "Not currently available")}</strong><span>{arabic ? "متوسط سعر البداية" : "average starting price"}</span></div>
        </div>

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

        <h2 style={{ fontSize: 20, margin: "40px 0 8px" }}>{arabic ? `مشاريع ${developerName}` : `Projects by ${developerName}`}</h2>
        <div className="project-grid platform-project-grid">
          {projects.map((project, index) => {
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
