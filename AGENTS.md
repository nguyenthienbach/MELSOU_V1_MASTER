# MELSOU ENGINEERING CONSTITUTION

## Authority and working rules

This is an engineering contract, not advisory text. Read it before changing code. The documents under `docs/` are the authoritative specification; when code conflicts with specification, fix code. If two authoritative specifications conflict, stop the affected work and report the conflict. Do not invent rules, secrets, vendor print values, or credentials.

When more than one agent works in this folder, also read `COLLABORATION_RULES.md` before editing. Its ownership boundaries and handoff protocol are mandatory unless the owner explicitly changes them.

Implement in small complete phases. A phase is done only after its relevant acceptance criteria and tests pass. Prioritize, in order: customer data integrity; payment and order correctness; print output correctness; security/authorization; Studio reliability; performance; visual polish. Preserve rollback capability and backwards compatibility. Do not commit secrets or ask an owner to put secrets in chat.

## Locked product rules

- Melsou sells 180° seamless layflat photo albums; the interior editor works in two-page spreads. Do not implement rings or perforation.
- Studio is guest-first: enter Studio, design, autosave, and see price without login. Prompt Google Sign-In only on **Continue to order**. No password, email OTP, or traditional registration in V1.
- There are only `OWNER` and `CUSTOMER` roles. Authorization is enforced on every server action/API; hiding UI is not authorization. Owner identity is configured, not client controlled.
- Guest may hold multiple drafts. Persist guest drafts for 14 days after last activity; recover them in the same browser/device; show the most recent as “currently editing.” On Google login, atomically and idempotently claim all drafts belonging to that guest session.
- Account drafts persist until customer deletion, then stay in trash for 30 days before cleanup. Keep at most 10 recent checkpoints per project; create checkpoints at Studio-step change, Preview, and before design lock.
- Canonical record = Supabase PostgreSQL. R2 = private hot working storage. Google Drive = production/long-term archive. Google Sheets = reporting only. A Drive or Sheets outage must not make checkout, ordering, or production state untruthful.
- V1 runs with incremental infrastructure cost at $0 where feasible, without coupling business logic to a provider.
- Studio is template-first, data-driven, slot-constrained, and versioned. Project document stores normalized geometry and asset IDs, never binary blobs or browser-pixel geometry. Pin `template_id` and `template_version`; never auto-migrate old projects.
- Eight V1 templates are fixed in `templates/`. Compatibility is `album_size + page_count`; style and occasion are discovery metadata. On template switch, remap compatible content and move surplus to `unplaced_content`; never discard it.
- Print geometry is config-driven. Any missing physical parameter is `TBD_PRINT_VENDOR`, never a guessed production value. Preview and PDF renderer must read the same canonical document/template source.
- No web voice recording or upload in V1. A Voice module is recorded by the customer after delivery. Do not build voice cloud storage, transcoding, upload, or Duo voice merge.
- Duo Sync is one canonical project, maximum two participants, realtime ephemeral presence plus expiring per-slot soft locks. Persist edits through the project revision model. Lock the room read-only while the owner has design locked/checkout in progress.
- Prices: Melody 159,000 VND; Voice 219,000 VND; Signature 259,000 VND. Shipping is 30,000 VND per shipment. Twin second copy is 75% of the configured first-copy amount. Prices must be data/config driven, versioned, and snapshotted onto an order.
- SePay is the sole V1 payment provider. Webhooks must be signature-verified, idempotent, and matched against an immutable order payment expectation. Payment mismatches require owner resolution and audit logging.
- Only OWNER may approve `PREPRESS_REVIEW -> PRODUCTION`. Customers and collaborators cannot alter production snapshots. Never silently modify an order snapshot; make a new project revision/snapshot instead.

## Security baseline

Use private R2 buckets and short-lived signed access only. Validate actual file type/magic bytes, size, dimensions, quota and authorization; accept only JPEG/JPG, PNG, WebP, HEIC/HEIF; reject SVG, archives, executables, HTML/JS, unknown binary and misleading extensions. Strip unnecessary metadata, especially EXIF geolocation, from derived previews. Do not put PII in storage paths. Rate-limit abuse-prone endpoints and audit sensitive owner actions.

## Required stop conditions

Stop only for a real secret/account authorization, a physical-print `TBD_PRINT_VENDOR` value needed for production correctness, an unsafe external-provider uncertainty, or a material spec conflict. State the exact blocker, where it belongs, what is already complete, and the exact next action. Do not stop merely because a phase ends.
