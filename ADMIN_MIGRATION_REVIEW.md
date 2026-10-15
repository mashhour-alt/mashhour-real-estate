# D1 foundation migration review

Reviewed baseline: GitHub `63455ca65a755a371e094b86ba68aa3272712805`.
Target: `mas-map-production`, ID `61674c0c-3880-4867-bcd3-f813b1176b74`, binding `DB`.

## Result

The unchanged migration works on isolated Cloudflare D1 (Wrangler 4.92.0 / Miniflare).
19 schema tests passed. It contains only one foreign-key PRAGMA, six CREATE TABLE
statements and five CREATE INDEX statements. No DROP, DELETE, UPDATE, ALTER, seed
rows, account credentials or public catalogue changes. Repeat execution preserves
an identical schema and existing fixture rows.

Production schema has NOT been inspected: Wrangler is unauthenticated and no
production SQL was authorized. The owner's earlier report that it is empty is not
an independent verification. Approval to create the schema is conditional on the
preflight inspection below. No production command in this document was executed.

## Scope and constraints

- Tables: admin_users, developers, projects, developer_accounts,
  project_change_requests, admin_audit_logs.
- Explicit indexes: idx_projects_developer, idx_projects_name,
  idx_developers_name, idx_change_requests_status, idx_audit_created.
  SQLite additionally creates internal UNIQUE/primary-key indexes.
- Project developer, developer account developer/user, request submitter/reviewer,
  and audit actor relationships use foreign keys. Deletion is restricted.
  Project developer updates cascade.
- Allowed roles, statuses, verified flags and construction progress are checked.
  Email uniqueness is case insensitive. Legacy keys are unique.
- All four request states and previous/proposed/reviewer/timestamp fields exist.
  Pending insertion never changes the project. Failed D1 batches roll back.

Database limitations must not be mistaken for security guarantees: polymorphic
request target IDs have no foreign key, reviewer Super Admin authorization and
legal state transitions rely on the Worker, review fields may be absent even
for approved rows, JSON text is not checked, prices/revisions lack positive
CHECK constraints, TEXT primary keys lack explicit NOT NULL, developer status
and verified may contradict, and audit rows are not database-enforced immutable.
These do not block creation of an empty foundation, but need review/hardening
and API security tests before administration activation. The 19 schema tests
are not authentication or end-to-end approval tests.

IF NOT EXISTS is safe for rerunning this exact schema; it does not validate or
repair a different pre-existing table/index definition. Stop if any named object
already exists with a different definition. No automatic DROP/recreate is safe.
This SQL file is executed explicitly and is not registered in D1's migration
history by `d1 execute`; do not mix execution procedures accidentally.

## Owner procedure (future production action)

Use the exact baseline checkout and installed dependencies. `npm run build`
generates `dist/server/wrangler.json`; confirm the DB ID above in that file.
Building is not deploying. Log into Wrangler using the owner account, without
putting tokens or credentials in Git. Confirm the database identity with:

```sh
npx wrangler d1 info mas-map-production --config dist/server/wrangler.json
```

First inspect the production schema, read-only, after this action is authorized:

```sh
npx wrangler d1 execute DB --config dist/server/wrangler.json --remote --command "SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY type,name;"
```

No Phase 1 application tables should exist for first execution. If any exist,
compare complete columns, CHECK clauses, foreign keys, indexes and row counts;
do not proceed based only on table names. Save a recovery bookmark and export
outside the repository before the write:

```sh
npx wrangler d1 time-travel info DB --config dist/server/wrangler.json --json
npx wrangler d1 export mas-map-production --config dist/server/wrangler.json --remote --output ../mas-map-before-admin.sql
```

Only after preflight and separate production-write authorization, run once:

```sh
npx wrangler d1 execute DB --config dist/server/wrangler.json --remote --file drizzle/0000_mas_map_admin_foundation.sql
```

Verify afterward using the read-only file (available locally with this audit),
or the individual queries it contains in the D1 Console:

```sh
npx wrangler d1 execute DB --config dist/server/wrangler.json --remote --file drizzle/verify_admin_foundation.sql
```

Expected: six table definitions, five explicit index definitions, foreign_key_check
returns no rows, correct column/foreign-key definitions, all six counts are zero.
No administrator account is created by this migration.

## Recovery

On failure stop; retain output and inspect the schema read-only before retrying.
Do not assume a partially applied file or an existing schema is identical.
Do not manually delete application tables as a recovery shortcut. If recovery
is needed, suspend all D1 writes and, with explicit owner authorization, restore
the saved bookmark using Cloudflare Time Travel:

```sh
npx wrangler d1 time-travel restore DB --config dist/server/wrangler.json --bookmark SAVED_PRE_MIGRATION_BOOKMARK
```

Restore overwrites the entire D1 database and discards subsequent writes. Keep the
bookmark returned by restore for undo. Time Travel retention depends on plan
(7 days Free / 30 days Paid); keep the exported backup securely as well.

References: https://developers.cloudflare.com/d1/sql-api/foreign-keys/
and https://developers.cloudflare.com/d1/reference/time-travel/.
