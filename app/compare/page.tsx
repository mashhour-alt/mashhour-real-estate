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
import { useLanguage } from "../language-context";
import { MAX_COMPARISON, useComparison } from "../comparison";
import { areaFrom, isDldLinked, money, type Project } from "../data";

const MAX_PROJECTS = MAX_COMPARISON;

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
  const { arabic } = useLanguage();
  const { names: selectedNames, add, remove: removeFromShortlist } = useComparison();
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    // A project can be sent here directly from a project page via ?project=…
    const requested = new URLSearchParams(window.location.search).get("project");
    if (requested) add(requested);
  }, [add]);

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
    add(name);
    setQuery("");
    if (selectedNames.length + 1 >= MAX_PROJECTS) setPickerOpen(false);
  };
  const removeProject = (name: string) => removeFromShortlist(name);

  const notAvailable = arabic ? "غير متوفر حالياً" : "Not currently available";

  // Only computed when both a starting price and a smallest published unit area
  // exist for the same record — never estimated from area averages.
  const pricePerSqFt = (project: Project) => {
    const price = priceFor(project);
    const units = liveData[projectName(project)]?.unitOptions || [];
    const areas = units.map((unit) => unit.areaFrom).filter((value): value is number => typeof value === "number" && value > 0);
    if (typeof price !== "number" || price <= 0 || !areas.length) return null;
    return Math.round(price / Math.min(...areas));
  };

  const paymentText = (project: Project) => {
    const live = liveData[projectName(project)];
    if (live?.paymentPlans?.length) return live.paymentPlans.slice(0, 2).join(" • ");
    const booking = project["Booking % | الحجز"];
    const construction = project["During Construction % | أثناء الإنشاء"];
    const handover = project["At Handover % | عند التسليم"];
    if (arabic) {
      return [booking != null ? `${booking}% حجز` : "", construction != null ? `${construction}% أثناء الإنشاء` : "", handover != null ? `${handover}% عند التسليم` : ""].filter(Boolean).join(" • ") || "قيد التحقق";
    }
    return [booking != null ? `${booking}% booking` : "", construction != null ? `${construction}% construction` : "", handover != null ? `${handover}% handover` : ""].filter(Boolean).join(" • ") || "Under verification";
  };

  return (
    <main>
      <Header />
      <PageIntro
        eyebrow={arabic ? "مساحة اتخاذ القرار" : "DECISION WORKSPACE"}
        title={arabic ? "قارن المشاريع. اختار بثقة." : "Compare projects. Choose with confidence."}
        intro={arabic ? "حط لحد أربع مشاريع دبي جنب بعض. أقوى قيمة متاحة في كل صف بتتحدد تلقائي." : "Put up to four Dubai projects side by side. The strongest available value in each decision-critical row is highlighted automatically."}
        action={<strong className="page-count">{projects.length} / {MAX_PROJECTS} {arabic ? "مختار" : "SELECTED"}</strong>}
      />

      <section className="compare-workspace">
        <div className="compare-toolbar">
          <div>
            <span>{arabic ? "قايمتك المختارة" : "YOUR SHORTLIST"}</span>
            <strong>{projects.length ? (arabic ? `${projects.length} مشروع جاهز للمقارنة` : `${projects.length} projects ready to compare`) : (arabic ? "ابدأ باختيار مشروعين" : "Start by choosing two projects")}</strong>
          </div>
          <button className="compare-add" disabled={projects.length >= MAX_PROJECTS} onClick={() => setPickerOpen((value) => !value)}>
            {pickerOpen ? (arabic ? "إغلاق ×" : "Close selector ×") : (arabic ? "＋ إضافة مشروع" : "＋ Add project")}
          </button>
        </div>

        {pickerOpen && projects.length < MAX_PROJECTS ? (
          <div className="compare-picker">
            <SearchBox value={query} onChange={setQuery} placeholder={arabic ? "ابحث بالمشروع أو المطور أو المنطقة" : "Search by project, developer or area"} />
            <div className="compare-picker-results">
              {choices.map((project) => (
                <button key={projectName(project)} onClick={() => addProject(projectName(project))}>
                  <span><strong>{projectName(project)}</strong><small>{project["Developer | المطور"] || (arabic ? "مطور قيد المراجعة" : "Developer under review")} · {areaFrom(project["Location / Community | المنطقة"])}</small></span>
                  <b>＋</b>
                </button>
              ))}
              {!choices.length && <p>{arabic ? "لا توجد مشاريع مطابقة." : "No matching projects found."}</p>}
            </div>
          </div>
        ) : null}

        {!projects.length ? (
          <section className="empty-workspace compare-empty">
            <span>＋</span>
            <h2>{arabic ? "مقارنتك تبدأ من هنا." : "Your comparison starts here."}</h2>
            <p>{arabic ? "اختار مشاريع من الدليل الكامل أو ضيف واحد باستخدام أداة الاختيار فوق." : "Choose projects from the full directory or add one using the selector above."}</p>
            <button className="button primary" onClick={() => setPickerOpen(true)}>{arabic ? "اختار مشاريع" : "Choose projects"} <b>↗</b></button>
          </section>
        ) : (
          <div className="comparison-scroll" aria-label="Project comparison">
            <div className="comparison-grid" style={{ "--compare-columns": projects.length } as React.CSSProperties}>
              <div className="comparison-label comparison-label-head"><span>{arabic ? "المشاريع" : "PROJECTS"}</span><small>{arabic ? "اسحب أفقياً على الموبايل" : "Swipe horizontally on mobile"}</small></div>
              {projects.map((project) => {
                const live = liveData[projectName(project)];
                return (
                  <article className="comparison-project" key={projectName(project)}>
                    <button className="comparison-remove" aria-label={`Remove ${projectName(project)}`} onClick={() => removeProject(projectName(project))}>×</button>
                    <ProjectVisual project={project} live={live} />
                    <div><small>{areaFrom(live?.location || project["Location / Community | المنطقة"])}</small><h2>{live?.title || projectName(project)}</h2><span>{live?.developer || project["Developer | المطور"] || (arabic ? "قيد المراجعة" : "Under review")}</span></div>
                  </article>
                );
              })}

              <ComparisonRow label={arabic ? "السعر المبدئي" : "Starting price"} hint={arabic ? "أقل سعر متاح" : "Lowest available price"}>
                {projects.map((project) => <Metric key={projectName(project)} best={bestPrice != null && priceFor(project) === bestPrice} value={money(priceFor(project))} />)}
              </ComparisonRow>
              <ComparisonRow label={arabic ? "سعر القدم²" : "AED / sq ft"} hint={arabic ? "السعر ÷ أصغر مساحة منشورة" : "Price ÷ smallest published unit"}>
                {projects.map((project) => {
                  const value = pricePerSqFt(project);
                  return <Metric key={projectName(project)} value={value ? `AED ${value.toLocaleString()}` : notAvailable} />;
                })}
              </ComparisonRow>
              <ComparisonRow label={arabic ? "الموقع" : "Location"} hint={arabic ? "المنطقة" : "Community"}>
                {projects.map((project) => <Metric key={projectName(project)} value={enrichment[projectName(project)]?.community || areaFrom(liveData[projectName(project)]?.location || project["Location / Community | المنطقة"])} />)}
              </ComparisonRow>
              <ComparisonRow label={arabic ? "المطور" : "Developer"} hint={arabic ? "مالك المشروع" : "Project owner"}>
                {projects.map((project) => <Metric key={projectName(project)} value={liveData[projectName(project)]?.developer || project["Developer | المطور"] || (arabic ? "قيد المراجعة" : "Under review")} />)}
              </ComparisonRow>
              <ComparisonRow label={arabic ? "التسليم" : "Handover"} hint={arabic ? "أقرب تاريخ محدد" : "Earliest date highlighted"}>
                {projects.map((project) => <Metric key={projectName(project)} best={numericHandover(project["Handover | التسليم"]) === bestHandover && Number.isFinite(bestHandover)} value={project["Handover | التسليم"] || liveData[projectName(project)]?.deliveryDate || (arabic ? "لم يُحدد بعد" : "TBA")} />)}
              </ComparisonRow>
              <ComparisonRow label={arabic ? "خطة الدفع" : "Payment plan"} hint={arabic ? "الهيكل المعلن" : "Published structure"}>
                {projects.map((project) => <Metric key={projectName(project)} value={paymentText(project)} compact />)}
              </ComparisonRow>
              <ComparisonRow label={arabic ? "أنواع الوحدات" : "Unit types"} hint={arabic ? "المزيج المتاح" : "Available mix"}>
                {projects.map((project) => {
                  const live = liveData[projectName(project)];
                  const value = live?.bedrooms?.length ? live.bedrooms.join(", ") : live?.propertyTypes?.join(", ") || project["Unit Type | نوع الوحدة"] || (arabic ? "قيد التحقق" : "Under verification");
                  return <Metric key={projectName(project)} value={value} compact />;
                })}
              </ComparisonRow>
              <ComparisonRow label={arabic ? "المرافق" : "Amenities"} hint={arabic ? "أكمل قائمة" : "Most complete list"}>
                {projects.map((project, index) => {
                  const amenities = liveData[projectName(project)]?.amenities || enrichment[projectName(project)]?.amenities || [];
                  return <Metric key={projectName(project)} best={bestAmenities > 0 && amenityCounts[index] === bestAmenities} value={amenities.length ? (arabic ? `${amenities.length} مرفق موثّق` : `${amenities.length} verified amenities`) : (arabic ? "قيد التحقق" : "Under verification")} />;
                })}
              </ComparisonRow>
              <ComparisonRow label={arabic ? "سجل DLD" : "DLD record"} hint={arabic ? "رابط مصدر رسمي" : "Official source link"}>
                {projects.map((project) => (
                  <Metric
                    key={projectName(project)}
                    value={isDldLinked(project) ? (arabic ? "مرتبط بـ DLD ✓" : "DLD linked ✓") : (arabic ? "المطابقة قيد الانتظار" : "Match pending")}
                  />
                ))}
              </ComparisonRow>
              <ComparisonRow label={arabic ? "حساب الضمان" : "Escrow"} hint={arabic ? "حالة حساب ضمان المشروع" : "Project escrow status"}>
                {projects.map((project) => {
                  const verified = project["Escrow Account Status | حالة حساب الضمان"] === "Verified Yes";
                  return (
                    <Metric
                      key={projectName(project)}
                      value={verified ? (arabic ? "موثّق ✓" : "Verified ✓") : (arabic ? "التحقق قيد الانتظار" : "Verification pending")}
                    />
                  );
                })}
              </ComparisonRow>
              <ComparisonRow label={arabic ? "المصدر" : "Source"} hint={arabic ? "مصدر السجل الحالي" : "Origin of this record"}>
                {projects.map((project) => {
                  const name = projectName(project);
                  const value = enrichment[name]?.verified
                    ? (arabic ? "مادة المطور الرسمية" : "Official developer material")
                    : isDldLinked(project)
                      ? (arabic ? "دائرة الأراضي والأملاك" : "Dubai Land Department")
                      : liveData[name]?.sourceProvider || notAvailable;
                  return <Metric key={name} value={value} compact />;
                })}
              </ComparisonRow>
              <ComparisonRow label={arabic ? "آخر تحديث" : "Last updated"} hint={arabic ? "تاريخ آخر تحديث للسجل" : "Date this record last refreshed"}>
                {projects.map((project) => {
                  const name = projectName(project);
                  return <Metric key={name} value={liveData[name]?.sourceUpdatedAt || enrichment[name]?.verifiedAt || notAvailable} compact />;
                })}
              </ComparisonRow>
              <ComparisonRow label={arabic ? "استكشاف" : "Explore"} hint={arabic ? "السجل الكامل للمشروع" : "Full project record"}>
                {projects.map((project) => <a className="comparison-open" key={projectName(project)} href={`/projects/detail?name=${encodeURIComponent(projectName(project))}`}>{arabic ? "عرض المشروع كامل" : "View full project"} <b>↗</b></a>)}
              </ComparisonRow>
            </div>
          </div>
        )}
        <p className="compare-footnote">{arabic ? "علامات أفضل قيمة بتستخدم البيانات الموثّقة المتاحة حالياً. الأسعار والتوفر ممكن يتغيروا وينصح بالتأكد منهم قبل الحجز." : "Best-value markers use the verified data currently available. Pricing and availability can change and should be reconfirmed before reservation."}</p>
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
  const { arabic } = useLanguage();
  return <div className={`comparison-metric${best ? " best" : ""}${compact ? " compact" : ""}`}>{best && <span>{arabic ? "أفضل قيمة" : "BEST VALUE"}</span>}<strong>{value}</strong></div>;
}
