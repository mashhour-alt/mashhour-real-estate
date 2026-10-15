"use client";
import "./admin.css";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../language-context";
type Row=Record<string,unknown>;
type Tab="overview"|"projects"|"developers"|"approvals"|"activity"|"settings";
type Overview={metrics:Record<string,number|null>;recentlyUpdated:Row[];activity:Row[]};
type Settings={user:{name:string|null;email:string;role:string;status:string};configuration:{jwtValidated:boolean;databaseAvailable:boolean;publicCatalogueConnected:boolean;developerAccountsEnabled:boolean}};
const nav:[Tab,string,string,string][]=[["overview","نظرة عامة","Overview","01"],["projects","المشاريع","Projects","02"],["developers","المطورون","Developers","03"],["approvals","مركز الاعتماد","Approval center","04"],["activity","سجل النشاط","Activity log","05"],["settings","الإعدادات","Settings","06"]];
const fields={
 projects:["name","developer_id","area","location","starting_price_aed","unit_types","payment_plan","expected_handover","construction_progress","status","images","brochure_url","last_verified_at"],
 developers:["name","website","status","verified"]
};
const labels:Record<string,[string,string]>={name:["الاسم","Name"],developer_id:["معرف المطور المرتبط","Developer ID"],area:["المنطقة","Area"],location:["الموقع","Location"],starting_price_aed:["السعر المبدئي · درهم","Starting price · AED"],unit_types:["أنواع الوحدات","Unit types"],payment_plan:["خطة الدفع","Payment plan"],expected_handover:["موعد التسليم المتوقع","Expected handover"],construction_progress:["نسبة الإنجاز %","Construction progress %"],status:["الحالة","Status"],images:["روابط الصور · رابط في كل سطر","Image URLs · one per line"],brochure_url:["رابط البروشور","Brochure URL"],last_verified_at:["آخر تحقق · ISO 8601","Last verified · ISO 8601"],website:["الموقع الإلكتروني","Website"],verified:["ملف موثّق","Verified profile"]};
const statuses:Record<string,[string,string]>={draft:["مسودة","Draft"],active:["نشط","Active"],inactive:["غير نشط","Inactive"],archived:["مؤرشف","Archived"],verified:["موثّق","Verified"],unverified:["غير موثّق","Unverified"],suspended:["موقوف","Suspended"],pending_review:["بانتظار المراجعة","Pending review"],approved:["معتمد","Approved"],rejected:["مرفوض","Rejected"]};
async function api(path:string,method="GET",body?:unknown){
 const res=await fetch("/api/admin/"+path,{method,credentials:"same-origin",headers:{"content-type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||"Unable to complete request.");return data;
}
function parse(value:unknown):Row{try{const r=JSON.parse(String(value||"{}"));return r&&typeof r==="object"&&!Array.isArray(r)?r:{};}catch{return {};}}
function display(value:unknown){return value===null||value===undefined||value===""?"—":typeof value==="object"?JSON.stringify(value):String(value);}
export default function AdminPage(){
 const {arabic,setLanguage}=useLanguage();
 const tr=(ar:string,en:string)=>arabic?ar:en;
 const label=(key:string)=>labels[key]?.[arabic?0:1]||key.replaceAll("_"," ");
 const statusLabel=(key:unknown)=>statuses[String(key)]?.[arabic?0:1]||display(key);
 const [tab,setTab]=useState<Tab>("overview"),[query,setQuery]=useState(""),[filter,setFilter]=useState(""),[offset,setOffset]=useState(0);
 const [rows,setRows]=useState<Row[]>([]),[total,setTotal]=useState(0),[overview,setOverview]=useState<Overview|null>(null),[settings,setSettings]=useState<Settings|null>(null);
 const [loading,setLoading]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState(""),[version,setVersion]=useState(0),[busy,setBusy]=useState(false),[mobile,setMobile]=useState(false);
 const [record,setRecord]=useState<Row|null>(null),[form,setForm]=useState<Row>({}),[associated,setAssociated]=useState<Row[]>([]),[reason,setReason]=useState("");
 const [confirmation,setConfirmation]=useState<"save"|"approve"|"reject"|"submit"|null>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const editor=useRef<HTMLElement>(null);
 useEffect(()=>{if(confirmation)dialog.current?.showModal();else dialog.current?.close();},[confirmation]);
 useEffect(()=>{if(record)editor.current?.focus();},[record]);
 useEffect(()=>{
  let alive=true;
  Promise.all([api("overview"),api("settings")]).then(([a,b])=>{if(alive){setOverview(a);setSettings(b);}}).catch(e=>{if(alive)setError(e.message);});
  return()=>{alive=false;};
 },[version]);
 useEffect(()=>{
  let alive=true;
  const path=tab==="projects"||tab==="developers"?tab+"?q="+encodeURIComponent(query)+"&status="+encodeURIComponent(filter)+"&offset="+offset:tab==="approvals"?"change-requests":tab==="activity"?"activity":null;
  Promise.resolve().then(async()=>{
   if(!alive)return;
   setLoading(true);
   try{if(path){const data=await api(path);if(alive){const list=data[tab==="approvals"?"requests":tab]||[];setRows(list);setTotal(data.total??list.length);}}}
   catch(e){if(alive)setError((e as Error).message);}
   finally{if(alive)setLoading(false);}
  });
  return()=>{alive=false;};
 },[tab,query,filter,offset,version]);
 function navigate(next:Tab){setTab(next);setQuery("");setFilter("");setOffset(0);setRows([]);setRecord(null);setAssociated([]);setReason("");setError("");setNotice("");setLoading(true);setMobile(false);}
 function reload(){setError("");setLoading(true);setVersion(v=>v+1);}
 async function open(row:Row){
  setBusy(true);setError("");
  try{const data=await api((tab==="approvals"?"change-requests":tab)+"/"+row.id);setRecord(data.record);setForm({...data.record,images:Array.isArray(parseImages(data.record.images))?parseImages(data.record.images).join("\n"):""});setAssociated(data.projects||[]);setReason("");}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 function parseImages(value:unknown):string[]{try{const a=typeof value==="string"?JSON.parse(value):value;return Array.isArray(a)?a.filter(v=>typeof v==="string"):[];}catch{return [];}}
 function patch():Row{
  const result:Row={};
  for(const key of fields[tab as "projects"|"developers"]||[]){
   let value=form[key];
   if(key==="images")value=String(value||"").split("\n").map(s=>s.trim()).filter(Boolean);
   else if(key==="verified")value=Boolean(value);
   else if(key==="starting_price_aed"||key==="construction_progress")value=value===""||value==null?null:Number(value);
   else if(value===""||value===undefined)value=null;
   const previous=key==="images"?parseImages(record?.[key]):key==="verified"?Boolean(record?.[key]):record?.[key]??null;
   if(!record?.id||JSON.stringify(previous)!==JSON.stringify(value))result[key]=value;
  }
  return result;
 }
 async function execute(){
  const action=confirmation;if(!action||!record)return;setConfirmation(null);setBusy(true);setError("");
  try{
   if(action==="save"){
    const changes=patch();if(!Object.keys(changes).length){setNotice(tr("لا توجد تغييرات للحفظ.","No changes to save."));return;}
    await api(tab+(record.id?"/"+record.id:""),record.id?"PATCH":"POST",{...changes,...(record.id?{revision:record.revision}:{})});
   }else await api("change-requests/"+record.id+"/"+action,"POST",{reason});
   setRecord(null);setNotice(tr("تم تسجيل العملية بنجاح في الإدارة.","The administration action was recorded successfully."));setVersion(v=>v+1);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 const visible=(tab==="activity"||tab==="approvals")?rows.filter(row=>(!filter||row.status===filter||row.entity_type===filter)&&(!query||JSON.stringify(row).toLowerCase().includes(query.toLowerCase()))):rows;
 const name=nav.find(n=>n[0]===tab)?.[arabic?1:2];
 function badge(status:unknown){return <span className={"adm-badge adm-"+String(status)}>{statusLabel(status)}</span>;}
 return <main className="admin-shell adm-v2" dir={arabic?"rtl":"ltr"}>
  <a className="adm-skip" href="#admin-content">{tr("انتقل للمحتوى","Skip to content")}</a>
  <aside id="admin-sidebar" className={"admin-sidebar "+(mobile?"adm-open":"")}>
   <Link className="admin-brand" href="/"><img src="/assets/mas-map-logo.png" alt="MAS MAP" width="46" height="46"/><span><b>MAS MAP</b><small>ADMINISTRATION</small></span></Link>
   <p className="adm-nav-label">{tr("مساحة العمل","WORKSPACE")}</p>
   <nav aria-label={tr("قائمة الإدارة","Administration navigation")}>{nav.map(([key,ar,en,num])=><button key={key} className={tab===key?"active":""} aria-current={tab===key?"page":undefined} onClick={()=>navigate(key)}><span className="adm-nav-icon" aria-hidden="true">{num}</span>{tr(ar,en)}{key==="approvals"&&overview?.metrics.pending?<span className="adm-count">{overview.metrics.pending}</span>:null}</button>)}</nav>
   <div className="adm-sidebar-foot"><span className="adm-avatar">M</span><div><b>{settings?.user.name||tr("المسؤول الرئيسي","Super administrator")}</b><small>SUPER ADMIN</small></div></div>
   <a className="admin-signout" href="/cdn-cgi/access/logout">{tr("تسجيل الخروج","Sign out")} ↗</a>
  </aside>
  <section id="admin-content" className="admin-content" tabIndex={-1}>
   <header className="adm-topbar"><button className="adm-menu" aria-label={tr("فتح قائمة الإدارة","Toggle administration menu")} aria-controls="admin-sidebar" aria-expanded={mobile} onClick={()=>setMobile(!mobile)}>☰</button><div><p>MAS MAP <span>/ {tr("الإدارة","ADMIN")}</span></p><h1>{name}</h1></div><div className="adm-top-actions"><button onClick={()=>setLanguage(arabic?"en":"ar")} lang={arabic?"en":"ar"}>{tr("English","العربية")}</button><Link href="/">{tr("عرض الموقع","View website")} ↗</Link></div></header>
   <div className="adm-publication"><span aria-hidden="true">◈</span><div><b>{tr("بيانات النشر تحت سيطرتك","Publishing stays under your control")}</b><p>{tr("تعديلات المطورين تحتاج اعتمادك. الربط بالكتالوج العام لم يُفعّل؛ الحفظ هنا لا يغيّر الموقع العام بعد.","Developer changes require your approval. Public catalogue integration is not activated; saving here does not yet update the website.")}</p></div>{badge("inactive")}</div>
   {error?<div className="adm-error" role="alert"><b>{tr("تعذر إكمال الطلب","Request could not be completed")}</b><p>{error}</p><button onClick={reload}>{tr("إعادة المحاولة","Retry")}</button></div>:null}
   {notice?<p className="adm-success" role="status">{notice}</p>:null}
   {tab==="overview"?<>
    <div className="adm-section-heading"><div><small>{tr("نظرة شاملة","AT A GLANCE")}</small><h2>{tr("كل ما تحتاجه، في مكان واحد.","Your platform, at a glance.")}</h2><p>{tr("أرقام الإدارة من D1. عدد المناطق من الكتالوج العام الحالي.","Administration totals come from D1. Areas come from the existing public catalogue.")}</p></div><button className="adm-primary" onClick={()=>{navigate("projects");setRecord({});setForm({status:"draft",images:""});}}>{tr("+ إضافة مشروع","+ Add project")}</button></div>
    <section className="admin-metrics" aria-label={tr("إحصاءات الإدارة","Administration metrics")}>{[["projects",tr("إجمالي المشاريع","Total projects"),"01"],["developers",tr("المطورون","Developers"),"02"],["areas",tr("المناطق","Areas"),"03"],["pending",tr("بانتظار الاعتماد","Pending approvals"),"04"]].map(([key,title,num])=><article key={key}><div><small>{title}</small><span className="adm-metric-icon">{num}</span></div><strong>{overview?overview.metrics[key]===null?"—":Number(overview.metrics[key]).toLocaleString(arabic?"ar-AE":"en-AE"):"—"}</strong><span>{key==="areas"?tr("الكتالوج العام","Public catalogue"):tr("سجلات D1","D1 records")}</span></article>)}</section>
    {!overview&&!error?<Loading text={tr("جارٍ تحميل نظرة عامة آمنة…","Loading secure overview…")}/>:null}
    <section className="admin-grid"><article className="admin-panel"><PanelTitle title={tr("آخر المشاريع المحدثة","Recently updated projects")} action={tr("كل المشاريع","All projects")} click={()=>navigate("projects")}/><RecordList rows={overview?.recentlyUpdated||[]} empty={tr("لا توجد مشاريع مستوردة بعد.","No imported projects yet.")}/></article><article className="admin-panel"><PanelTitle title={tr("النشاط الأخير","Recent activity")} action={tr("عرض السجل","View log")} click={()=>navigate("activity")}/><RecordList rows={overview?.activity||[]} empty={tr("ستظهر العمليات المسجلة هنا.","Recorded administration actions will appear here.")}/></article></section>
    <section className="adm-quick"><h2>{tr("إجراءات سريعة","Quick actions")}</h2><div>{(["projects","developers","approvals"] as Tab[]).map(key=><button key={key} onClick={()=>navigate(key)}><span>{nav.find(n=>n[0]===key)?.[arabic?1:2]}</span><b>↗</b></button>)}</div></section>
   </>:null}
   {["projects","developers","approvals","activity"].includes(tab)?<section className="admin-panel">
    <div className="adm-table-heading"><div><h2>{name}</h2><p>{tr("بحث، مراجعة وإدارة السجلات بأمان.","Find, review and manage records securely.")}</p></div><span>{total} {tr("سجل","records")}</span></div>
    <div className="adm-toolbar"><label className="adm-search"><span aria-hidden="true">⌕</span><input aria-label={tr("البحث في السجلات","Search records")} placeholder={tr("ابحث بالاسم أو التفاصيل…","Search name or details…")} value={query} onChange={e=>{setQuery(e.target.value);setOffset(0);setLoading(true);}}/></label><select aria-label={tr("تصفية السجلات","Filter records")} value={filter} onChange={e=>{setFilter(e.target.value);setOffset(0);setLoading(true);}}><option value="">{tr("كل الحالات","All statuses")}</option>{(tab==="projects"?["draft","active","inactive","archived"]:tab==="developers"?["verified","unverified","suspended"]:tab==="approvals"?["draft","pending_review","approved","rejected"]:["project","developer","admin_user"]).map(key=><option key={key} value={key}>{statusLabel(key)}</option>)}</select><button className="adm-secondary" onClick={reload}>{tr("تحديث","Refresh")}</button>{tab==="projects"?<button className="adm-primary" onClick={()=>{setRecord({});setForm({status:"draft",images:""});setAssociated([]);}}>{tr("+ إضافة مشروع","+ Add project")}</button>:null}</div>
    {loading?<Loading text={tr("جارٍ تحميل السجلات…","Loading records…")}/>:<div className="admin-table-wrap"><table className="admin-table"><caption className="adm-sr">{name}</caption><thead><tr><th>{tr("السجل","Record")}</th><th>{tr("الحالة / التفاصيل","Status / details")}</th><th>{tr("التاريخ","Date")}</th><th>{tr("الإجراء","Action")}</th></tr></thead><tbody>{visible.map((row,index)=><tr key={String(row.id||index)}><td><b>{display(row.name||row.action||row.entity_id)}</b><small>{display(tab==="approvals"?row.submitter_email:tab==="activity"?row.actor_email:row.area||row.website)}</small></td><td>{row.status?badge(row.status):display(row.entity_type)}{row.developer?<small>{display(row.developer)}</small>:null}{row.starting_price_aed!==undefined?<small>{row.starting_price_aed===null?"—":Number(row.starting_price_aed).toLocaleString()} AED</small>:null}</td><td><time>{display(row.updated_at||row.submitted_at||row.created_at)}</time></td><td>{tab!=="activity"?<button className="adm-row-action" disabled={busy} onClick={()=>open(row)} aria-label={tr("فتح ","Open ")+display(row.name||row.entity_id)}>{tr("فتح","Open")} ↗</button>:<button className="adm-row-action" onClick={()=>{setRecord(row);setAssociated([]);}}>{tr("تفاصيل","Details")}</button>}</td></tr>)}</tbody></table>{!visible.length?<Empty title={error?tr("البيانات غير متاحة","Data unavailable"):tr("لا توجد سجلات مطابقة","No matching records")} description={tr("لن تُنشأ بيانات تجريبية داخل حسابك. جرّب تغيير البحث أو الفلتر.","No sample records are added to your account. Try another search or filter.")}/>:null}</div>}
    {(tab==="projects"||tab==="developers")?<div className="adm-pagination"><span>{tr("عرض","Showing")} {rows.length?offset+1:0}–{offset+rows.length} / {total}</span><div><button disabled={offset===0||loading} onClick={()=>{setOffset(Math.max(0,offset-50));setLoading(true);}}>{tr("السابق","Previous")}</button><button disabled={offset+50>=total||loading} onClick={()=>{setOffset(offset+50);setLoading(true);}}>{tr("التالي","Next")}</button></div></div>:<p className="adm-limit">{tr("يعرض أحدث 500 سجل كحد أقصى. البحث والفلتر داخل النتائج المعروضة.","Shows up to the latest 500 records. Search and filtering apply to those results.")}</p>}
   </section>:null}
   {tab==="settings"?settings?<section className="adm-settings-grid"><article className="admin-panel adm-settings-card"><small>PROFILE</small><h2>{tr("الملف الإداري","Administrator profile")}</h2><dl><dt>{tr("الاسم","Name")}</dt><dd>{display(settings.user.name)}</dd><dt>{tr("البريد الإلكتروني","Email")}</dt><dd dir="ltr">{settings.user.email}</dd><dt>{tr("الصلاحية","Role")}</dt><dd>Super Admin</dd><dt>{tr("الحالة","Status")}</dt><dd>{badge(settings.user.status)}</dd></dl></article><article className="admin-panel adm-settings-card"><small>SYSTEM</small><h2>{tr("حالة النظام","System status")}</h2>{[[tr("التحقق من Cloudflare Access","Cloudflare Access validation"),settings.configuration.jwtValidated],[tr("اتصال قاعدة D1","D1 database connection"),settings.configuration.databaseAvailable],[tr("ربط الكتالوج العام","Public catalogue integration"),settings.configuration.publicCatalogueConnected],[tr("حسابات المطورين","Developer accounts"),settings.configuration.developerAccountsEnabled]].map(([title,on])=><div className="adm-setting-row" key={String(title)}><span>{title}</span><span className={"adm-badge "+(on?"adm-active":"adm-inactive")}>{on?tr("متاح","Available"):tr("غير مفعّل","Not activated")}</span></div>)}<p>{tr("لا تُعرض أسرار أو مفاتيح أو رموز مصادقة هنا.","No secrets, keys or authentication tokens are displayed here.")}</p></article></section>:<Loading text={tr("جارٍ تحميل الإعدادات…","Loading configuration…")}/>:null}
   {record?<section ref={editor} tabIndex={-1} className="admin-panel admin-editor" aria-label={tr("تفاصيل السجل","Record details")}><PanelTitle title={tr("تفاصيل السجل","Record details")} action={tr("إغلاق","Close")} click={()=>setRecord(null)}/>
    {tab==="activity"?<div className="adm-editor-body"><dl className="adm-audit-detail">{Object.entries(record).map(([key,value])=><div key={key}><dt>{label(key)}</dt><dd>{display(value)}</dd></div>)}</dl></div>:tab==="approvals"?<div className="adm-editor-body"><div className="adm-review-meta">{badge(record.status)}<span>{tr("أرسله","Submitted by")}: {display(record.submitter_email||record.submitted_by)}</span><span>{tr("راجعه","Reviewed by")}: {display(record.reviewer_email||record.reviewed_by)}</span><span>{display(record.reviewed_at||record.submitted_at)}</span></div><div className="admin-table-wrap"><table className="admin-table adm-diff"><thead><tr><th>{tr("الحقل","Field")}</th><th>{tr("القيمة السابقة","Previous value")}</th><th>{tr("القيمة الجديدة","Proposed value")}</th></tr></thead><tbody>{Object.entries(parse(record.proposed_changes)).map(([key,value])=><tr key={key}><td>{label(key)}</td><td>{display(parse(record.previous_values)[key])}</td><td><mark>{display(value)}</mark></td></tr>)}</tbody></table></div><label className="adm-reason">{tr("سبب القرار (اختياري)","Decision reason (optional)")}<textarea value={reason} maxLength={1000} onChange={e=>setReason(e.target.value)}/></label>{record.status==="pending_review"?<div className="admin-actions"><button className="adm-primary" disabled={busy} onClick={()=>setConfirmation("approve")}>{tr("اعتماد التغيير","Approve change")}</button><button className="adm-danger" disabled={busy} onClick={()=>setConfirmation("reject")}>{tr("رفض التغيير","Reject change")}</button></div>:record.status==="draft"?<button className="adm-primary" disabled={busy} onClick={()=>setConfirmation("submit")}>{tr("إرسال للمراجعة","Submit for review")}</button>:<p>{display(record.review_reason)}</p>}</div>:
    <form className="admin-form" onSubmit={e=>{e.preventDefault();setConfirmation("save");}}>
     <div className="adm-form-heading"><h3>{tab==="projects"?tr("معلومات المشروع","Project information"):tr("ملف المطور","Developer profile")}</h3><p>{tr("أدخل البيانات المؤكدة فقط. الحقول الفارغة تظل غير متاحة.","Enter verified information only. Missing values stay unavailable.")}</p></div>
     {(fields[tab as "projects"|"developers"]||[]).map(key=><label className={key==="images"||key==="payment_plan"?"adm-wide":""} key={key}><span>{label(key)}{key==="name"||key==="developer_id"?<i aria-hidden="true"> *</i>:null}</span>{key==="status"?<select value={String(form[key]||"")} onChange={e=>setForm({...form,[key]:e.target.value,...(tab==="developers"?{verified:e.target.value==="verified"}:{})})}>{(tab==="projects"?["draft","active","inactive","archived"]:["verified","unverified","suspended"]).map(v=><option key={v} value={v}>{statusLabel(v)}</option>)}</select>:key==="verified"?<input type="checkbox" checked={Boolean(form[key])} onChange={e=>setForm({...form,[key]:e.target.checked,status:e.target.checked?"verified":"unverified"})}/>:key==="images"||key==="payment_plan"?<textarea rows={3} value={String(form[key]??"")} onChange={e=>setForm({...form,[key]:e.target.value})}/>:<input required={key==="name"||key==="developer_id"} type={["starting_price_aed","construction_progress"].includes(key)?"number":key==="website"||key==="brochure_url"?"url":"text"} min={0} max={key==="construction_progress"?100:undefined} step="any" value={String(form[key]??"")} onChange={e=>setForm({...form,[key]:e.target.value})}/>}</label>)}
     <div className="adm-unsupported adm-wide"><b>{tr("إمكانات لم تُفعّل في الـbackend بعد","Backend capabilities not activated yet")}</b><p>{tab==="projects"?tr("وصف المشروع والتوفر: غير مدعومين في schema الحالية؛ لن يتم إرسال قيم لهما.","Project description and availability are not supported by the current schema; no values for them will be submitted."):tr("الشعار، وصف المطور، البريد ورقم الاتصال: غير مدعومة بعد. تفعيل حسابات المطورين مؤجل.","Logo, profile description, contact email and phone are not supported yet. Developer account activation is deferred.")}</p></div>
     <div className="admin-actions"><button className="adm-primary" disabled={busy} type="submit">{busy?tr("جارٍ الحفظ…","Saving…"):tr("مراجعة وحفظ","Review and save")}</button><button type="button" className="adm-secondary" onClick={()=>setRecord(null)}>{tr("إلغاء","Cancel")}</button></div>
    </form>}
    {associated.length?<div className="adm-editor-body"><h3>{tr("المشاريع المرتبطة","Associated projects")}</h3><RecordList rows={associated} empty=""/></div>:null}
   </section>:null}
   <footer className="adm-footer"><span>MAS MAP · {tr("الإدارة","Administration")}</span><span>{tr("الصلاحيات تُراجع على الخادم لكل عملية.","Permissions are checked server-side for every operation.")}</span></footer>
  </section>
  <dialog ref={dialog} className="adm-dialog" aria-labelledby="confirmation-title" onCancel={()=>setConfirmation(null)}><h2 id="confirmation-title">{tr("تأكيد العملية","Confirm action")}</h2><p>{confirmation==="approve"?tr("سيُطبّق التغيير على سجل D1 ويُسجّل قرار الاعتماد. النشر العام غير مفعّل بعد.","This applies the change to the D1 record and records approval. Public publication is not enabled yet."):confirmation==="reject"?tr("سيُرفض الطلب دون تعديل السجل. سيُسجّل القرار وسببه.","Reject this request without changing the record. The decision and reason will be logged."):tr("سيُحفظ هذا الإجراء في الإدارة ويُضاف إلى سجل التدقيق.","This action will be saved in administration and recorded in the audit log.")}</p><div className="admin-actions"><button className="adm-secondary" autoFocus onClick={()=>setConfirmation(null)}>{tr("رجوع","Go back")}</button><button className={confirmation==="reject"?"adm-danger":"adm-primary"} onClick={execute}>{tr("تأكيد","Confirm")}</button></div></dialog>
 </main>;
}
function PanelTitle({title,action,click}:{title:string;action:string;click:()=>void}){return <div className="admin-panel-head"><h2>{title}</h2><button onClick={click}>{action} ↗</button></div>;}
function RecordList({rows,empty}:{rows:Row[];empty:string}){return <div className="admin-list">{rows.length?rows.map((r,i)=><div key={String(r.id||i)}><b>{display(r.name||r.action)}</b><span>{display(r.updated_at||r.created_at)}</span></div>):<p>{empty}</p>}</div>;}
function Loading({text}:{text:string}){return <div className="adm-loading" role="status"><span className="adm-spinner" aria-hidden="true"/>{text}</div>;}
function Empty({title,description}:{title:string;description:string}){return <div className="adm-empty"><span aria-hidden="true">◇</span><h3>{title}</h3><p>{description}</p></div>;}
