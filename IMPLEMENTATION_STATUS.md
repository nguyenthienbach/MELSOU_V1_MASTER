# Implementation status — truthful handoff

## Implemented and locally verified

- Responsive brand landing UI with original product hero asset.
- Four-step template-first guest Studio with IndexedDB-backed local image drafts, opaque server-side guest draft sessions, 14-day scheduled expiry and idempotent Google-account claim at checkout; eight templates, correct pricing modifiers, Twin 75% and 30,000 VND/shipment arithmetic.
- Cloudflare Worker configuration for static assets and API routes.
- Server-side quote algorithm with deterministic VND integer arithmetic.
- Authenticated project save endpoint using expected revision and an atomic database increment; concurrent stale saves receive a conflict instead of overwriting newer work.
- Private R2 upload/download endpoints with project authorization, magic-byte image allowlist, per-file/draft limits, opaque storage keys and checksum capture.
- Private R2 image-processing pipeline with decoder-backed validation, bounded retry state, metadata-free WebP Studio previews, metadata-free PNG render derivatives, deterministic object keys and renderer/preflight integration for JPEG, PNG, WebP and HEIC/HEIF inputs.
- SePay webhook handler that validates raw body HMAC, timestamp replay window, transaction shape and configured bank account before invoking an idempotent database RPC.
- Google-only sign-in at checkout, authenticated project creation/upload/sync and transactional order creation with immutable project snapshot, order-code sequence, authoritative quote, Twin shipments, a hard print-profile gate and OWNER-only prepress approval.
- Server-side preflight for pinned template slots, asset availability/quality, Spotify URL and complete print profile; test-covered as a blocking production gate.
- Supabase core schema for canonical projects, assets metadata, pricing versions, immutable production snapshots, orders, payment events and audit logs.
- Scheduled immutable-snapshot renderer that creates separate private cover/interior PDFs, an optional Spotify QR, a private prepress preview and a manifest from the selected locked template and print profile. Render jobs are claimed and completed through auditable database RPCs, and only then enter owner-only prepress review.
- Database-constrained Duo Sync (two people total), scheduled Google Drive archive worker and Google Sheets reporting worker. Both are server-side, archive/reporting-only consumers of the canonical Supabase outboxes.
- Safe public order tracking (status/carrier/tracking only, never customer or payment data), shipment-completion order finalization, and expiring per-slot Duo edit locks.

## Deliberately not represented as complete

- Production approval remains blocked until the vendor provides the required physical print profile and a real print sample is signed off. The renderer already produces separate deterministic cover/interior PDFs, a Spotify QR when selected, a private preview and an immutable manifest from the frozen snapshot.
- Duo Sync invitation/realtime user interface and customer tracking history user interface.
- Deployment to a user-owned Cloudflare account, real Supabase migration run, or SePay Test Mode verification.
- `TBD_PRINT_VENDOR` production profile and physical print sign-off.

These require either remaining implementation work or the user-owned external configurations listed in `PRODUCTION_SETUP.md`. Do not turn on paid orders before their documented go-live gates pass.
