"use client";
import "./admin.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../language-context";
type Row = Record<string, unknown>;
type Overview = { metrics: { developers:number; projects:number; pending:number; review:number }; recentlyUpdated:Row[]; activity:Row[] };
const fields = {
  projects:["name","developer_id","area","location","starting_price_aed","unit_types","payment_plan","expected_handover","construction_progress","status","images","brochure_url","last_verified_at"],
  developers:["name","website","status","verified"]
};
async function api(path:string, method="GET", data?:unknown) {
  const res=await fetch("/api/admin/"+path,{method,credentials:"same-origin",headers:{"content-type":"application/json"},body:data===undefined?undefined:JSON.stringify(data)});
  const value=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(value.error||"Administration request failed.");
  return value;
}
export default function AdminPage() {
  const {arabic,setLanguage}=useLanguage();
  const t=(ar:string,en:string)=>arabic?ar:en;
  const [tab,setTab]=useState("overview"),[query,setQuery]=useState(""),[rows,setRows]=useState<Row[]>([]);
  const [overview,setOverview]=useState<Overview|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[version,setVersion]=useState(0);
  const [detail,setDetail]=useState<Row|null>(null),[associated,setAssociated]=useState<Row[]>([]),[form,setForm]=useState<Row>({}),[reason,setReason]=useState("");
  const nav=[["overview","نظرة عامة","Overview"],["developers","المطورون","Developers"],["projects","المشاريع","Projects"],["approvals","طلبات المراجعة","Pending approvals"],["activity","سجل النشاط","Activity log"],["settings","الإعدادات","Settings"]];
  useEffect(()=>{
    let alive=true;
    api("overview").then(data=>{if(alive)setOverview(data);}).catch(e=>{if(alive)setError(e.message);});
    return()=>{alive=false;};
  },[version]);
  useEffect(()=>{
    let alive=true;
    const path=tab==="projects"||tab==="developers"?tab+"?q="+encodeURIComponent(query):tab==="approvals"?"change-requests":tab==="activity"?"activity":null;
    if(path) api(path).then(data=>{if(alive)setRows(data[tab==="approvals"?"requests":tab]||[]);}).catch(e=>{if(alive)setError(e.message);});
    return()=>{alive=false;};
  },[tab,query,version]);
  async function open(row:Row) {
    setError("");setBusy(true);
    try {
      const data=await api((tab==="approvals"?"change-requests":tab)+"/"+row.id);
      setDetail(data.record);setAssociated(data.projects||[]);setForm({...data.record});setReason("");
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  function convert():Row {
    const result:Row={};
    const list=fields[tab as keyof typeof fields]||[];
    for(const field of list) {
      const value=form[field];
      result[field]=field==="images"?JSON.parse(String(value||"[]")):field==="verified"?value===true||value===1||value==="true":field==="starting_price_aed"||field==="construction_progress"?(value===""||value==null?null:Number(value)):value===""?null:value;
    }
    return result;
  }
  async function save(event:React.FormEvent) {
    event.preventDefault();setBusy(true);setError("");
    try {await api(tab+(detail?.id?"/"+detail.id:""),detail?.id?"PATCH":"POST",{...convert(),...(detail?.id?{revision:detail.revision}:{})});setDetail(null);setVersion(v=>v+1);}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  async function decision(action:string) {
    if(!detail)return;setBusy(true);setError("");
    try {await api("change-requests/"+detail.id+"/"+action,"POST",{reason});setDetail(null);setVersion(v=>v+1);}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <main className="admin-shell" dir={arabic?"rtl":"ltr"}>
    <aside className="admin-sidebar">
      <Link className="admin-brand" href="/"><img src="/assets/mas-map-logo.png" alt="MAS MAP"/><span><b>MAS MAP</b><small>ADMINISTRATION</small></span></Link>
      <nav>{nav.map(([key,ar,en])=><button key={key} className={tab===key?"active":""} onClick={()=>{setTab(key);setRows([]);setQuery("");setDetail(null);}}>{t(ar,en)}</button>)}</nav>
      <button className="admin-language" onClick={()=>setLanguage(arabic?"en":"ar")}>{t("English","العربية")}</button>
      <a className="admin-signout" href="/cdn-cgi/access/logout">{t("تسجيل الخروج","Sign out")}</a>
    </aside>
    <section className="admin-content">
      <header><div><p>MAS MAP / ADMIN</p><h1>{nav.find(n=>n[0]===tab)?.[arabic?1:2]}</h1></div><span className="admin-role">SUPER ADMIN</span></header>
      <p className="admin-notice">{t("بيانات الموقع العامة تظل من الكتالوج الحالي حتى اعتماد استيراد البيانات والتحويل. تعديلات D1 وحدها لا تنشر على الموقع بعد.","Public data still comes from the existing catalogue until import and cutover are approved. D1 edits alone are not yet published to the website.")}</p>
      {error?<div role="alert" className="admin-notice"><strong>{error}</strong><button onClick={()=>{setError("");setVersion(v=>v+1);}}>{t("إعادة المحاولة","Retry")}</button></div>:null}
      {tab==="overview"&&overview?<><section className="admin-metrics">{[["developers",t("المطورون","Developers")],["projects",t("المشاريع","Projects")],["pending",t("طلبات المراجعة","Pending requests")],["review",t("مشاريع لم تُتحقق بياناتها","Projects without verification")]].map(([key,label])=><article key={key}><small>{label}</small><strong>{overview.metrics[key as keyof Overview["metrics"]]}</strong></article>)}</section><section className="admin-grid"><article className="admin-panel"><h2>{t("آخر التحديثات","Recent updates")}</h2><List rows={overview.recentlyUpdated}/></article><article className="admin-panel"><h2>{t("آخر النشاط","Recent activity")}</h2><List rows={overview.activity}/></article></section></>:null}
      {["projects","developers","approvals","activity"].includes(tab)?<section className="admin-panel">
        <div className="admin-panel-head">{["projects","developers"].includes(tab)?<input aria-label={t("البحث","Search")} value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("بحث بالاسم","Search by name")}/>:<span/>}
        {tab==="projects"?<button onClick={()=>{setDetail({});setForm({name:"",developer_id:"",status:"draft",images:"[]"});}}>{t("+ إضافة مشروع","+ Add project")}</button>:null}</div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t("السجل","Record")}</th><th>{t("الحالة / التفاصيل","Status / details")}</th><th>{t("التاريخ","Date")}</th><th/></tr></thead><tbody>{rows.map((row,index)=><tr key={String(row.id||index)}><td>{String(row.name||row.action||row.entity_id||"—")}</td><td>{String(row.developer||row.status||row.entity_type||"—")}</td><td>{String(row.updated_at||row.submitted_at||row.created_at||"—")}</td><td>{tab!=="activity"?<button disabled={busy} onClick={()=>open(row)}>{t("فتح","Open")}</button>:null}</td></tr>)}</tbody></table></div>
        {!rows.length?<p className="admin-loading">{t("لا توجد سجلات مطابقة. لا يتم اختلاق بيانات بديلة.","No matching records. No substitute data is generated.")}</p>:null}
      </section>:null}
      {tab==="settings"?<section className="admin-panel admin-settings"><h2>Cloudflare Access</h2><p>{t("إدارة تسجيل الدخول من التطبيق الحالي في Cloudflare. لا يوجد تسجيل عام أو تعيين صلاحيات من هذه الشاشة.","Sign-in is managed by the existing Cloudflare application. No public registration or role assignment is available here.")}</p><p>{t("حسابات المطورين وواجهاتهم مؤجلة للمرحلة الثانية.","Developer accounts and submission screens remain Phase 2.")}</p></section>:null}
      {detail?<section className="admin-panel admin-editor"><div className="admin-panel-head"><h2>{t("تفاصيل السجل","Record details")}</h2><button onClick={()=>setDetail(null)}>{t("إغلاق","Close")}</button></div>
        {tab==="approvals"?<div className="admin-settings"><p>{String(detail.status)} · {String(detail.entity_id)}</p><div className="admin-diff"><div><h3>{t("القيم السابقة","Previous values")}</h3><pre>{JSON.stringify(JSON.parse(String(detail.previous_values||"{}")),null,2)}</pre></div><div><h3>{t("التغييرات المقترحة","Proposed changes")}</h3><pre>{JSON.stringify(JSON.parse(String(detail.proposed_changes||"{}")),null,2)}</pre></div></div><label>{t("سبب القرار (اختياري)","Decision reason (optional)")}<textarea value={reason} maxLength={1000} onChange={e=>setReason(e.target.value)}/></label>
          {detail.status==="pending_review"?<div className="admin-actions"><button disabled={busy} onClick={()=>decision("approve")}>{t("اعتماد التغيير","Approve change")}</button><button disabled={busy} onClick={()=>decision("reject")}>{t("رفض","Reject")}</button></div>:detail.status==="draft"?<button disabled={busy} onClick={()=>decision("submit")}>{t("إرسال للمراجعة","Submit for review")}</button>:<p>{String(detail.review_reason||"")}</p>}</div>:
        <form onSubmit={save} className="admin-form">{(fields[tab as keyof typeof fields]||[]).map(field=><label key={field}><span>{field.replaceAll("_"," ")}</span>{field==="status"?<select value={String(form[field]||"")} onChange={e=>setForm({...form,[field]:e.target.value})}>{(tab==="projects"?["draft","active","inactive","archived"]:["verified","unverified","suspended"]).map(v=><option key={v}>{v}</option>)}</select>:field==="verified"?<input type="checkbox" checked={Boolean(form[field])} onChange={e=>setForm({...form,[field]:e.target.checked})}/>:<input required={field==="name"||field==="developer_id"} type={field==="starting_price_aed"||field==="construction_progress"?"number":"text"} min={0} max={field==="construction_progress"?100:undefined} step="any" value={String(form[field]??"")} onChange={e=>setForm({...form,[field]:e.target.value})}/>}</label>)}<div className="admin-actions"><button disabled={busy} type="submit">{t("حفظ في الإدارة","Save administration record")}</button></div></form>}
        {associated.length?<div className="admin-settings"><h3>{t("المشاريع المرتبطة","Associated projects")}</h3><List rows={associated}/></div>:null}
      </section>:null}
    </section>
  </main>;
}
function List({rows}:{rows:Row[]}) {return <div className="admin-list">{rows.map((row,i)=><div key={String(row.id||i)}><b>{String(row.name||row.action||"")}</b><span>{String(row.updated_at||row.created_at||"")}</span></div>)}</div>;}
