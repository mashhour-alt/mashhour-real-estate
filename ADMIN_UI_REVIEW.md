# Super Admin interface review

Continues Draft PR #2 on admin/activation-review-20261015, based on
6f61056730525ed52e44092185829189dd4a8b80. Production main remains unchanged.

## Pages and API connections

- Overview: real D1 project/developer/pending counts, catalogue-sourced area count,
  recent changes/activity, quick actions, clear unactivated publication status.
  An unavailable area source returns null, not an invented zero.
- Projects: server-side name/developer/area search, status filtering, stable
  50-record pagination with totals, add/edit supported fields, price/location,
  payment plan/handover/progress, image URLs, brochure, verification timestamp.
  Changed-field saves preserve values not edited by the user and use revisions.
- Developers: search/status/pagination, name/website/verification editing, related
  project list. Account activation remains disabled.
- Approvals: search/status filtering within the latest 500 records, field-by-field
  previous/proposed comparison, submitter/reviewer identity, reason, draft submit,
  approve/reject through existing server-authorized operations.
- Activity: identity, action/entity/time, search/entity filter over the latest
  500 records, and full recorded action details.
- Settings: authenticated profile and server-reported Access/D1/publication/
  developer-account status; no secrets, AUD values or bootstrap values returned.

Arabic/English labels, RTL/LTR layout, narrow-screen menu, scoped warm-paper/navy/
gold styles, loading/empty/error/retry/success states, keyboard focus indicators,
skip link and native confirmation dialogs. Changes require confirmation before
save/approve/reject/submit. Existing public stylesheet/data remain untouched.

## Unsupported backend fields — displayed clearly, never silently submitted

Project description and availability are absent from the current schema.
Developer logo/profile description/contact email/contact phone are absent too.
The UI identifies these limitations. No schema migrations or fictitious records
were introduced to simulate these capabilities. Developer account management is
future activation; no role assignment or public registration was added.

## Validation

- npm test: production build plus both HTML/catalogue regressions pass.
- node tests/admin-security.test.mjs: 22 isolated JWT/D1 API checks pass, including
  settings secret exclusion, filters/totals, reviewer identities and area source.
- node tests/admin-schema.audit.mjs: 19 isolated schema checks pass.
- Changed-source ESLint: no errors; one advisory next/image logo warning.
- Full-project lint retains 29 pre-existing errors outside these changes.
- git diff --check passes. No changes to public catalogue, coordinates, ROI,
  language context, homepage, public projects/developer pages or globals.css.

## Preview and visual verification limitation

tests/admin-ui.test.mjs bundles the actual AdminPage and real LanguageProvider.
It supplies source-derived API fixtures only in a separate local test server.
The offline MAS_MAP_Admin_UI_Preview.html export embeds the same compiled UI,
styles and logo; every screen is marked LOCAL UI PREVIEW / NOT LIVE. Actions in
that file are simulated, and fixture identity is example.invalid. Neither the
fixture server nor an authentication bypass is part of the production Worker.

Generate the offline artifact:

    ADMIN_UI_EXPORT_ONLY=1 node tests/admin-ui.test.mjs

For browser checks, install Playwright (without changing package manifests) and
Chromium in a suitable local development environment, then run:

    npm install --no-save --package-lock=false playwright
    npx playwright install chromium
    node tests/admin-ui.test.mjs

The script covers 1440px desktop, 820px tablet, 390px mobile in Arabic and English,
RTL/LTR direction, horizontal overflow, table/editor/settings navigation,
confirmation dialog cancellation, runtime errors and screenshots.

Actual browser execution was BLOCKED in this environment: Chromium download
returned a corrupted archive, and the connected browser rejected terminal.local
with ERR_BLOCKED_BY_CLIENT. Six visual scenarios and screenshots are therefore
NOT VERIFIED. Do not report them as passed or substitute mock screenshots.
The offline artifact is a review preview, not proof of production functionality.

## Production boundaries

No PR merge, production deployment, production SQL, Access mutation or Super Admin
initialization. Existing server-side authorization is retained for every new
read endpoint. Public catalogue still reads JSON; edits do not reach it yet.
Backup, migration approval, authenticated Access verification, initial owner
bootstrap, full data reconciliation and publication cutover remain blockers.
