"use client";

import { useMemo } from "react";
import {
  Footer,
  Header,
  PageIntro,
  useDldReconciliationReport,
  usePlatformData,
  useProjectEnrichment,
  useProjectLiveData,
} from "../components";
import { useLanguage } from "../language-context";
import { areaFrom, isDldLinked } from "../data";

export default function DataCoveragePage() {
  const data = usePlatformData();
  const enrichment = useProjectEnrichment();
  const liveData = useProjectLiveData();
  const dldReport = useDldReconciliationReport();
  const { arabic } = useLanguage();

  const stats = useMemo(() => {
    const projects = data?.projects || [];
    const dldLinked = projects.filter(isDldLinked);
    const developerNames = new Set(
      projects.map((project) => project["Developer | المطور"]?.trim()).filter(Boolean),
    );
    const areas = new Set(projects.map((project) => areaFrom(project["Location / Community | المنطقة"])));
    const sourceMatched = projects.filter((project) => Boolean(liveData[project["Project Name | اسم المشروع"]]));
    const officiallyVerified = projects.filter((project) => enrichment[project["Project Name | اسم المشروع"]]?.verified);
    const escrowVerified = dldLinked.filter(
      (project) => project["Escrow Account Status | حالة حساب الضمان"] === "Verified Yes",
    );
    const withCoordinates = projects.filter((project) => {
      const name = project["Project Name | اسم المشروع"];
      return Boolean(enrichment[name]?.coordinates || liveData[name]?.coordinates);
    });
    const updateDates = Object.values(liveData)
      .map((item) => item?.sourceUpdatedAt)
      .filter((value): value is string => Boolean(value))
      .sort();
    return {
      total: projects.length,
      areas: areas.size,
      developers: developerNames.size,
      dldLinked: dldLinked.length,
      escrowVerified: escrowVerified.length,
      sourceMatched: sourceMatched.length,
      officiallyVerified: officiallyVerified.length,
      withCoordinates: withCoordinates.length,
      lastUpdate: updateDates.length ? updateDates[updateDates.length - 1] : null,
    };
  }, [data, enrichment, liveData]);

  const loading = !data;
  const show = (value: number) => (loading ? "—" : value.toLocaleString());

  return (
    <main>
      <Header />
      <PageIntro
        eyebrow={arabic ? "تغطية البيانات" : "DATA COVERAGE"}
        title={arabic ? "إحنا بنعرف إيه، وإيه اللي لسه ناقص." : "What we know, and what is still missing."}
        intro={
          arabic
            ? "كل رقم في الصفحة دي بيتحسب مباشرة من قاعدة البيانات وقت ما بتفتح الصفحة — مفيش أرقام مكتوبة يدوي ولا تقديرات تسويقية."
            : "Every figure on this page is computed directly from the live database when the page loads — no hardcoded numbers and no marketing estimates."
        }
        action={<strong className="page-count">{show(stats.total)} {arabic ? "سجل" : "RECORDS"}</strong>}
      />

      <section className="page-body">
        <div className="coverage-stat-grid coverage-headline-grid">
          <div><strong>{show(stats.total)}</strong><span>{arabic ? "سجل مشروع" : "project records"}</span></div>
          <div><strong>{show(stats.areas)}</strong><span>{arabic ? "منطقة مغطاة" : "areas covered"}</span></div>
          <div><strong>{show(stats.developers)}</strong><span>{arabic ? "مطوّر مرتبط" : "developers linked"}</span></div>
          <div><strong>{show(stats.dldLinked)}</strong><span>{arabic ? "سجل بمصدر DLD رسمي" : "records with an official DLD source"}</span></div>
          <div><strong>{show(stats.escrowVerified)}</strong><span>{arabic ? "حساب ضمان موثّق" : "verified escrow accounts"}</span></div>
          <div><strong>{show(stats.officiallyVerified)}</strong><span>{arabic ? "موثّق من مصدر المطور" : "verified from developer source"}</span></div>
          <div><strong>{show(stats.sourceMatched)}</strong><span>{arabic ? "سجل مطابق لمصدر" : "source-matched records"}</span></div>
          <div><strong>{show(stats.withCoordinates)}</strong><span>{arabic ? "إحداثيات دقيقة" : "precise coordinates"}</span></div>
        </div>

        <p className="coverage-updated">
          {arabic ? "آخر تحديث لبيانات المصادر: " : "Source data last refreshed: "}
          <strong>{stats.lastUpdate || (arabic ? "غير متوفر حالياً" : "Not currently available")}</strong>
          {dldReport?.reconciledAt ? (
            <>
              {arabic ? " · آخر تدقيق مطابقة DLD: " : " · Last DLD reconciliation audit: "}
              <strong>{dldReport.reconciledAt}</strong>
            </>
          ) : null}
        </p>

        <div className="coverage-method">
          <h2>{arabic ? "منهجية البيانات" : "Data methodology"}</h2>
          <ol>
            <li>
              <strong>{arabic ? "الناقص بيفضل ظاهر إنه ناقص." : "Missing data is shown as missing."}</strong>
              <p>{arabic ? "لو حقل مش متوفر، بيظهر \"غير متوفر حالياً\" — مبنملّهوش بمتوسطات ولا تقديرات." : "When a field is unavailable it reads \"Not currently available\" — it is never back-filled with averages or estimates."}</p>
            </li>
            <li>
              <strong>{arabic ? "مبنخترعش بيانات." : "Data is not invented."}</strong>
              <p>{arabic ? "مفيش أسعار ولا تواريخ تسليم ولا تقييمات متولّدة تلقائياً. كل قيمة جاية من سجل مصدر." : "No price, handover date or rating is generated. Every value traces back to a source record."}</p>
            </li>
            <li>
              <strong>{arabic ? "المصادر الرسمية لها الأولوية." : "Official sources take priority."}</strong>
              <p>{arabic ? "سجلات دائرة الأراضي والأملاك (DLD) بتتقدّم على أي مصدر تاني لما تكون متاحة." : "Dubai Land Department records take precedence over any other source when available."}</p>
            </li>
            <li>
              <strong>{arabic ? "مواد المطورين بتتحدد بوضوح." : "Developer material is clearly identified."}</strong>
              <p>{arabic ? "لما البيانات تكون من المطور نفسه، بتتعلّم كده في صفحة المشروع وفي جدول المقارنة." : "When data comes from the developer it is labelled as such on the project page and in the comparison table."}</p>
            </li>
            <li>
              <strong>{arabic ? "السجلات ممكن تكون ناقصة وهي تحت المراجعة." : "Records may be incomplete while under review."}</strong>
              <p>{arabic ? "المشروع بيفضل ظاهر حتى لو بياناته ناقصة، مع توضيح نسبة اكتمال الحزمة، بدل ما يختفي." : "A project stays visible with an explicit completeness score rather than disappearing while its pack is incomplete."}</p>
            </li>
          </ol>
        </div>

        <div className="coverage-method">
          <h2>{arabic ? "تصنيف المصادر" : "Source classification"}</h2>
          <div className="coverage-source-types">
            <div><strong>{arabic ? "بيانات DLD الرسمية" : "Official DLD data"}</strong><span>{arabic ? "سجلات حكومية منشورة" : "Published government records"}</span></div>
            <div><strong>{arabic ? "بيانات المطور الرسمية" : "Official developer data"}</strong><span>{arabic ? "مواد ومصادر معتمدة من المطور" : "Developer-approved material and sources"}</span></div>
            <div><strong>{arabic ? "بيانات مهيكلة داخلياً" : "Internal structured data"}</strong><span>{arabic ? "تنظيف وربط وتوحيد للسجلات" : "Cleaning, linking and normalisation of records"}</span></div>
            <div><strong>{arabic ? "ناقص أو غير موثّق" : "Missing or unverified"}</strong><span>{arabic ? "بيظهر صراحةً كقيد المراجعة" : "Displayed explicitly as pending review"}</span></div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
