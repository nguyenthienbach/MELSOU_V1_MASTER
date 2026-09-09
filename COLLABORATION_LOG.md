# Melsou collaboration log

This log prevents accidental overlap. Add the newest entry at the top.

## DONE — Codex — Product Owner auth and web-voice source-of-truth update

- **When / agent:** started 2026-09-08 — Codex
- **Files reserved:** `AGENTS.md`, `README.md`, `MELSOU_MASTER_PROMPT_V1.md`, `COLLABORATION_RULES.md`, `docs/01_PRODUCT_SPEC.md`, `docs/02_ARCHITECTURE.md`, `docs/03_DATABASE_SCHEMA.md`, `docs/04_AUTH_GUEST.md`, `docs/10_STORAGE_LIFECYCLE.md`, `docs/11_DUO_SYNC.md`, `docs/13_SECURITY_PRIVACY.md`, `docs/15_ACCEPTANCE_CRITERIA.md`, `docs/16_TESTING.md`, `docs/17_IMPLEMENTATION_PLAN.md`, `COLLABORATION_LOG.md`, `IMPLEMENTATION_STATUS.md`, `AUTH_INTEGRATION_STATUS.md`, `PRODUCTION_SETUP.md`, `.env.example`, `.dev.vars.example`, `BACKEND_INTEGRATION_CONTRACT.md`, `supabase/migrations/202609080002_native_auth_voice.sql`, `worker/index.mjs`, `worker/routes.test.mjs`, `worker/native-auth.mjs`, `worker/native-auth.test.mjs`, `worker/voice.mjs`, `worker/voice.test.mjs`, `worker/operations.mjs`, `worker/operations.test.mjs`, `worker/migration-contract.test.mjs`, `wrangler.jsonc`
- **Purpose:** replace the former Google-only/no-web-voice rules with secure username/password sessions, optional verified email recovery/linking, and private version-safe web voice persistence.
- **Result:** added a common application principal, unique normalized usernames, salted PBKDF2 password verifiers, hashed HttpOnly sessions, lockout/rate-limit gates, optional verified-email link/recovery, private validated voice drafts, atomic re-record/at-home selection, immutable order voice snapshots, safe cleanup/archive retries, and the corresponding Worker/UI handoff contracts.
- **Protected contracts:** preserve guest-first Studio, idempotent all-draft claim, OWNER/CUSTOMER authorization, private R2, immutable order snapshots, SePay/payment invariants, and all Antigravity presentation files.
- **Checks:** `npm run check` passed: Worker syntax, 68/68 backend tests, and syntax checks for the unchanged demo integration files. `git diff --check` and final UI-scope verification are recorded in the Product Owner handoff.
- **External gates:** real Supabase migration/RLS execution, Cloudflare rate-limit/R2 bindings, email delivery, production audio decode/probe and the approved ISD1820 duration/ingestion format require owner-controlled configuration or hardware validation.
- **Status:** DONE

## DONE — Codex — V1 backend completion and integration contracts

- **When / agent:** started 2026-09-08 — Codex
- **Files reserved:** `COLLABORATION_LOG.md`, `IMPLEMENTATION_STATUS.md`, `AUTH_INTEGRATION_STATUS.md`, `PRODUCTION_SETUP.md`, `.env.example`, `.dev.vars.example`, `worker/index.mjs`, `worker/routes.test.mjs`, `worker/operations.mjs`, `worker/operations.test.mjs`, `worker/renderer.mjs`, `worker/renderer.test.mjs`, `worker/image-processing.test.mjs`, `worker/backend-contracts.mjs`, `worker/backend-contracts.test.mjs`, `worker/migration-contract.test.mjs`, `supabase/migrations/202609080001_backend_completion.sql`, `BACKEND_INTEGRATION_CONTRACT.md`
- **Purpose:** complete the non-conflicting V1 database/API persistence, idempotent commerce, payment expectation, tracking, blog, account settings and Antigravity handoff contracts.
- **Result:** added the additive completion schema/RLS/service-only RPCs; Google-only guest claim, revision/checkpoint persistence, server cart/quotes/idempotent checkout, customer order/address APIs, immutable payment expectations, SePay expiry/mismatch resolution, audited Twin fulfilment, bounded render/archive/reporting claims, deterministic external retry markers, template/blog/account/tracking contracts and authenticated private PDF artifact downloads.
- **Protected contracts:** preserve Google-only guest-first checkout, locked 159k/219k/259k pricing, private asset IDs, SePay-only verified payment transitions, `ALBUM_DATA`, relative `/api/*` hooks and all Antigravity presentation files.
- **Blocked sub-scopes:** email/password auth, web voice/audio persistence and the pasted 119k/159k/199k prices conflict with `AGENTS.md` and `docs/01`, `04`, `07`, `15`; these will not be implemented without an owner-approved specification change.
- **Checks:** `npm run check` passed, including 57/57 Worker tests plus syntax checks for the Worker and existing demo integration files; final whitespace/UI-scope checks recorded in the task handoff.
- **External gates:** real Supabase migration/RLS execution, Google OAuth, R2/Images, SePay Test Mode, Drive/Sheets and the owner-selected Cloudflare rate-limit namespace require user-owned credentials/configuration; physical production remains blocked by `TBD_PRINT_VENDOR` and print sample approval.
- **Status:** DONE

## DONE — Codex — private R2 image-processing pipeline

- **When / agent:** started 2026-09-01 00:50 ICT; completed 2026-09-08 — Codex
- **Files changed:** `worker/index.mjs`, `worker/preflight.mjs`, `worker/preflight.test.mjs`, `worker/renderer.mjs`, `worker/renderer.test.mjs`, `worker/image-processing.mjs`, `worker/image-processing.test.mjs`, `supabase/migrations/202609010001_asset_processing.sql`, `wrangler.jsonc`, `IMPLEMENTATION_STATUS.md`, `PRODUCTION_SETUP.md`, `COLLABORATION_LOG.md`
- **Result:** decoder-validates JPEG/PNG/WebP/HEIC uploads, preserves private originals, creates deterministic metadata-free PNG render and WebP preview derivatives, retries through an auditable database queue, blocks non-ready assets at preflight and renders from normalized derivatives.
- **Protected contracts:** no Antigravity presentation files changed; `/api/*` remains relative with one additive authenticated preview route; `ALBUM_DATA` continues to store asset IDs only; originals and derivatives remain private in R2.
- **Checks:** focused image/preflight/renderer tests 16/16; `npm test` 31/31; `wrangler.jsonc` parses; `git diff --check` passes.
- **Known limitations:** migration and Images binding are not deployed in this workspace; real Cloudflare Images/R2 tests, including representative HEIC orientation/metadata validation, remain a production setup gate.
- **Status:** DONE

## DONE — Antigravity + Codex — agreement aligned

- **When / agent:** 2026-08-27 — Antigravity proposal acknowledged by Codex
- **Files changed:** `COLLABORATION_RULES.md`, `COLLABORATION_LOG.md`
- **Result:** aligned UI ownership (Canvas, 3D/page-flip, drag/drop, safe area,
  animation and responsive design) with Codex ownership (Supabase, OAuth,
  Worker, SePay, R2, PDF and tests).
- **Protected contracts:** keep `/auth-client.js`, the Google hooks,
  `MelsouAuth`, stable UI IDs and `/api/*`. Persist all JSON design geometry;
  store binary assets privately in R2 by asset ID.
- **Checks:** `npm test` remains the required 19/19 backend gate; changed UI
  must also be checked for browser console errors.
- **Status:** DONE

## IN PROGRESS template

- **When / agent:** YYYY-MM-DD HH:mm — Antigravity or Codex
- **Files reserved:** `path/to/file`
- **Purpose:** one sentence
- **Protected contracts:** hooks/API/data that will remain unchanged
- **Status:** IN PROGRESS

---

## DONE — Codex — shared-master setup

- **When / agent:** 2026-08-27 — Codex
- **Files changed:** `AGENTS.md`, `docs/00_INDEX.md`, `COLLABORATION_RULES.md`,
  `COLLABORATION_LOG.md`
- **Result:** created a shared collaboration protocol and ownership boundaries
  for this master folder.
- **Protected contracts:** Antigravity UI remains the presentation owner; Codex
  owns `demo/auth-client.js`, Worker and Supabase. Google hooks and `/api/*`
  contract are explicitly protected.
- **Checks:** required shared files verified after copying the master package.
- **Status:** DONE
