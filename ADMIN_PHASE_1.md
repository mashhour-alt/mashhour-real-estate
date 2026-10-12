# MAS MAP Admin — Phase 1 setup

The public site still reads the checked-in catalogue JSON. This is deliberate:
the admin database is not a parallel published source until its import and
cutover are independently validated.

## Required Cloudflare setup

1. Create a dedicated D1 database (for example `mas-map-admin-prod`) and bind
   it to the Worker as `DB`.
2. Execute `drizzle/0000_mas_map_admin_foundation.sql` against that database.
3. Create a Cloudflare Access application for `/admin*` and `/api/admin/*`.
   Restrict it to the approved Super Admin identity only.
4. Configure Worker secrets/variables, outside Git:

   - `ADMIN_ACCESS_TEAM_DOMAIN`
   - `ADMIN_ACCESS_AUD`
   - `ADMIN_BOOTSTRAP_EMAIL`
   - `ADMIN_BOOTSTRAP_NONCE` (random one-time value)

5. Sign in through Cloudflare Access and call `POST /api/admin/bootstrap` once,
   supplying the one-time nonce only through a secure admin client. Delete the
   bootstrap nonce and email variables immediately after the first Super Admin
   row is created.

The Worker validates the Access JWT itself. A forged identity header is not
accepted. All write APIs require an active `super_admin` row in D1.

## Data migration and safe cutover

1. Import the existing `public/data/project-catalog.json`,
   `project-live-data.json`, developer profiles and source metadata into D1.
2. Preserve a stable `legacy_key` for every imported developer/project and keep
   the raw input in `source_payload` for reconciliation.
3. Compare record counts, names, developers, coordinates, source IDs and
   published fields against the JSON files. Do not delete unmatched records.
4. Test all public routes against a staging Worker configured to read D1.
5. Add a feature flag for public reads and retain the JSON path as rollback.

Until step 5, approved admin changes update the D1 administration record and
audit trail only; they do **not** change the public Worker catalogue.

## Approval guarantees

- Draft/pending/approved/rejected requests are stored separately from records.
- Approval is restricted to Super Admin, uses the submission revision, and
  returns a conflict when the target changed after submission.
- Rejections do not modify the target record.
- Every administrative write is logged in `admin_audit_logs`.
- Developer Admin and Developer Staff exist only as future roles; no public
  registration or role-assignment endpoint is provided.
