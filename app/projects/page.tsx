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
import { useLanguage } from "../language-context";
import { CompareButton, ComparisonBar } from "../comparison";
import { SponsoredLabel, useSponsorship } from "../sponsorship";
import { areaFrom, constructionProgressFromRecord, isDldLinked, money } from "../data";

export default function ProjectsPage() {
  const data = usePlatformData();
  const enrichment = useProjectEnrichment();
  const liveData = useProjectLiveData();
  const dldReport = useDldReconciliationReport();
  const sponsorship = useSponsorship();
  const { arabic } = useLanguage();
  const [query, setQuery] = useState("");
  const [area, setArea] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("area") || "");
  const [developer, setDeveloper] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("developer") || "");
  const [unitType, setUnitType] = useState("");
  const [handover, setHandover] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sourceStatus, setSourceStatus] = useState("");
  const [sort, setSort] = useState("recommended");
  const [advancedOpen, setAdvancedOpen] = useState(true);
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
      <section className="projects-premium-hero">
        <div className="projects-premium-overlay" />

        <div className="projects-premium-copy">
          <span className="projects-premium-eyebrow">
            {arabic ? "مجموعة مختارة بعناية" : "CURATED DUBAI PROJECTS"}
          </span>

          <h1>
            {arabic
              ? "اكتشف أفضل المشاريع في دبي"
              : "Discover Dubai's leading projects"}
          </h1>

          <p>
            {arabic
              ? "تصفح المشاريع المتاحة للبيع مع الأسعار، المناطق، المطورين، خطط الدفع ومواعيد التسليم في مكان واحد."
              : "Explore available projects with pricing, communities, developers, payment plans and handover dates in one place."}
          </p>

          <div className="projects-premium-stats">
            <div>
              <i>▦</i>
              <strong>{totalCount.toLocaleString()}+</strong>
              <span>{arabic ? "مشروع مفهرس" : "Indexed projects"}</span>
            </div>

            <div>
              <i>⌖</i>
              <strong>{areas.length}+</strong>
              <span>{arabic ? "منطقة في دبي" : "Dubai areas"}</span>
            </div>

            <div>
              <i>◉</i>
              <strong>{developers.length}+</strong>
              <span>{arabic ? "مطور" : "Developers"}</span>
            </div>

            <div>
              <i>✓</i>
              <strong>{coverage.complete.toLocaleString()}</strong>
              <span>{arabic ? "حزمة بيانات كاملة" : "Complete packs"}</span>
            </div>
          </div>
        </div>

        <div className="projects-premium-sidecard">
          <span>01</span>

          <strong>
            {arabic ? "بيانات تتحدث باستمرار" : "Continuously updated data"}
          </strong>

          <p>
            {arabic
              ? "المشاريع بتتراجع مقابل مصادر المطورين وسجلات DLD والبيانات المتاحة."
              : "Projects are reviewed against developer sources, DLD records and available market data."}
          </p>

          <div>
            <b>{projects.length.toLocaleString()}</b>
            <small>{arabic ? "نتيجة متاحة الآن" : "results available now"}</small>
          </div>
        </div>
      </section>
      <section className="page-body">
        <div className="audit-progress projects-technical-audit">
          <div className="audit-heading"><span>{arabic ? "تدقيق مطابقة دائرة الأراضي" : "DLD RECONCILIATION AUDIT"}</span><strong>{totalCount.toLocaleString()} {arabic ? "سجل مشروع فريد مفهرس حالياً" : "unique project records currently indexed"}</strong></div>
          <div className="audit-stats">
            <div><strong>{dldLinkedCount.toLocaleString()}</strong><span>{arabic ? "سجل يحمل رابط مصدر رسمي من DLD" : "records carrying an official DLD source link"}</span></div>
            <div><strong>{dldEscrowVerifiedCount.toLocaleString()}</strong><span>{arabic ? "سجلات مرتبطة بـ DLD وحساب ضمان موثّق" : "DLD-linked records with verified escrow"}</span></div>
            <div><strong>{dldProgressCount.toLocaleString()}</strong><span>{arabic ? "سجلات مرتبطة بـ DLD مع نسبة إنجاز واضحة" : "DLD-linked records with explicit progress"}</span></div>
            <div><strong>{dldPendingCount.toLocaleString()}</strong><span>{arabic ? "أسماء تسويقية قيد مطابقة الاسم القانوني" : "marketing names awaiting legal-name reconciliation"}</span></div>
            <div><strong>{dldReport?.recordsMerged || 0}</strong><span>{arabic ? "مطابقة اسم قانوني اكتملت في هذا التدقيق" : "legal-name matches completed in this audit"}</span></div>
          </div>
          <div className="coverage-bar"><i style={{ width: totalCount ? `${(dldLinkedCount / totalCount) * 100}%` : "0%" }} /></div>
          <p>{arabic ? "بس السجلات اللي بتحمل مصدر DLD الرسمي بتتحسب كمرتبطة بـ DLD. التسليم ونسبة الإنجاز وحالة الضمان بتفضل واضحة كـ'قيد الانتظار' لما المصدر ميقدمش قيمة مؤكدة." : "Only records carrying the official DLD open-data source are counted as DLD-linked. Handover, progress and escrow remain visibly pending whenever the source record does not provide a confirmed value."}</p>
        </div>
        <div className="data-coverage-panel projects-technical-audit">
          <div className="audit-heading"><span>{arabic ? "اكتمال حزمة المشروع" : "PROJECT PACK COMPLETENESS"}</span><strong>{coverage.complete.toLocaleString()} {arabic ? "مشروع بيحمل الآن كل الحقول الستة الأساسية" : "projects now carry all six core sales fields"}</strong></div>
          <div className="coverage-stat-grid">
            <div><strong>{coverage.source.toLocaleString()}</strong><span>{arabic ? "سجلات مطابقة لمصدر" : "source-matched records"}</span></div>
            <div><strong>{coverage.price.toLocaleString()}</strong><span>{arabic ? "أسعار مبدئية" : "starting prices"}</span></div>
            <div><strong>{coverage.units.toLocaleString()}</strong><span>{arabic ? "سجلات أنواع الوحدات" : "unit-type records"}</span></div>
            <div><strong>{coverage.payment.toLocaleString()}</strong><span>{arabic ? "خطط دفع" : "payment plans"}</span></div>
            <div><strong>{coverage.media.toLocaleString()}</strong><span>{arabic ? "معارض صور حقيقية" : "real project galleries"}</span></div>
            <div><strong>{coverage.brochure.toLocaleString()}</strong><span>{arabic ? "بروشورات قابلة للتحميل" : "downloadable brochures"}</span></div>
          </div>
          <p>{arabic ? "الحزمة الكاملة بتحتوي على سعر، تسليم، أنواع وحدات، هيكل دفع، صور حقيقية للمشروع وبروشور. البيانات الناقصة بتفضل موضّحة كـ'قيد الانتظار' وماتتملّش تلقائياً أبداً." : "A complete pack has a price, handover, unit types, payment structure, real project media and a brochure. Missing information stays marked as pending and is never auto-filled."}</p>
        </div>
        <div className="projects-premium-layout">

          <aside className="projects-filter-sidebar">
            <div className="projects-filter-heading">
              <div>
                <span>⌘</span>
                <div>
                  <small>{arabic ? "فلترة متقدمة" : "ADVANCED SEARCH"}</small>
                  <h2>{arabic ? "تصفية النتائج" : "Filter results"}</h2>
                </div>
              </div>

              {activeFilterCount > 0 ? (
                <button onClick={resetFilters}>
                  {arabic ? "إعادة الضبط" : "Reset"}
                </button>
              ) : null}
            </div>

            <div className="smart-filter-shell">
          <div className="smart-filter-primary">
            <SearchBox value={query} onChange={updateFilter(setQuery)} placeholder={arabic ? "ابحث بالمشروع أو المطور أو المنطقة" : "Search project, developer or area"} />
            <select aria-label="Area" value={area} onChange={(event) => updateFilter(setArea)(event.target.value)}><option value="">{arabic ? "كل المناطق" : "All areas"}</option>{areas.map((item) => <option key={item}>{item}</option>)}</select>
            <select aria-label="Developer" value={developer} onChange={(event) => updateFilter(setDeveloper)(event.target.value)}><option value="">{arabic ? "كل المطورين" : "All developers"}</option>{developers.map((item) => <option key={item}>{item}</option>)}</select>
            <button className={advancedOpen ? "advanced-toggle active" : "advanced-toggle"} onClick={() => setAdvancedOpen((value) => !value)}>{arabic ? "فلاتر أكثر" : "More filters"} {advancedFilterCount > 0 && <b>{advancedFilterCount}</b>} <span>{advancedOpen ? "−" : "+"}</span></button>
          </div>
          {advancedOpen && <div className="smart-filter-advanced">
            <label><span>{arabic ? "نوع الوحدة" : "UNIT TYPE"}</span><select value={unitType} onChange={(event) => updateFilter(setUnitType)(event.target.value)}><option value="">{arabic ? "أي وحدة" : "Any unit"}</option>{unitTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>{arabic ? "التسليم" : "HANDOVER"}</span><select value={handover} onChange={(event) => updateFilter(setHandover)(event.target.value)}><option value="">{arabic ? "أي تاريخ" : "Any date"}</option>{["2026", "2027", "2028", "2029", "2030"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>{arabic ? "أقصى سعر" : "MAXIMUM PRICE"}</span><select value={maxPrice} onChange={(event) => updateFilter(setMaxPrice)(event.target.value)}><option value="">{arabic ? "أي ميزانية" : "Any budget"}</option><option value="750000">{arabic ? "لغاية 750 ألف درهم" : "Up to AED 750K"}</option><option value="1000000">{arabic ? "لغاية مليون درهم" : "Up to AED 1M"}</option><option value="1500000">{arabic ? "لغاية 1.5 مليون درهم" : "Up to AED 1.5M"}</option><option value="2000000">{arabic ? "لغاية 2 مليون درهم" : "Up to AED 2M"}</option><option value="3000000">{arabic ? "لغاية 3 مليون درهم" : "Up to AED 3M"}</option><option value="5000000">{arabic ? "لغاية 5 مليون درهم" : "Up to AED 5M"}</option></select></label>
            <label><span>{arabic ? "مستوى الثقة بالبيانات" : "DATA CONFIDENCE"}</span><select value={sourceStatus} onChange={(event) => updateFilter(setSourceStatus)(event.target.value)}><option value="">{arabic ? "كل السجلات" : "All records"}</option><option value="matched">{arabic ? "مطابق لمصدر" : "Source matched"}</option><option value="complete">{arabic ? "حزمة مشروع كاملة" : "Complete project pack"}</option><option value="verified">{arabic ? "موثّق رسمياً" : "Officially verified"}</option></select></label>
          </div>}
          <div className="smart-filter-footer">
            <strong><span>{projects.length.toLocaleString()}</span> {arabic ? "مشروع مطابق" : "matching projects"}</strong>
            <div><select aria-label="Sort projects" value={sort} onChange={(event) => updateFilter(setSort)(event.target.value)}><option value="recommended">{arabic ? "الترتيب الموصى به" : "Recommended order"}</option><option value="price-low">{arabic ? "السعر: من الأقل" : "Price: low to high"}</option><option value="price-high">{arabic ? "السعر: من الأعلى" : "Price: high to low"}</option><option value="name">{arabic ? "اسم المشروع أ–ي" : "Project name A–Z"}</option></select>{activeFilterCount > 0 && <button onClick={resetFilters}>{arabic ? "مسح الكل ×" : "Clear all ×"}</button>}</div>
          </div>
        </div>
          </aside>

          <section className="projects-results-column">
            <div className="projects-results-heading">
              <div>
                <small>{arabic ? "المشاريع المتاحة" : "AVAILABLE PROJECTS"}</small>
                <h2>
                  {arabic
                    ? `${projects.length.toLocaleString()} مشروع مطابق`
                    : `${projects.length.toLocaleString()} matching projects`}
                </h2>
              </div>

              <div className="projects-view-tools">
                <span>{arabic ? "عرض شبكي" : "Grid view"}</span>
                <b>▦</b>
              </div>
            </div>

        {!projects.length && <div className="project-filter-empty"><span>0</span><h2>{arabic ? "لا توجد نتيجة مطابقة." : "No exact match."}</h2><p>{arabic ? "جرّب توسيع الميزانية أو تاريخ التسليم أو المنطقة." : "Try widening the budget, handover date or area."}</p><button onClick={resetFilters}>{arabic ? "إعادة ضبط الفلاتر" : "Reset filters"}</button></div>}
        <div className="project-grid platform-project-grid">
          {projects.slice(0, visible).map((project, index) => (
            <a className="project-card" href={`/projects/detail?name=${encodeURIComponent(project["Project Name | اسم المشروع"])}`} key={`${project["Project Name | اسم المشروع"]}-${index}`}>
              <div className="card-art">
                <ProjectVisual project={project} live={liveData[project["Project Name | اسم المشروع"]]} />
                <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
                <span className={enrichment[project["Project Name | اسم المشروع"]]?.verified ? "verification-chip verified" : project["Data Status | حالة البيانات"]?.includes("legal match pending") ? "verification-chip" : liveData[project["Project Name | اسم المشروع"]] ? "verification-chip reference-matched" : "verification-chip"}>
                  {enrichment[project["Project Name | اسم المشروع"]]?.verified ? (arabic ? "مطور رسمي ✓" : "OFFICIAL DEVELOPER ✓") : project["Data Status | حالة البيانات"]?.includes("legal match pending") ? (arabic ? "مطابقة DLD قيد الانتظار" : "DLD MATCH PENDING") : liveData[project["Project Name | اسم المشروع"]] ? (arabic ? "مصدر مطابق ✓" : "SOURCE MATCHED ✓") : (arabic ? "المصدر قيد الانتظار" : "SOURCE PENDING")}
                </span>
                <strong className="developer-badge">{liveData[project["Project Name | اسم المشروع"]]?.developer || project["Developer | المطور"] || (arabic ? "مطور قيد المراجعة" : "Developer under review")}</strong>
                {sponsorship.featuredProjects.includes(project["Project Name | اسم المشروع"]) ? <SponsoredLabel /> : null}
              </div>
              <div className="card-body"><p>{enrichment[project["Project Name | اسم المشروع"]]?.community || areaFrom(liveData[project["Project Name | اسم المشروع"]]?.location || project["Location / Community | المنطقة"])}</p><h3>{enrichment[project["Project Name | اسم المشروع"]]?.officialName || liveData[project["Project Name | اسم المشروع"]]?.title || project["Project Name | اسم المشروع"]}</h3><div className="developer-name"><small>{arabic ? "المطور" : "DEVELOPER"}</small><strong>{liveData[project["Project Name | اسم المشروع"]]?.developer || project["Developer | المطور"] || (arabic ? "قيد المراجعة" : "Under review")}</strong></div><dl><div><dt>{arabic ? "من" : "FROM"}</dt><dd>{money(enrichment[project["Project Name | اسم المشروع"]]?.officialStartingPrice || liveData[project["Project Name | اسم المشروع"]]?.startingPrice || project["Starting Price AED | السعر المبدئي"])}</dd></div><div><dt>{arabic ? "التسليم" : "HANDOVER"}</dt><dd>{project["Handover | التسليم"] || (arabic ? "لم يُحدد بعد" : "TBA")}</dd></div></dl><div className={projectCoverage(project).complete ? "pack-status complete" : "pack-status"}><span>{projectCoverage(project).complete ? (arabic ? "حزمة مشروع كاملة" : "COMPLETE PROJECT PACK") : (arabic ? `${projectCoverage(project).completed}/6 حقول أساسية` : `${projectCoverage(project).completed}/6 CORE FIELDS`)}</span><i><b style={{ width: `${(projectCoverage(project).completed / 6) * 100}%` }} /></i></div><span className="card-link">{arabic ? "افتح المعرض والبيانات الكاملة" : "Open gallery & full data"} <b>↗</b></span><CompareButton name={project["Project Name | اسم المشروع"]} /></div>
            </a>
          ))}
        </div>
        {visible < projects.length && (
          <button
            className="load-more"
            onClick={() => setVisible((value) => value + 24)}
          >
            {arabic ? "تحميل المزيد ↓" : "Load more ↓"}
          </button>
        )}

          </section>
        </div>

        <section className="projects-consultant-cta">
          <div className="projects-consultant-art">
            <span>MAHSHOUR</span>
            <i>REAL ESTATE</i>
          </div>

          <div className="projects-consultant-copy">
            <small>{arabic ? "محتاج مساعدة؟" : "NEED SOME HELP?"}</small>

            <h2>
              {arabic
                ? "مش لاقي المشروع المناسب؟"
                : "Can't find the right project?"}
            </h2>

            <p>
              {arabic
                ? "تواصل مع مستشار عقاري لمراجعة احتياجاتك والميزانية وخطة الدفع المناسبة."
                : "Speak with an advisor to review your needs, budget and preferred payment structure."}
            </p>

            <a href="/#contact">
              {arabic ? "تواصل مع مستشار" : "Talk to an advisor"} <b>→</b>
            </a>
          </div>
        </section>

      </section>
      <DataNotice /><Footer /><ComparisonBar />
    </main>
  );
}
