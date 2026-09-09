# Security and privacy requirements

## Authorization and secrets

Enforce RLS/ownership checks and server-side policy for all projects, assets, snapshots, orders, addresses, shipments, Duo rooms and owner functions. Use separate public and server credentials; never expose service role/R2/Drive/SePay secrets to a browser, logs, fixtures or commit. Validate redirects and protect OAuth/session flows against CSRF/fixation. Least privilege applies to service accounts/buckets.

## Input, endpoint and transport safety

Use TLS in production; schema-validate all requests; apply output encoding/sanitization for text; use allowlists for URL/Spotify parsing; restrict CORS/origins; rate-limit registration/login/recovery, guest creation, upload, invite, tracking and webhook endpoints. Passwords use a slow password KDF with unique random salts and never appear in DB rows, logs or responses; session/recovery/email-verification secrets are random and stored only as hashes. Do not log raw authorization headers, signed URLs, payment secrets, full PII, customer content or webhook credentials. Protect error displays from disclosing stack traces/internal keys.

## Assets and external events

Follow storage file validation rules in document 10 for images and voice recordings. Signed object URLs expire quickly and are scoped to a single authorized object/action. SePay callbacks must verify signature and be idempotent. Drive/Sheets sync uses server-only credentials and an outbox/retry pattern. QR content is restricted to valid supported Spotify URLs; render escaped data only.

## Privacy minimization

Collect only checkout/fulfilment data needed. PII stays in canonical DB with restricted access and is absent from storage keys/artifact names. Derived previews remove EXIF geolocation. Guest identifiers are opaque. Customer tracking exposes a minimum safe response. Deletion/trash/archive lifecycle must be auditable and deterministic. Before launch, document retention/privacy notice and validate applicable local legal obligations with the owner; do not fabricate compliance claims.
