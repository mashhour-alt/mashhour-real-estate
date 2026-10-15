// Local rendering of the actual admin component with explicit API fixtures.
// No auth bypass or test route is added to the production application.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
const repo=resolve('.'),output=resolve(process.env.ADMIN_UI_OUTPUT||'/tmp/mas-map-admin-ui');
await mkdir(output,{recursive:true});
const catalogue=JSON.parse(await readFile('public/data/project-catalog.json','utf8'));
const source=catalogue.projects.slice(0,8);
const projects=source.map((p,i)=>({id:'project_fixture_'+i,name:p['Project Name | اسم المشروع'],developer:p['Developer | المطور'],developer_id:'developer_fixture_'+i,area:p['Location / Community | المنطقة'],starting_price_aed:p['Starting Price AED | السعر المبدئي'],expected_handover:p['Handover | التسليم'],status:'active',revision:1,images:'[]',updated_at:'2026-10-15T12:00:00Z'}));
const developers=projects.map(p=>({id:p.developer_id,name:p.developer,status:'unverified',verified:0,revision:1,website:null,updated_at:p.updated_at}));
const request={id:'request_fixture_1',entity_type:'project',entity_id:projects[0].id,status:'pending_review',proposed_changes:JSON.stringify({name:projects[0].name}),previous_values:JSON.stringify({name:projects[0].name}),submitted_by:'fixture_user',submitter_email:'fixture@example.invalid',reviewer_email:null,submitted_at:'2026-10-15T12:00:00Z'};
const activity={id:'activity_fixture_1',action:'project.updated',entity_type:'project',entity_id:projects[0].id,actor_email:'fixture@example.invalid',created_at:'2026-10-15T12:00:00Z'};
const result=await build({stdin:{contents:'import React from "react";import{createRoot}from"react-dom/client";import AdminPage from"./app/admin/page.tsx";import{LanguageProvider}from"./app/language-context.tsx";createRoot(document.getElementById("root")).render(<LanguageProvider><AdminPage/></LanguageProvider>);',resolveDir:repo,loader:'tsx'},bundle:true,write:false,outdir:output,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'test-link',setup(b){b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'import React from "react";export default function Link(props){return <a {...props}/>}',loader:'jsx',resolveDir:repo}));}}]});
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text,css=result.outputFiles.find(f=>f.path.endsWith('.css')).text;
const globalCss=await readFile('app/globals.css','utf8');
// Export the exact compiled component as an offline review artifact, clearly
// labelled as a local fixture session. No production routes or credentials.
const fixtureData=JSON.stringify({projects,developers,request,activity,areas:catalogue.areas.length}).replaceAll('<','\\u003c');
const previewApi=`const f=${fixtureData};window.fetch=async function(input,options={}){const u=new URL(String(input),location.href);const p=u.pathname.split('/api/admin/')[1]||'';let result={};if(p==='overview')result={metrics:{projects:f.projects.length,developers:f.developers.length,areas:f.areas,pending:1,review:f.projects.length},recentlyUpdated:f.projects.slice(0,4),activity:[f.activity]};else if(p==='settings')result={user:{name:'Local QA',email:'fixture@example.invalid',role:'super_admin',status:'active'},configuration:{jwtValidated:true,databaseAvailable:true,publicCatalogueConnected:false,developerAccountsEnabled:false}};else if(p==='projects'||p==='developers'){const rows=f[p].filter(r=>(!u.searchParams.get('q')||r.name.includes(u.searchParams.get('q')))&&(!u.searchParams.get('status')||r.status===u.searchParams.get('status')));result={[p]:rows,total:rows.length,offset:0,limit:50};}else if(p==='change-requests')result={requests:[f.request]};else if(p==='activity')result={activity:[f.activity]};else if(options.method&&options.method!=='GET')result={ok:true};else if(p.startsWith('change-requests/'))result={record:f.request};else {const [group,id]=p.split('/');result={record:(f[group]||[]).find(r=>r.id===id),projects:group==='developers'?f.projects.slice(0,1):[]};}return new Response(JSON.stringify(result),{headers:{'content-type':'application/json'}});};`;
const logo='data:image/png;base64,'+(await readFile('public/assets/mas-map-logo.png')).toString('base64');
await writeFile(resolve(output,'MAS_MAP_Admin_UI_Preview.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MAS MAP Admin · Local UI preview</title><style>'+globalCss+css+'</style></head><body><div style="padding:10px;background:#e9dabf;text-align:center;font:12px Arial">LOCAL UI PREVIEW · Source-derived test fixtures · NOT LIVE · Actions are simulated</div><div id="root"></div><script>'+previewApi.replaceAll('</script','<\\/script')+'</script><script>'+js.replaceAll('/assets/mas-map-logo.png',logo).replaceAll('</script','<\\/script')+'</script></body></html>');
if(process.env.ADMIN_UI_EXPORT_ONLY){console.log('Offline UI preview exported to '+output);process.exit(0);}
const server=createServer(async(req,res)=>{
 const path=new URL(req.url,'http://local');res.setHeader('content-type','application/json');
 if(path.pathname.startsWith('/api/admin/')){
  const p=path.pathname.slice(11);let data={};
  if(p==='overview')data={metrics:{projects:projects.length,developers:developers.length,areas:catalogue.areas.length,pending:1,review:projects.length},recentlyUpdated:projects.slice(0,4),activity:[activity]};
  else if(p==='settings')data={user:{name:'Local QA',email:'fixture@example.invalid',role:'super_admin',status:'active'},configuration:{jwtValidated:true,databaseAvailable:true,publicCatalogueConnected:false,developerAccountsEnabled:false}};
  else if(p==='projects'||p==='developers'){const list=p==='projects'?projects:developers;const rows=list.filter(r=>(!path.searchParams.get('q')||r.name.includes(path.searchParams.get('q')))&&(!path.searchParams.get('status')||r.status===path.searchParams.get('status')));data={[p]:rows,total:rows.length,offset:0,limit:50};}
  else if(p==='change-requests')data={requests:[request]};
  else if(p==='activity')data={activity:[activity]};
  else if(p.startsWith('change-requests/'))data=req.method==='GET'?{record:request}:{ok:true};
  else if(p.startsWith('projects/'))data=req.method==='GET'?{record:projects.find(x=>x.id===p.split('/')[1])}:{ok:true};
  else if(p.startsWith('developers/'))data=req.method==='GET'?{record:developers.find(x=>x.id===p.split('/')[1]),projects:projects.slice(0,1)}:{ok:true};
  return res.end(JSON.stringify(data));
 }
 if(path.pathname==='/test.js'){res.setHeader('content-type','text/javascript');return res.end(js);}
 if(path.pathname==='/test.css'){res.setHeader('content-type','text/css');return res.end(globalCss+'\n'+css);}
 if(path.pathname==='/assets/mas-map-logo.png'){res.setHeader('content-type','image/png');return res.end(await readFile('public/assets/mas-map-logo.png'));}
 res.setHeader('content-type','text/html');res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/test.css"></head><body><div style="padding:7px;background:#e9dabf;text-align:center;font:11px Arial">LOCAL UI TEST · Source-derived API fixtures · NOT PRODUCTION</div><div id="root"></div><script src="/test.js"></script></body></html>');
});
await new Promise(r=>server.listen(process.env.ADMIN_UI_SERVE_ONLY?4174:0,process.env.ADMIN_UI_SERVE_ONLY?'0.0.0.0':'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
if(process.env.ADMIN_UI_SERVE_ONLY){console.log('Local fixture preview: '+url);await new Promise(()=>{});}
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});let checks=0;
try{
 for(const [label,width,height] of [['desktop',1440,1050],['tablet',820,1180],['mobile',390,844]])for(const language of ['en','ar']){
  const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(lang=>localStorage.setItem('mashhour-language',lang),language);await page.goto(url);await page.getByRole('heading',{name:language==='ar'?'كل ما تحتاجه، في مكان واحد.':'Your platform, at a glance.'}).waitFor();
  assert.equal(await page.locator('html').getAttribute('dir'),language==='ar'?'rtl':'ltr');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow '+label+language);
  await page.screenshot({path:resolve(output,label+'-'+language+'-dashboard.png'),fullPage:true});
  async function nav(name){if(width<=760)await page.getByRole('button',{name:language==='ar'?'فتح قائمة الإدارة':'Toggle administration menu'}).click();await page.getByRole('navigation').getByRole('button',{name}).click();}
  await nav(language==='ar'?'المشاريع':'Projects');await page.getByRole('button',{name:(language==='ar'?'فتح ':'Open ')+projects[0].name,exact:true}).waitFor();
  await page.screenshot({path:resolve(output,label+'-'+language+'-projects.png'),fullPage:true});
  await page.getByRole('button',{name:(language==='ar'?'فتح ':'Open ')+projects[0].name,exact:true}).click();await page.getByRole('button',{name:language==='ar'?'مراجعة وحفظ':'Review and save'}).click();assert(await page.getByRole('dialog').isVisible());await page.getByRole('button',{name:language==='ar'?'رجوع':'Go back'}).click();assert(!await page.getByRole('dialog').isVisible());
  await nav(language==='ar'?'مركز الاعتماد':'Approval center');await page.getByRole('button',{name:(language==='ar'?'فتح ':'Open ')+request.entity_id,exact:true}).click();await page.getByRole('button',{name:language==='ar'?'اعتماد التغيير':'Approve change'}).click();assert(await page.getByRole('dialog').isVisible());await page.keyboard.press('Escape');assert(!await page.getByRole('dialog').isVisible());
  await page.screenshot({path:resolve(output,label+'-'+language+'-approvals.png'),fullPage:true});
  await nav(language==='ar'?'الإعدادات':'Settings');await page.getByRole('heading',{name:language==='ar'?'حالة النظام':'System status'}).waitFor();assert(await page.getByText('fixture@example.invalid',{exact:true}).isVisible());assert.equal(errors.length,0,errors.join('\n'));await page.close();checks++;console.log('PASS '+label+' '+language+' direction, overflow, tables, forms, dialogs, settings, no runtime errors');
 }
 console.log('RESULT '+checks+' responsive/language scenarios passed. Screenshots: '+output);
}finally{await browser.close();await new Promise(r=>server.close(r));}
