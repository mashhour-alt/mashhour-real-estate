-- MAS MAP Admin Phase 1. Apply to a dedicated Cloudflare D1 database only.
-- Public routes continue reading the existing JSON catalogue until the import,
-- reconciliation and public-read cutover are explicitly completed.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'developer_admin', 'developer_staff')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS developers (
  id TEXT PRIMARY KEY,
  legacy_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN ('verified', 'unverified', 'suspended')),
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
  source_payload TEXT NOT NULL DEFAULT '{}',
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  legacy_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  developer_id TEXT NOT NULL REFERENCES developers(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  area TEXT,
  location TEXT,
  starting_price_aed REAL,
  unit_types TEXT,
  payment_plan TEXT,
  expected_handover TEXT,
  construction_progress REAL CHECK (construction_progress IS NULL OR (construction_progress >= 0 AND construction_progress <= 100)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
  images TEXT NOT NULL DEFAULT '[]',
  brochure_url TEXT,
  last_verified_at TEXT,
  source_payload TEXT NOT NULL DEFAULT '{}',
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS developer_accounts (
  id TEXT PRIMARY KEY,
  developer_id TEXT NOT NULL REFERENCES developers(id) ON DELETE RESTRICT,
  admin_user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('developer_admin', 'developer_staff')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'suspended')),
  created_at TEXT NOT NULL,
  UNIQUE (developer_id, admin_user_id)
);

CREATE TABLE IF NOT EXISTS project_change_requests (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'developer')),
  entity_id TEXT NOT NULL,
  proposed_changes TEXT NOT NULL,
  previous_values TEXT NOT NULL,
  base_revision INTEGER NOT NULL,
  submitted_by TEXT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')),
  submitted_at TEXT NOT NULL,
  reviewed_by TEXT REFERENCES admin_users(id) ON DELETE RESTRICT,
  reviewed_at TEXT,
  review_reason TEXT
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  previous_values TEXT NOT NULL,
  next_values TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_developers_name ON developers(name);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON project_change_requests(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs(created_at DESC);
