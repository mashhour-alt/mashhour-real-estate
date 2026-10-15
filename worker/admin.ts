type D1 = D1Database;

export type AdminEnv = {
  DB?: D1;
  ADMIN_ACCESS_TEAM_DOMAIN?: string;
  ADMIN_ACCESS_AUD?: string;
  ADMIN_BOOTSTRAP_EMAIL?: string;
  ADMIN_BOOTSTRAP_NONCE?: string;
};

type AccessIdentity = { email: string; name: string | null };
type AdminUser = AccessIdentity & { id: string; role: "super_admin" | "developer_admin" | "developer_staff"; status: string };

const projectFields = ["name", "developer_id", "area", "location", "starting_price_aed", "unit_types", "payment_plan", "expected_handover", "construction_progress", "status", "images", "brochure_url", "last_verified_at"] as const;
const developerFields = ["name", "website", "status", "verified"] as const;
const textEncoder = new TextEncoder();
let jwksCache: { domain: string; expires: number; keys: (JsonWebKey & { kid?: string })[] } | null = null;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

function fail(message: string, status = 400) { return json({ error: message }, status); }

function configured(env: AdminEnv): env is AdminEnv & Required<Pick<AdminEnv, "DB" | "ADMIN_ACCESS_TEAM_DOMAIN" | "ADMIN_ACCESS_AUD">> {
  return Boolean(env.DB && env.ADMIN_ACCESS_TEAM_DOMAIN && /^[a-z0-9-]+\.cloudflareaccess\.com$/i.test(env.ADMIN_ACCESS_TEAM_DOMAIN) && env.ADMIN_ACCESS_AUD);
}

function decodePart(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))));
}

async function accessIdentity(request: Request, env: AdminEnv): Promise<AccessIdentity | null> {
  if (!configured(env)) return null;
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return null;
  if (token.length > 16000 || token.split(".").length !== 3) return null;
  const [rawHeader, rawPayload, rawSignature] = token.split(".");
  if (!rawHeader || !rawPayload || !rawSignature) return null;
  try {
    const header = decodePart(rawHeader) as { alg?: string; kid?: string };
    const payload = decodePart(rawPayload) as { email?: string; name?: string; exp?: number; nbf?: number; aud?: string | string[]; iss?: string };
    if (header.alg !== "RS256" || typeof header.kid !== "string" || typeof payload.email !== "string" || !payload.email.includes("@") || typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now()) return null;
    if (payload.nbf !== undefined && (typeof payload.nbf !== "number" || !Number.isFinite(payload.nbf) || payload.nbf * 1000 > Date.now())) return null;
    const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audience.includes(env.ADMIN_ACCESS_AUD) || payload.iss !== `https://${env.ADMIN_ACCESS_TEAM_DOMAIN}`) return null;
    if (!jwksCache || jwksCache.domain !== env.ADMIN_ACCESS_TEAM_DOMAIN || jwksCache.expires < Date.now() || !jwksCache.keys.some(key => key.kid === header.kid)) {
      const response = await fetch(`https://${env.ADMIN_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) return null;
      const body = await response.json() as { keys?: (JsonWebKey & { kid?: string })[] };
      if (!Array.isArray(body.keys)) return null;
      jwksCache = { domain: env.ADMIN_ACCESS_TEAM_DOMAIN, keys: body.keys, expires: Date.now() + 15 * 60_000 };
    }
    const jwk = jwksCache.keys.find((key) => key.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const signature = Uint8Array.from(atob(rawSignature.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - rawSignature.length % 4) % 4)), (char) => char.charCodeAt(0));
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, textEncoder.encode(`${rawHeader}.${rawPayload}`));
    return valid ? { email: payload.email.toLowerCase(), name: typeof payload.name === "string" ? payload.name : null } : null;
  } catch { return null; }
}

async function requireSuperAdmin(request: Request, env: AdminEnv): Promise<AdminUser | Response> {
  if (!configured(env)) return fail("Admin infrastructure is not configured.", 503);
  const identity = await accessIdentity(request, env);
  if (!identity) return fail("Authentication required.", 401);
  const user = await env.DB.prepare("SELECT id, email, display_name, role, status FROM admin_users WHERE email = ? LIMIT 1").bind(identity.email).first<{ id: string; email: string; display_name: string | null; role: AdminUser["role"]; status: string }>();
  if (!user || user.status !== "active" || user.role !== "super_admin") return fail("Super Admin permission required.", 403);
  return { id: user.id, email: user.email, name: user.display_name || identity.name, role: user.role, status: user.status };
}

function isResponse(value: unknown): value is Response { return value instanceof Response; }
async function body(request: Request): Promise<Record<string, unknown> | null> {
  const text = await request.text();
  if (!text || text.length > 100_000) return null;
  try { const parsed = JSON.parse(text); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null; } catch { return null; }
}
function id(value: unknown) { return typeof value === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(value) ? value : null; }
function cleanText(value: unknown, max = 500) { return typeof value === "string" && value.trim().length <= max ? value.trim() || null : value == null ? null : undefined; }
function cleanNumber(value: unknown) { return value == null || value === "" ? null : typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined; }
function now() { return new Date().toISOString(); }
function randomId(prefix: string) { return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`; }

function projectPatch(input: Record<string, unknown>) {
  const output: Record<string, unknown> = {};
  if ("revision" in input) {
    if (typeof input.revision !== "number" || !Number.isInteger(input.revision) || input.revision < 1) return null;
    output.revision = input.revision;
  }
  for (const field of projectFields) {
    if (!(field in input)) continue;
    const value = field === "starting_price_aed" || field === "construction_progress" ? cleanNumber(input[field]) : field === "images" ? (Array.isArray(input[field]) && input[field].every((item) => typeof item === "string" && item.length <= 2048) ? JSON.stringify(input[field]) : undefined) : cleanText(input[field], field === "payment_plan" ? 4000 : 500);
    if (value === undefined) return null;
    if ((field === "name" || field === "developer_id") && !value) return null;
    if (field === "developer_id" && !id(value)) return null;
    if (field === "construction_progress" && typeof value === "number" && value > 100) return null;
    if (field === "status" && !["draft", "active", "inactive", "archived"].includes(String(value))) return null;
    if (field === "brochure_url" && value && !safeUrl(value)) return null;
    if (field === "images" && !(input[field] as string[]).every(safeUrl)) return null;
    output[field] = value;
  }
  return Object.keys(output).length ? output : null;
}

function developerPatch(input: Record<string, unknown>) {
  const output: Record<string, unknown> = {};
  if ("revision" in input) {
    if (typeof input.revision !== "number" || !Number.isInteger(input.revision) || input.revision < 1) return null;
    output.revision = input.revision;
  }
  for (const field of developerFields) {
    if (!(field in input)) continue;
    const value = field === "verified" ? (typeof input[field] === "boolean" ? Number(input[field]) : undefined) : field === "status" ? (["verified", "unverified", "suspended"].includes(String(input[field])) ? String(input[field]) : undefined) : cleanText(input[field]);
    if (value === undefined) return null;
    if (field === "name" && !value) return null;
    if (field === "website" && value && !safeUrl(value)) return null;
    output[field] = value;
  }
  return Object.keys(output).length ? output : null;
}

function safeUrl(value: unknown) { try { const u = new URL(String(value)); return u.protocol === "https:" || u.protocol === "http:"; } catch { return false; } }

function audit(db: D1, adminId: string, action: string, entityType: string, entityId: string, previous: unknown, next: unknown) {
  return db.prepare("INSERT INTO admin_audit_logs (id, actor_id, action, entity_type, entity_id, previous_values, next_values, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(randomId("audit"), adminId, action, entityType, entityId, JSON.stringify(previous ?? {}), JSON.stringify(next ?? {}), now());
}

async function updateEntity(db: D1, admin: AdminUser, entity: "project" | "developer", entityId: string, patch: Record<string, unknown>) {
  const table = entity === "project" ? "projects" : "developers";
  const previous = await db.prepare(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`).bind(entityId).first<Record<string, unknown>>();
  if (!previous) return fail("Record not found.", 404);
  if (Number(previous.revision || 1) !== Number(patch.revision)) return fail("This record has changed. Refresh before saving.", 409);
  delete patch.revision;
  const fields = Object.keys(patch);
  if (!fields.length) return fail("No valid changes supplied.");
  const values = fields.map((field) => patch[field]);
  const query = `UPDATE ${table} SET ${fields.map((field) => `${field} = ?`).join(", ")}, revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ?`;
  const createdAt = now();
  const result = await db.batch([
    db.prepare(query).bind(...values, now(), entityId, previous.revision),
    db.prepare("INSERT INTO admin_audit_logs (id, actor_id, action, entity_type, entity_id, previous_values, next_values, created_at) SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE changes() > 0")
      .bind(randomId("audit"), admin.id, `${entity}.updated`, entity, entityId, JSON.stringify(previous), JSON.stringify(patch), createdAt),
  ]);
  if (!result[0].meta.changes) return fail("This record has changed. Refresh before saving.", 409);
  return json({ ok: true, revision: Number(previous.revision) + 1 });
}

export async function handleAdmin(request: Request, env: AdminEnv, url: URL): Promise<Response> {
  try { return await adminOperation(request, env, url); }
  catch { return fail("Administration unavailable. No operation should be retried before checking its recorded status.", 503); }
}

async function adminOperation(request: Request, env: AdminEnv, url: URL): Promise<Response> {
  if (!configured(env)) return fail("MAS MAP Admin is not configured. Configure D1 and Cloudflare Access before enabling it.", 503);
  if (!["GET", "HEAD"].includes(request.method)) {
    if (request.headers.get("origin") !== url.origin || request.headers.get("sec-fetch-site") === "cross-site") return fail("Same-origin request required.", 403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) return fail("JSON required.", 415);
  }
  const isBootstrap = url.pathname === "/api/admin/bootstrap";
  if (isBootstrap) {
    if (request.method !== "POST") return fail("Method not allowed.", 405);
    const identity = await accessIdentity(request, env);
    if (!identity) return fail("Authentication required.", 401);
    if (!env.ADMIN_BOOTSTRAP_EMAIL || !env.ADMIN_BOOTSTRAP_NONCE || identity.email !== env.ADMIN_BOOTSTRAP_EMAIL.toLowerCase() || request.headers.get("x-admin-bootstrap-nonce") !== env.ADMIN_BOOTSTRAP_NONCE) return fail("Bootstrap authorization required.", 403);
    const existing = await env.DB.prepare("SELECT id FROM admin_users WHERE role = 'super_admin' LIMIT 1").first();
    if (existing) return fail("A Super Admin already exists.", 409);
    const userId = randomId("admin");
    await env.DB.batch([
      env.DB.prepare("INSERT INTO admin_users (id, email, display_name, role, status, created_at, updated_at) SELECT ?, ?, ?, 'super_admin', 'active', ?, ? WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE role = 'super_admin')").bind(userId, identity.email, identity.name, now(), now()),
      env.DB.prepare("INSERT INTO admin_audit_logs (id,actor_id,action,entity_type,entity_id,previous_values,next_values,created_at) SELECT ?,?,'super_admin.bootstrapped','admin_user',?,'{}',?,? WHERE changes() > 0").bind(randomId("audit"),userId,userId,JSON.stringify({email:identity.email}),now()),
    ]);
    return json({ ok: true });
  }

  const admin = await requireSuperAdmin(request, env);
  if (isResponse(admin)) return admin;
  const db = env.DB;
  if (url.pathname === "/api/admin/session" && request.method === "GET") return json({ user: { email: admin.email, name: admin.name, role: admin.role } });
  if (url.pathname === "/api/admin/overview" && request.method === "GET") {
    const [developers, projects, pending, recentlyUpdated, activity, review] = await db.batch([
      db.prepare("SELECT COUNT(*) AS count FROM developers"), db.prepare("SELECT COUNT(*) AS count FROM projects"), db.prepare("SELECT COUNT(*) AS count FROM project_change_requests WHERE status = 'pending_review'"),
      db.prepare("SELECT id, name, updated_at FROM projects ORDER BY updated_at DESC LIMIT 6"), db.prepare("SELECT action, entity_type, entity_id, created_at FROM admin_audit_logs ORDER BY created_at DESC LIMIT 8"),
      db.prepare("SELECT COUNT(*) AS count FROM projects WHERE last_verified_at IS NULL"),
    ]);
    return json({ metrics: { developers: developers.results[0]?.count || 0, projects: projects.results[0]?.count || 0, pending: pending.results[0]?.count || 0, review: review.results[0]?.count || 0 }, recentlyUpdated: recentlyUpdated.results, activity: activity.results });
  }
  if (url.pathname === "/api/admin/activity" && request.method === "GET") return json({ activity: (await db.prepare("SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 100").all()).results });
  const detail = url.pathname.match(/^\/api\/admin\/(projects|developers|change-requests)\/([a-zA-Z0-9_-]{8,80})$/);
  if (detail && request.method === "GET") {
    const table = detail[1] === "change-requests" ? "project_change_requests" : detail[1];
    const record = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(detail[2]).first();
    if (!record) return fail("Record not found.",404);
    const associated = detail[1] === "developers" ? (await db.prepare("SELECT id,name,status FROM projects WHERE developer_id = ? ORDER BY name").bind(detail[2]).all()).results : [];
    return json({ record, projects: associated });
  }
  if (url.pathname === "/api/admin/developers" && request.method === "GET") {
    const query = (url.searchParams.get("q") || "").slice(0, 120);
    const rows = await db.prepare("SELECT id, legacy_key, name, website, status, verified, revision, updated_at FROM developers WHERE name LIKE ? ORDER BY name LIMIT 100").bind(`%${query}%`).all();
    return json({ developers: rows.results });
  }
  if (url.pathname === "/api/admin/projects" && request.method === "GET") {
    const query = (url.searchParams.get("q") || "").slice(0, 120);
    const rows = await db.prepare("SELECT p.id, p.legacy_key, p.name, p.area, p.starting_price_aed, p.status, p.revision, p.updated_at, d.name AS developer FROM projects p LEFT JOIN developers d ON d.id = p.developer_id WHERE p.name LIKE ? OR d.name LIKE ? ORDER BY p.updated_at DESC LIMIT 100").bind(`%${query}%`, `%${query}%`).all();
    return json({ projects: rows.results });
  }
  if (url.pathname === "/api/admin/change-requests" && request.method === "GET") {
    const rows = await db.prepare("SELECT id, entity_type, entity_id, status, submitted_at, reviewed_at, review_reason FROM project_change_requests ORDER BY submitted_at DESC LIMIT 100").all();
    return json({ requests: rows.results });
  }
  const input = await body(request);
  if (!input) return fail("Invalid JSON input.");
  if (url.pathname === "/api/admin/projects" && request.method === "POST") {
    const patch = projectPatch(input); const developerId = id(input.developer_id); const name = cleanText(input.name);
    if (!patch || !name || !developerId) return fail("A valid project name and developer are required.");
    if (!await db.prepare("SELECT id FROM developers WHERE id = ?").bind(developerId).first()) return fail("Developer not found.", 400);
    const projectId = randomId("project"); const legacyKey = id(input.legacy_key) || projectId;
    await db.batch([
      db.prepare("INSERT INTO projects (id, legacy_key, name, developer_id, area, location, starting_price_aed, unit_types, payment_plan, expected_handover, construction_progress, status, images, brochure_url, last_verified_at, revision, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)").bind(projectId, legacyKey, name, developerId, patch.area ?? null, patch.location ?? null, patch.starting_price_aed ?? null, patch.unit_types ?? null, patch.payment_plan ?? null, patch.expected_handover ?? null, patch.construction_progress ?? null, patch.status || "draft", patch.images || "[]", patch.brochure_url ?? null, patch.last_verified_at ?? null, now(), now()),
      audit(db, admin.id, "project.created", "project", projectId, {}, patch),
    ]);
    return json({ id: projectId }, 201);
  }
  const projectMatch = url.pathname.match(/^\/api\/admin\/projects\/([a-zA-Z0-9_-]{8,80})$/);
  const developerMatch = url.pathname.match(/^\/api\/admin\/developers\/([a-zA-Z0-9_-]{8,80})$/);
  if (projectMatch && request.method === "PATCH") { const patch = projectPatch(input); return patch ? updateEntity(db, admin, "project", projectMatch[1], patch) : fail("Invalid project changes."); }
  if (developerMatch && request.method === "PATCH") { const patch = developerPatch(input); return patch ? updateEntity(db, admin, "developer", developerMatch[1], patch) : fail("Invalid developer changes."); }
  if (url.pathname === "/api/admin/change-requests" && request.method === "POST") {
    const entityType = input.entity_type === "project" || input.entity_type === "developer" ? input.entity_type : null;
    const entityId = id(input.entity_id);
    const proposedInput = input.proposed_changes;
    if (!proposedInput || typeof proposedInput !== "object" || Array.isArray(proposedInput)) return fail("Invalid change request.");
    const proposed = entityType === "project" ? projectPatch(proposedInput as Record<string, unknown>) : entityType === "developer" ? developerPatch(proposedInput as Record<string, unknown>) : null;
    if (!entityType || !entityId || !proposed) return fail("Invalid change request.");
    delete proposed.revision;
    if (!Object.keys(proposed).length) return fail("No permitted changes in request.");
    const table = entityType === "project" ? "projects" : "developers";
    const current = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(entityId).first<Record<string, unknown>>();
    if (!current) return fail("Target record not found.", 404);
    const requestedStatus = input.status === "draft" ? "draft" : "pending_review";
    const requestId = randomId("change"); const submittedAt = now(); await db.batch([
      db.prepare("INSERT INTO project_change_requests (id, entity_type, entity_id, proposed_changes, previous_values, base_revision, submitted_by, status, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(requestId, entityType, entityId, JSON.stringify(proposed), JSON.stringify(current), current.revision, admin.id, requestedStatus, submittedAt),
      audit(db, admin.id, `change_request.${requestedStatus === "draft" ? "drafted" : "submitted"}`, entityType, entityId, current, proposed),
    ]); return json({ id: requestId, status: requestedStatus }, 201);
  }
  const submit = url.pathname.match(/^\/api\/admin\/change-requests\/([a-zA-Z0-9_-]{8,80})\/submit$/);
  if (submit && request.method === "POST") {
    const submittedAt = now();
    const result = await db.batch([
      db.prepare("UPDATE project_change_requests SET status = 'pending_review', submitted_at = ? WHERE id = ? AND status = 'draft' AND submitted_by = ?").bind(submittedAt, submit[1], admin.id),
      db.prepare("INSERT INTO admin_audit_logs (id, actor_id, action, entity_type, entity_id, previous_values, next_values, created_at) SELECT ?, ?, 'change_request.submitted', entity_type, entity_id, '{}', '{\"status\":\"pending_review\"}', ? FROM project_change_requests WHERE id = ? AND changes() > 0").bind(randomId("audit"), admin.id, submittedAt, submit[1]),
    ]);
    if (!result[0].meta.changes) return fail("Draft change request not found or cannot be submitted.", 409);
    return json({ ok: true, status: "pending_review" });
  }
  const approval = url.pathname.match(/^\/api\/admin\/change-requests\/([a-zA-Z0-9_-]{8,80})\/(approve|reject)$/);
  if (approval && request.method === "POST") {
    const record = await db.prepare("SELECT * FROM project_change_requests WHERE id = ? LIMIT 1").bind(approval[1]).first<{ id: string; entity_type: "project" | "developer"; entity_id: string; proposed_changes: string; previous_values: string; base_revision: number; status: string }>();
    if (!record || record.status !== "pending_review") return fail("Change request is not pending review.", 409);
    const reason = cleanText(input.reason, 1000); if (reason === undefined) return fail("Invalid review reason.");
    if (approval[2] === "reject") {
      const rejectedAt = now();
      const result = await db.batch([
        db.prepare("UPDATE project_change_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, review_reason = ? WHERE id = ? AND status = 'pending_review'").bind(admin.id, rejectedAt, reason, record.id),
        db.prepare("INSERT INTO admin_audit_logs (id, actor_id, action, entity_type, entity_id, previous_values, next_values, created_at) SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE changes() > 0").bind(randomId("audit"), admin.id, "change_request.rejected", record.entity_type, record.entity_id, "{}", JSON.stringify({ reason }), rejectedAt),
      ]);
      if (!result[0].meta.changes) return fail("Change request is not pending review.", 409);
      return json({ ok: true, status: "rejected" });
    }
    const proposed = JSON.parse(record.proposed_changes) as Record<string, unknown>; const table = record.entity_type === "project" ? "projects" : "developers"; const fields = Object.keys(proposed).filter((field) => (record.entity_type === "project" ? projectFields : developerFields).includes(field as never));
    if (!fields.length) return fail("No permitted changes in request.");
    const update = `UPDATE ${table} SET ${fields.map((field) => `${field} = ?`).join(", ")}, revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ? AND EXISTS (SELECT 1 FROM project_change_requests WHERE id = ? AND status = 'pending_review' AND base_revision = ?)`;
    const approvedAt = now();
    const results = await db.batch([
      db.prepare(update).bind(...fields.map((field) => proposed[field]), approvedAt, record.entity_id, record.base_revision, record.id, record.base_revision),
      db.prepare("UPDATE project_change_requests SET status = 'approved', reviewed_by = ?, reviewed_at = ?, review_reason = ? WHERE id = ? AND status = 'pending_review' AND base_revision = ? AND changes() > 0").bind(admin.id, approvedAt, reason, record.id, record.base_revision),
      db.prepare("INSERT INTO admin_audit_logs (id, actor_id, action, entity_type, entity_id, previous_values, next_values, created_at) SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE changes() > 0").bind(randomId("audit"), admin.id, "change_request.approved", record.entity_type, record.entity_id, record.previous_values, JSON.stringify(proposed), approvedAt),
    ]);
    if (!results[1].meta.changes) return fail("The record changed after submission; approval was not applied.", 409);
    return json({ ok: true, status: "approved" });
  }
  return fail("Not found.", 404);
}

export async function requireAdminPage(request: Request, env: AdminEnv): Promise<Response | null> {
  try { const admin = await requireSuperAdmin(request, env); return isResponse(admin) ? admin : null; }
  catch { return fail("Administration unavailable.", 503); }
}
