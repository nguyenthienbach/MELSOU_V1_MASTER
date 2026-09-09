# Implementation status — truthful handoff

## Implemented and locally verified

- Responsive brand landing UI with original product hero asset.
- Four-step template-first guest Studio with IndexedDB-backed local image drafts, opaque server-side guest draft sessions, 14-day scheduled expiry and idempotent account claim at checkout; eight templates, correct pricing modifiers, Twin 75% and 30,000 VND/shipment arithmetic.
- Cloudflare Worker configuration for static assets and API routes.
- Server-side quote algorithm with deterministic VND integer arithmetic.
- Authenticated project save endpoint using expected revision and an atomic database increment; concurrent stale saves receive a conflict instead of overwriting newer work.
- Private R2 upload/download endpoints with project authorization, magic-byte image allowlist, per-file/draft limits, opaque storage keys and checksum capture.
- Private R2 image-processing pipeline with decoder-backed validation, bounded retry state, metadata-free WebP Studio previews, metadata-free PNG render derivatives, deterministic object keys and renderer/preflight integration for JPEG, PNG, WebP and HEIC/HEIF inputs.
- SePay webhook handler that validates raw body HMAC, timestamp replay window, transaction shape and configured bank account before invoking an idempotent database RPC.
- Native username/password registration/login/logout/session persistence with slow salted verifiers, hashed opaque HttpOnly sessions, brute-force lockout/rate-limit hooks, optional verified-email linking/recovery and optional Google identity mapping; authenticated project creation/upload/sync and transactional order creation retain the immutable snapshot/payment/OWNER gates.
- Server-side preflight for pinned template slots, asset availability/quality, Spotify URL and complete print profile; test-covered as a blocking production gate.
- Supabase core schema for canonical projects, assets metadata, pricing versions, immutable production snapshots, orders, payment events and audit logs.
- Scheduled immutable-snapshot renderer that creates separate private cover/interior PDFs, an optional Spotify QR, a private prepress preview and a manifest from the selected locked template and print profile. Render jobs are claimed and completed through auditable database RPCs, and only then enter owner-only prepress review.
- Database-constrained Duo Sync (two people total), scheduled Google Drive archive worker and Google Sheets reporting worker. Both are server-side, archive/reporting-only consumers of the canonical Supabase outboxes.
- Safe public order tracking (status/carrier/tracking only, never customer or payment data), shipment-completion order finalization, and expiring per-slot Duo edit locks.
- Additive backend-completion migration for guest-session/claim replay records, ten-entry project checkpoints, template references, quotes, server-side carts, immutable order lines, explicit SePay payment attempts/expiry, safe order-event timelines, customer settings, addresses and OWNER-managed blog posts. Client-visible tables are RLS-enabled and privileged business RPCs are service-role only.
- API contracts for account project list/load, guest/account checkpoints, guest R2 upload/preview, checksum-deduplicated assets, cart upsert/removal, idempotent checkout, authenticated SePay/VietQR payment instructions, phone-verified tracking, public/published blog reads and OWNER-only blog writes.
- Customer order-history and address CRUD contracts, immutable shipment address snapshots, and an OWNER-only audited fulfilment state machine with independent Twin shipment completion.
- Private WebM/Ogg/MP4/WAV voice draft upload/playback, atomic `RECORD_ON_WEB`/`RECORD_AT_HOME` selection, version-safe re-record cancellation/commit, immutable order voice selection and bounded reference-aware R2 cleanup/archive.
- Payment simulation is explicit through `SEPAY_MODE=TEST`; it still requires the normal signed SePay webhook and can never manufacture a production `PAID` state. Payment expiry runs independently of optional Drive/Sheets credentials.
- Authenticated customer export streams real private cover/interior PDF artifacts only after the immutable order snapshot has rendered; raw `ALBUM_DATA` and JSON exports are not accepted as customer artifacts.
- Archive/reporting workers atomically claim bounded-retry jobs and use deterministic external idempotency markers (Drive app properties and the reporting outbox ID in Sheets) to recover from uncertain retries without uncontrolled duplicates.

## Deliberately not represented as complete

- Production approval remains blocked until the vendor provides the required physical print profile and a real print sample is signed off. The renderer already produces separate deterministic cover/interior PDFs, a Spotify QR when selected, a private preview and an immutable manifest from the frozen snapshot.
- Duo Sync invitation/realtime user interface and customer tracking history user interface.
- Deployment to a user-owned Cloudflare account, real Supabase migration run, or SePay Test Mode verification.
- Applying and integration-testing `202609080001_backend_completion.sql` and `202609080002_native_auth_voice.sql` against a real Supabase project; no local PostgreSQL/Supabase CLI is available in this workspace.
- Antigravity integration for IndexedDB-canonical offline document restore/checkpoint hooks, phone-verified tracking POST, server cart/project reopening, payment polling, blog and Settings screens. Backend contracts are documented in `BACKEND_INTEGRATION_CONTRACT.md`; presentation files were not changed.
- Cloudflare `API_RATE_LIMITER` binding with an owner-selected namespace. Production public tracking fails closed until it is configured.
- TOTP is not part of the current Product Owner update. Recovery cannot work for an account that has not linked and verified an email; the API returns `RECOVERY_EMAIL_REQUIRED` rather than pretending success.
- Native auth and web voice are implemented in backend contracts, but Antigravity still owns invoking the new username/password and voice hooks. Its proposed raw `ALBUM_DATA` export hook must still hand off an authenticated order ID and request the server-rendered PDF artifact.
- Verified-email link/recovery needs an owner-selected HTTPS email-delivery adapter. Production web-voice upload needs an HTTPS decoder/probe adapter plus the approved recording-duration and ISD1820 ingestion format; the Worker fails closed instead of trusting browser duration/container declarations alone.
- `TBD_PRINT_VENDOR` production profile and physical print sign-off.

These require either remaining implementation work or the user-owned external configurations listed in `PRODUCTION_SETUP.md`. Do not turn on paid orders before their documented go-live gates pass.
