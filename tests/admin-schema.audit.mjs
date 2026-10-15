// Isolated, in-memory D1 audit. Never connects to Cloudflare production.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare } from 'miniflare';

const mf = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("audit"); } };', compatibilityDate: '2026-05-15', d1Databases: ['AUDIT_DB'] });
const db = await mf.getD1Database('AUDIT_DB');
const sql = await readFile(new URL('../drizzle/0000_mas_map_admin_foundation.sql', import.meta.url), 'utf8');
const statements = sql.replace(/^--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean);
const run = (sql, ...args) => db.prepare(sql).bind(...args).run();
let passed = 0;
async function check(name, fn) { await fn(); passed++; console.log(`PASS ${name}`); }
async function apply() { return db.batch(statements.map(s => db.prepare(s))); }
const stamp = '2026-10-13T00:00:00Z';
try {
  await check('only CREATE TABLE, CREATE INDEX and foreign-key PRAGMA', async () => assert(statements.every(s => /^(CREATE (TABLE|INDEX) IF NOT EXISTS|PRAGMA foreign_keys = ON)/i.test(s))));
  await check('fresh migration applies to D1', apply);
  const schema = (await db.prepare("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name").all()).results;
  await check('exact six application tables and five explicit indexes', async () => {
    assert.deepEqual(schema.filter(r => r.type === 'table').map(r => r.name).sort(), ['admin_audit_logs','admin_users','developer_accounts','developers','project_change_requests','projects']);
    assert.equal(schema.filter(r => r.type === 'index').length, 5);
  });
  await run('INSERT INTO admin_users VALUES (?, ?, NULL, ?, ?, ?, ?)', 'user_audit', 'owner@example.invalid', 'super_admin', 'active', stamp, stamp);
  await run('INSERT INTO developers (id,legacy_key,name,created_at,updated_at) VALUES (?,?,?,?,?)', 'dev_audit','legacy_dev','Fixture developer',stamp,stamp);
  await run('INSERT INTO projects (id,legacy_key,name,developer_id,created_at,updated_at) VALUES (?,?,?,?,?,?)', 'project_audit','legacy_project','Fixture project','dev_audit',stamp,stamp);
  await check('rerun preserves schema and existing rows', async () => { await apply(); assert.deepEqual((await db.prepare("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name").all()).results, schema); assert.equal(await db.prepare('SELECT COUNT(*) FROM projects').first('COUNT(*)'), 1); });
  await check('email uniqueness ignores case', () => assert.rejects(run('INSERT INTO admin_users VALUES (?, ?, NULL, ?, ?, ?, ?)', 'duplicate','OWNER@example.invalid','super_admin','active',stamp,stamp), /UNIQUE/));
  await check('invalid roles rejected', () => assert.rejects(run('UPDATE admin_users SET role = ?', 'anonymous'), /CHECK/));
  await check('invalid developer status rejected', () => assert.rejects(run('UPDATE developers SET status = ?', 'unknown'), /CHECK/));
  await check('invalid verified flag rejected', () => assert.rejects(run('UPDATE developers SET verified = 2'), /CHECK/));
  await check('invalid project status rejected', () => assert.rejects(run('UPDATE projects SET status = ?', 'unknown'), /CHECK/));
  await check('construction progress restricted to 0..100', async () => { await assert.rejects(run('UPDATE projects SET construction_progress = 101'), /CHECK/); await assert.rejects(run('UPDATE projects SET construction_progress = -1'), /CHECK/); });
  await check('project cannot reference nonexistent developer', () => assert.rejects(run('UPDATE projects SET developer_id = ?', 'missing'), /FOREIGN KEY/));
  await check('referenced developer cannot be deleted', () => assert.rejects(run('DELETE FROM developers'), /FOREIGN KEY/));
  await check('developer account enforces both foreign keys', () => assert.rejects(run('INSERT INTO developer_accounts VALUES (?,?,?,?,?,?)','account_audit','dev_audit','missing','developer_staff','invited',stamp), /FOREIGN KEY/));
  await run('INSERT INTO project_change_requests (id,entity_type,entity_id,proposed_changes,previous_values,base_revision,submitted_by,status,submitted_at) VALUES (?,?,?,?,?,?,?,?,?)','change_audit','project','project_audit','{"name":"Proposed fixture"}','{"name":"Fixture project"}',1,'user_audit','pending_review',stamp);
  await check('pending proposal does not change project', async () => assert.equal(await db.prepare('SELECT name FROM projects').first('name'), 'Fixture project'));
  await check('change request rejects unknown status and submitter', async () => { await assert.rejects(run('UPDATE project_change_requests SET status = ?', 'published'), /CHECK/); await assert.rejects(run('UPDATE project_change_requests SET submitted_by = ?', 'missing'), /FOREIGN KEY/); });
  await check('audit actor foreign key enforced', () => assert.rejects(run('INSERT INTO admin_audit_logs VALUES (?,?,?,?,?,?,?,?)','log_audit','missing','test','project','project_audit','{}','{}',stamp), /FOREIGN KEY/));
  await check('failed D1 batch rolls back earlier writes', async () => { await assert.rejects(db.batch([db.prepare("UPDATE projects SET name = 'Must roll back'"),db.prepare("UPDATE projects SET developer_id = 'missing'")])); assert.equal(await db.prepare('SELECT name FROM projects').first('name'), 'Fixture project'); });
  await check('revision condition prevents stale update', async () => { await run('UPDATE projects SET revision = 2'); const result = await run("UPDATE projects SET name = 'Stale value' WHERE id = 'project_audit' AND revision = 1"); assert.equal(result.meta.changes, 0); });
  await check('foreign-key check clean', async () => { assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results, []); });
  console.log(`RESULT ${passed} isolated D1 checks passed.`);
  console.log('KNOWN LIMITS: IF NOT EXISTS does not reconcile a conflicting existing schema; role-authorized approvals, polymorphic target existence, review completeness, JSON validity, revision positivity, price positivity and audit immutability are not all database constraints.');
} finally { await mf.dispose(); }
