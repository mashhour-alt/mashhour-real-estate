"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../language-context";

type Overview = { metrics: { developers: number; projects: number; pending: number }; recentlyUpdated: Array<{ id: string; name: string; updated_at: string }>; activity: Array<{ action: string; entity_id: string; created_at: string }> };
type RecordItem = { id: string; name?: string; developer?: string | null; area?: string | null; website?: string | null; verified?: number; status?: string; entity_type?: string; submitted_at?: string };
async function get<T>(path: string): Promise<T> { const res = await fetch(path, { credentials: "same-origin" }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.error || "Unable to load administration data."); return data; }

export default function AdminPage() {
  const { arabic, toggleLanguage } = useLanguage();
  const [overview, setOverview] = useState<Overview | null>(null); const [notice, setNotice] = useState("Loading secure administration workspace…");
  const [tab, setTab] = useState("overview"); const [query, setQuery] = useState(""); const [records, setRecords] = useState<RecordItem[]>([]);
  const text = arabic ? { title: "مركز إدارة المنصة", unavailable: "الإدارة غير متاحة بعد", setup: "يلزم تهيئة Cloudflare Access وD1 وإنشاء حساب Super Admin عبر إجراء bootstrap الآمن.", signOut: "تسجيل الخروج", language: "English", search: "ابحث بالاسم…", empty: "لا توجد بيانات مستوردة بعد.", developers: "إجمالي المطورين", projects: "إجمالي المشاريع", pending: "طلبات في انتظار المراجعة", review: "المشاريع بحاجة للمراجعة", recently: "آخر المشاريع المحدثة", activity: "سجل النشاط الأخير", rules: "قواعد النشر", ruleTitle: "أي تعديل من مطور يظل مقترحًا حتى تعتمدَه أنت.", ruleText: "يُحفظ التغيير السابق والمقترح والمستخدم والمراجع والتوقيت. التعديل المعتمد فقط هو الذي يُطبّق على سجل النشر لاحقًا." } : { title: "Platform administration", unavailable: "Administration is not available yet", setup: "Cloudflare Access, D1, and the secure Super Admin bootstrap must be configured first.", signOut: "Sign out", language: "العربية", search: "Search by name…", empty: "No imported data yet.", developers: "Total developers", projects: "Total projects", pending: "Pending approvals", review: "Projects requiring review", recently: "Recently updated projects", activity: "Recent activity", rules: "PUBLISHING RULES", ruleTitle: "A developer change remains proposed until you approve it.", ruleText: "Previous and proposed values, submitter, reviewer and timestamps are retained. Only an approved change can later be applied to the published record." };
  const nav = [["overview", "Overview", "نظرة عامة"], ["developers", "Developers", "المطورون"], ["projects", "Projects", "المشاريع"], ["approvals", "Pending approvals", "الموافقات المعلقة"], ["activity", "Activity log", "سجل النشاط"], ["settings", "Settings", "الإعدادات"]];
  const label = nav.find(([key]) => key === tab)?.[arabic ? 2 : 1];

  useEffect(() => { Promise.all([get("/api/admin/session"), get<Overview>("/api/admin/overview")]).then(([, data]) => { setOverview(data); setNotice(""); }).catch((error: Error) => setNotice(error.message)); }, []);
  useEffect(() => {
    const path = tab === "developers" ? `/api/admin/developers?q=${encodeURIComponent(query)}` : tab === "projects" ? `/api/admin/projects?q=${encodeURIComponent(query)}` : tab === "approvals" ? "/api/admin/change-requests" : null;
    if (!path || notice) return;
    get<{ developers?: RecordItem[]; projects?: RecordItem[]; requests?: RecordItem[] }>(path).then((data) => setRecords(data.developers || data.projects || data.requests || [])).catch((error: Error) => setNotice(error.message));
  }, [tab, query, notice]);

  return <main className="admin-shell" dir={arabic ? "rtl" : "ltr"}>
    <aside className="admin-sidebar"><Link className="admin-brand" href="/"><img src="/assets/mas-map-logo.png" alt="MAS MAP" /><span><b>MAS MAP</b><small>ADMINISTRATION</small></span></Link>
      <nav>{nav.map(([key, en, ar]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => { setNotice(""); setTab(key); }}><i>{key === "overview" ? "□" : key === "developers" ? "◇" : key === "projects" ? "▦" : key === "approvals" ? "✓" : key === "activity" ? "◷" : "⚙"}</i><span>{arabic ? ar : en}<small>{arabic ? en : ar}</small></span></button>)}</nav>
      <button className="admin-language" onClick={toggleLanguage}>{text.language}</button><a className="admin-signout" href="/cdn-cgi/access/logout">{text.signOut}<small>{arabic ? "Sign out" : "تسجيل الخروج"}</small></a>
    </aside>
    <section className="admin-content"><header><div><p>MAS MAP / ADMIN</p><h1>{tab === "overview" ? text.title : label}</h1></div><span className="admin-role">SUPER ADMIN</span></header>
      {notice ? <div className="admin-notice"><strong>{text.unavailable}</strong><p>{notice}</p><span>{text.setup}</span></div> : null}
      {overview && tab === "overview" ? <><section className="admin-metrics"><article><small>{text.developers}</small><strong>{overview.metrics.developers.toLocaleString()}</strong><span>Total developers</span></article><article><small>{text.projects}</small><strong>{overview.metrics.projects.toLocaleString()}</strong><span>Total projects</span></article><article className="pending"><small>{text.pending}</small><strong>{overview.metrics.pending.toLocaleString()}</strong><span>Pending approvals</span></article><article><small>{text.review}</small><strong>{overview.metrics.pending.toLocaleString()}</strong><span>Projects requiring review</span></article></section>
        <section className="admin-grid"><article className="admin-panel"><div className="admin-panel-head"><div><small>RECENTLY UPDATED</small><h2>{text.recently}</h2></div><button onClick={() => setTab("projects")}>All projects →</button></div><List rows={overview.recentlyUpdated} empty={text.empty} /></article><article className="admin-panel"><div className="admin-panel-head"><div><small>ADMINISTRATIVE ACTIVITY</small><h2>{text.activity}</h2></div><button onClick={() => setTab("activity")}>View activity →</button></div><List rows={overview.activity} empty={text.empty} /></article></section>
        <section className="admin-workflow"><span>{text.rules}</span><h2>{text.ruleTitle}</h2><p>{text.ruleText}</p></section></> : null}
      {overview && ["developers", "projects", "approvals"].includes(tab) ? <section className="admin-panel admin-records"><div className="admin-panel-head"><div><small>PHASE 1 DATA</small><h2>{label}</h2></div>{tab !== "approvals" ? <input aria-label={text.search} placeholder={text.search} value={query} onChange={(event) => setQuery(event.target.value)} /> : null}</div><List rows={records} empty={text.empty} /></section> : null}
      {overview && ["activity", "settings"].includes(tab) ? <section className="admin-empty"><span>PHASE 1</span><h2>{label}</h2><p>{tab === "activity" ? text.activity : "Cloudflare Access controls sign-in; no administrator role-assignment screen is exposed."}</p></section> : null}
    </section>
  </main>;
}

function List({ rows, empty }: { rows: Array<Record<string, unknown>>; empty: string }) { return <div className="admin-list">{rows.length ? rows.map((row, index) => <div key={String(row.id || index)}><b>{String(row.name || `${row.entity_type || "activity"} · ${row.action || row.status || ""}`)}</b><span>{String(row.developer || row.website || row.submitted_at || row.updated_at || row.created_at || "")}{row.area ? ` · ${String(row.area)}` : ""}</span></div>) : <p>{empty}</p>}</div>; }
