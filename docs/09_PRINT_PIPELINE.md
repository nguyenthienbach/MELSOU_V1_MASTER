# Print and prepress pipeline

## Immutable input

When checkout creates an order, create an immutable production snapshot containing canonical document, template id/version, asset references/checksums, configured options, quote/price breakdown, selected print-profile identifier/revision and preflight result. Later project changes cannot affect the order. Render always uses snapshot + pinned template + pinned assets + profile revision, never “latest”.

## Profile and vendor gate

`print_profiles` must configure finished dimensions, bleed, safe margin, gutter warning, resolution/DPI, color profile, PDF requirements, cover construction and any vendor-specific constraints. Every production value is `TBD_PRINT_VENDOR` until confirmed by the actual vendor. Development preview values, if needed, must be clearly labelled non-production and cannot produce approvable output.

## Render flow

`PAID` → one durable `render_job` → authenticated server worker loads originals → high-resolution render → preflight/reproducibility checks → `cover_print.pdf`, `interior_spreads.pdf`, `preview.webp|jpg`, `order_manifest.json`, and vector/high-resolution QR when selected → private archive job → `PREPRESS_REVIEW`.

Browser renders only Studio/preview, never a production PDF. Repeated same snapshot/profile/assets must yield the same design. Embed/pin fonts and use deterministic renderer versions where possible. Production artifacts and web previews are separate. File names are machine-safe and use order code, not customer names.

## Preflight and approval

Preflight verifies slot completion, accessible assets, effective image resolution, text overflow, safe/gutter restrictions, QR validity/scannability and profile completeness. `BLOCKING_ERROR` prevents order/design lock; warnings are surfaced and captured. Only authenticated `OWNER` may approve `PREPRESS_REVIEW → PRODUCTION`, with an explicit confirmation and audit record. Owner may request rerender from the same snapshot but may not edit it silently. A render failure sets `RENDER_FAILED`, preserves diagnostic data safely, and is retryable/idempotent.
