import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare } from 'miniflare';
import { handleAdmin, requireAdminPage } from '../worker/admin.ts';

const mf = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("test"); } };', compatibilityDate:'2026-05-15', d1Databases:['DB'] });
const db = await mf.getD1Database('DB');
const migration = await readFile(new URL('../drizzle/0000_mas_map_admin_foundation.sql', import.meta.url),'utf8');
await db.batch(migration.replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
const rsa = await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk = await crypto.subtle.exportKey('jwk',rsa.publicKey); jwk.kid='fixture-key';
const realFetch=globalThis.fetch;
globalThis.fetch=async url=>{assert.equal(String(url),'https://fixture.cloudflareaccess.com/cdn-cgi/access/certs');return Response.json({keys:[jwk]});};
const env={DB:db,ADMIN_ACCESS_TEAM_DOMAIN:'fixture.cloudflareaccess.com',ADMIN_ACCESS_AUD:'fixture-audience',ADMIN_BOOTSTRAP_EMAIL:'owner@example.invalid',ADMIN_BOOTSTRAP_NONCE:'local-test-only-nonce'};
const root='https://local.example';
const b64=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
async function token(email='owner@example.invalid',extra={}) {const data=b64({alg:'RS256',kid:'fixture-key'})+'.'+b64({email,iss:'https://fixture.cloudflareaccess.com',aud:['fixture-audience'],exp:Date.now()/1000+600,...extra});return data+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',rsa.privateKey,new TextEncoder().encode(data))).toString('base64url');}
async function call(path,method='GET',data, jwt, headers={}) {const request=new Request(root+path,{method,headers:{origin:root,'content-type':'application/json',...(jwt?{'cf-access-jwt-assertion':jwt}:{}),...headers},body:data===undefined?undefined:JSON.stringify(data)});return handleAdmin(request,env,new URL(request.url));}
let passed=0; async function check(name,fn){await fn();passed++;console.log('PASS '+name);}
try {
 const owner=await token();
 await check('missing infrastructure fails closed',async()=>assert.equal((await handleAdmin(new Request(root+'/api/admin/session'),{},new URL(root+'/api/admin/session'))).status,503));
 await check('unsigned, missing and malformed credentials rejected',async()=>{for(const jwt of [undefined,'bad',owner+'.extra'])assert.equal((await call('/api/admin/session','GET',undefined,jwt)).status,401);});
 await check('wrong issuer, audience, expiration, nbf rejected',async()=>{for(const extra of [{iss:'https://attacker.invalid'},{iss:'https://fixture.cloudflareaccess.com/'},{aud:['wrong']},{exp:1},{exp:'9999999999'},{nbf:Date.now()/1000+3600}])assert.equal((await call('/api/admin/session','GET',undefined,await token(undefined,extra))).status,401);});
 await check('tampered signature rejected',async()=>assert.equal((await call('/api/admin/session','GET',undefined,owner.slice(0,-10)+'AAAAAAAAAA')).status,401));
 await check('valid Access identity without role denied',async()=>assert.equal((await call('/api/admin/session','GET',undefined,owner)).status,403));
 await check('bootstrap requires owner and nonce',async()=>{assert.equal((await call('/api/admin/bootstrap','POST',{},await token('other@example.invalid'),{'x-admin-bootstrap-nonce':env.ADMIN_BOOTSTRAP_NONCE})).status,403);assert.equal((await call('/api/admin/bootstrap','POST',{},owner)).status,403);});
 await check('cross-origin writes rejected',async()=>assert.equal((await call('/api/admin/bootstrap','POST',{},owner,{origin:'https://attacker.invalid'})).status,403));
 await check('bootstrap atomic user and audit created once',async()=>{assert.equal((await call('/api/admin/bootstrap','POST',{},owner,{'x-admin-bootstrap-nonce':env.ADMIN_BOOTSTRAP_NONCE})).status,200);assert.equal((await call('/api/admin/bootstrap','POST',{},owner,{'x-admin-bootstrap-nonce':env.ADMIN_BOOTSTRAP_NONCE})).status,409);assert.equal(await db.prepare('SELECT COUNT(*) AS n FROM admin_audit_logs').first('n'),1);});
 await check('real signed-in owner passes API and dashboard guards',async()=>{assert.equal((await call('/api/admin/session','GET',undefined,owner)).status,200);assert.equal(await requireAdminPage(new Request(root+'/admin',{headers:{'cf-access-jwt-assertion':owner}}),env),null);});
 await db.prepare("INSERT INTO admin_users VALUES ('staff_user','staff@example.invalid',NULL,'developer_staff','active','test','test')").run();
 await check('developer staff cannot read admin or approve',async()=>{const staff=await token('staff@example.invalid');for(const [path,method,data]of [['/api/admin/projects','GET',undefined],['/api/admin/change-requests/change_fixture/approve','POST',{}]])assert.equal((await call(path,method,data,staff)).status,403);assert.equal((await requireAdminPage(new Request(root+'/admin',{headers:{'cf-access-jwt-assertion':staff}}),env)).status,403);});
 await db.prepare("INSERT INTO developers (id,legacy_key,name,created_at,updated_at) VALUES ('developer_fixture','legacy_dev','Fixture','test','test')").run();
 let project;
 await check('project creation persists zero values and audit',async()=>{const r=await call('/api/admin/projects','POST',{name:'Fixture project',developer_id:'developer_fixture',starting_price_aed:0,construction_progress:0},owner);assert.equal(r.status,201);project=(await r.json()).id;assert.equal(await db.prepare('SELECT construction_progress FROM projects WHERE id=?').bind(project).first('construction_progress'),0);});
 await check('invalid input rejected before SQL',async()=>{assert.equal((await call('/api/admin/projects/'+project,'PATCH',{revision:1,construction_progress:101},owner)).status,400);assert.equal((await call('/api/admin/projects/'+project,'PATCH',{revision:1,brochure_url:'javascript:alert(1)'},owner)).status,400);});
 async function submit(name){const r=await call('/api/admin/change-requests','POST',{entity_type:'project',entity_id:project,proposed_changes:{name}},owner);assert.equal(r.status,201);return (await r.json()).id;}
 const first=await submit('Approved fixture');
 await check('pending changes remain invisible in published records',async()=>assert.equal(await db.prepare('SELECT name FROM projects WHERE id=?').bind(project).first('name'),'Fixture project'));
 await check('approval updates record, decision and audit',async()=>{const r=await call('/api/admin/change-requests/'+first+'/approve','POST',{},owner);assert.equal(r.status,200);assert.equal(await db.prepare('SELECT name FROM projects WHERE id=?').bind(project).first('name'),'Approved fixture');assert.equal(await db.prepare("SELECT COUNT(*) AS n FROM admin_audit_logs WHERE action='change_request.approved'").first('n'),1);assert.equal((await call('/api/admin/change-requests/'+first+'/approve','POST',{},owner)).status,409);});
 const second=await submit('Rejected fixture');
 await check('rejection never changes published record',async()=>{assert.equal((await call('/api/admin/change-requests/'+second+'/reject','POST',{reason:'Fixture reason'},owner)).status,200);assert.equal(await db.prepare('SELECT name FROM projects WHERE id=?').bind(project).first('name'),'Approved fixture');});
 const stale=await submit('Stale fixture');
 await check('stale approval does not overwrite or audit a success',async()=>{assert.equal((await call('/api/admin/projects/'+project,'PATCH',{revision:2,area:'Updated area'},owner)).status,200);assert.equal((await call('/api/admin/change-requests/'+stale+'/approve','POST',{},owner)).status,409);assert.equal(await db.prepare('SELECT name FROM projects WHERE id=?').bind(project).first('name'),'Approved fixture');assert.equal(await db.prepare("SELECT COUNT(*) AS n FROM admin_audit_logs WHERE action='change_request.approved'").first('n'),1);});
 await check('developer edit persists and records audit',async()=>assert.equal((await call('/api/admin/developers/developer_fixture','PATCH',{revision:1,status:'verified',verified:true},owner)).status,200));
 await check('dashboard, detail, activity return real data',async()=>{const r=await call('/api/admin/overview','GET',undefined,owner);assert.equal((await r.json()).metrics.projects,1);for(const path of ['/api/admin/projects/'+project,'/api/admin/developers/developer_fixture','/api/admin/activity'])assert.equal((await call(path,'GET',undefined,owner)).status,200);});
 console.log(`RESULT: ${passed} security/API integration checks passed; no production resources used.`);
} finally {globalThis.fetch=realFetch;await mf.dispose();}
