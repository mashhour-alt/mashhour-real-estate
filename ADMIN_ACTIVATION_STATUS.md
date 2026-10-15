# Admin activation review — 2026-10-15

Production main inspected through GitHub: 63455ca65a755a371e094b86ba68aa3272712805.
This review is source preparation, not an activated production administration.

## Verified

- V3's complete 9,512-line stylesheet remains byte-for-byte at the start of
  globals.css. Current stylesheet blob: b046e7f917b2a98d128a2e8603ef1bf13b4015e4.
- Public browser displays MAS MAP and 2,810 projects / 359 developers / 90 areas.
- No public catalogue, maps, ROI formulas, coordinates, aliases, language files,
  public components or public page source was modified.
- Generated production config contains DB -> mas-map-production ->
  61674c0c-3880-4867-bcd3-f813b1176b74. No second Wrangler config added to repo.
- Build and two production HTML/catalogue regression tests pass. The old test
  incorrectly required development-preview metadata in production HTML; it now
  checks title/stylesheet presence and absence of the development-only marker.
- 19 isolated D1 schema checks and 18 signed-JWT/D1 API integration checks pass.
  These test fixtures exist only in isolated local memory, not production.
- Full lint still has 29 pre-existing errors. Changed admin/API/tests have no
  lint errors; admin logo has one next/image advisory warning.

## Source repairs

- Correct Access JWT issuer format (no trailing slash), strict token/expiration/
  not-before checks, trusted team domain, domain-scoped JWKS cache and key refresh.
- Fix audit helper: D1 batch now receives statements, not Promises.
- Require same-origin JSON writes, reject dangerous URLs and invalid progress/
  project status, preserve numeric zero, handle missing schema as safe 503.
- Bootstrap owner identity + one-time secret still required; atomic conditional
  insert prevents a second bootstrap and records the event. Remove bootstrap
  email/nonce immediately after successful authorized production initialization.
- Exact /api/admin root is protected in addition to all /api/admin/* operations.
- Admin UI now opens project/developer details, edits supported metadata, creates
  projects, shows related projects, inspects old/proposed values, submits drafts,
  approves/rejects pending requests, and reads activity through authorized APIs.
- Dashboard review count uses projects without last_verified_at, not the pending
  change-request count. Admin CSS is isolated from public styles.

## Production facts that remain unverified

Wrangler has no authenticated Cloudflare session. Cloudflare dashboard browser
opens its sign-in page. No connected Cloudflare API tool is available.
No production backup/export, schema query, fresh bookmark, migration, Access
mutation, account bootstrap or Worker deployment was performed in this review.
The earlier owner-provided empty-schema inspection and bookmark are historical
evidence only. Do not present them as fresh backup evidence.

The public /admin browser probe timed out; current live Access redirects/AUD,
policy targets, public-path exclusions and authenticated admin UI are unverified.
The existence of the owner-created application/policy is reported by the owner.
Cloudflare docs support hostname/path protection for workers.dev. Keep the two
destinations in the same existing Access application/AUD; do not enable access
protection for the entire public Worker. Exact /admin and /api/admin paths and
their subpaths must be tested alongside public URLs after login.

Required non-secret values: ADMIN_ACCESS_TEAM_DOMAIN (bare team host),
ADMIN_ACCESS_AUD (existing application's AUD). Never guess them. Configure through
the existing build config after retrieval; privileged secrets belong in Worker
secrets. No secrets or production user credentials were generated here.

## Data integration blocker and safe strategy

The site still reads checked-in JSON. Current D1 edits do not publish to it.
There is intentionally no empty-D1 cutover. The updated dashboard says so.
Availability/unit inventory is not in the foundation's project schema; no
availability editing or public publication is claimed.

Catalogue preflight found 54 projects with no developer value, and 353 distinct
project developer names absent from the 359-record developer directory. The
current projects.developer_id is NOT NULL, so a complete faithful import cannot
proceed unchanged. Preserve missing values; never invent a placeholder developer.

Before public integration:
1. Obtain production schema/backup evidence, confirm which migrations (if any)
   have actually run, and prepare the appropriate nullable-relation/metadata
   migration for explicit review. Do not rewrite an applied migration silently.
2. Derive stable IDs from exact legacy keys; retain source IDs, raw source JSON,
   URLs, aliases, coordinates and null fields. Build developer relationships from
   actual source names with provenance; do not invent ratings or directory rows.
3. Generate import SQL offline and validate every one of 2,810 projects,
   359 public developer directory records and 90 areas. Reconcile missing names
   without changing the public directory counts. Never delete unmatched records.
4. Stage the import and compare complete public catalogue/live/enrichment outputs,
   filters, route keys, language layouts and maps before permitting public reads.
5. Wire every relevant public read to approved published data, keeping requests
   separate. Test pending/rejected changes remain invisible, approval changes
   only intended fields, and stale approvals never overwrite newer records.
6. Only then request approval for production import/cutover and deployment.
   Keep an explicit rollback to the preserved JSON/catalogue and prior Worker.

## Backup and approval sequence

`scripts/admin-production-backup.mjs` prepares a read-only preflight/export once
owner Cloudflare authentication is securely available. Supply the verified account
ID through CLOUDFLARE_ACCOUNT_ID and an output folder outside the repository.
It verifies the exact database UUID/name, exports SQL, records schema/bookmark and
SHA-256 manifest. The backup script itself has not run against production.
An export still needs isolated local restore/schema comparison and an independent
owner-controlled copy before migration approval. Empty SQL cannot remove newly
created tables; returning to an empty database uses the pre-change Time Travel
bookmark with explicit authorization, since restore overwrites the entire DB.

After that evidence exists, present one concrete approval checkpoint identifying
exact SQL hashes, backup path/hash/restore results, fresh bookmark, owner identity,
existing Access domain/AUD, bootstrap cleanup and exact Worker version. Migration,
bootstrap and production deployment remain separate approval scopes. Do not ask
for approval to run unseen SQL or claim this source branch is production-ready.

Source fixes are published on an isolated review branch; main is left unchanged
to avoid the historical main-to-Cloudflare automatic deployment trigger.
