// Read-only production preflight/export. Never migrates, bootstraps or deploys.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const destination=process.argv[2];
if(!destination || !process.env.CLOUDFLARE_ACCOUNT_ID) throw new Error('Usage: CLOUDFLARE_ACCOUNT_ID=<owner account> node scripts/admin-production-backup.mjs <backup-directory-outside-repository>');
const output=resolve(destination), repo=resolve('.');
if(output===repo || output.startsWith(repo+'/')) throw new Error('Backups must be stored outside the repository.');
mkdirSync(output,{recursive:true,mode:0o700});
const config=resolve(output,'d1-maintenance.json');
writeFileSync(config,JSON.stringify({name:'mas-map-d1-maintenance',account_id:process.env.CLOUDFLARE_ACCOUNT_ID,d1_databases:[{binding:'DB',database_name:'mas-map-production',database_id:'61674c0c-3880-4867-bcd3-f813b1176b74'}]},null,2),{mode:0o600});
function wrangler(args){const r=spawnSync('npx',['--no-install','wrangler',...args,'--config',config],{encoding:'utf8',maxBuffer:16*1024*1024});if(r.status!==0) throw new Error('Wrangler read-only step failed. Authenticate with Cloudflare securely, check account permissions, then retry. No migration was attempted.');return r.stdout;}
const info=wrangler(['d1','info','DB','--json']);
const identity=JSON.parse(info);
if((identity.uuid||identity.id)!=='61674c0c-3880-4867-bcd3-f813b1176b74'||identity.name!=='mas-map-production') throw new Error('Database identity mismatch: stop.');
writeFileSync(resolve(output,'database-info.json'),info,{mode:0o600});
const schema=wrangler(['d1','execute','DB','--remote','--json','--command',"SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY type,name;"]);
writeFileSync(resolve(output,'schema-before.json'),schema,{mode:0o600});
writeFileSync(resolve(output,'bookmark-before.json'),wrangler(['d1','time-travel','info','DB','--json']),{mode:0o600});
const backup=resolve(output,'before-admin.sql');
wrangler(['d1','export','DB','--remote','--output',backup]);
const bytes=readFileSync(backup);
const sha256=createHash('sha256').update(bytes).digest('hex');
// Empty exports can be legitimate; schema-before.json and bookmark preserve context.
writeFileSync(resolve(output,'manifest.json'),JSON.stringify({databaseId:identity.uuid||identity.id,databaseName:identity.name,createdAt:new Date().toISOString(),bytes:bytes.length,sha256,restoreTest:'NOT RUN - validate export locally before approving migration'},null,2),{mode:0o600});
console.log('Read-only backup created. Locally validate the SQL export in an isolated D1, compare schemas, then copy the directory to durable owner-controlled storage. No production migration or deployment was executed.');
