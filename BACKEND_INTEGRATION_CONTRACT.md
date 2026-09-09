# Melsou V1 backend integration contract

This handoff describes the current Codex API surface for Antigravity. Product and
security rules remain authoritative in `AGENTS.md` and `docs/`; this document does
not override them. All browser calls use relative `/api/*` paths and
`credentials: "include"`. Native sessions use the HttpOnly
`melsou_session_v1` cookie; optional Google-authenticated calls add
`Authorization: Bearer <Supabase access token>`.

## Locked boundaries

- V1 remains guest-first. Canonical account auth is unique normalized
  `username + password`; email is optional and Google OAuth is additive.
- Prices are server-owned: Basic (`MELODY`) 119,000; Premium (`VOICE`) 159,000; Signature 199,000 VND.
- Voice customers choose `RECORD_ON_WEB` (private recording upload) or
  `RECORD_AT_HOME` (no upload).
- Project JSON contains normalized design data and asset IDs only. Never send a
  `data:` URL, `blob:` URL, `File`, `Blob`, image bytes or audio bytes in JSON.
- UI loading text, components and presentation remain Antigravity-owned. The
  state names below are behavioral requirements, not prescribed copy.

## Shared response behavior

Successful JSON responses use the shapes below. Failures use
`{ "error": "STABLE_ERROR_CODE", ...optionalContext }`. Treat `401` as signed
out, `403` as insufficient role, `404` as unavailable to this caller, `409` as a
state/revision conflict, `413` as a size/quota limit, `415` as invalid image,
`429` as rate-limited and `503` as a configured dependency unavailable. While a
request is pending, disable only its duplicate action; never discard the local
draft. Retry `503`/network failures with bounded backoff. Do not blindly retry a
`409` without loading the current state.

## Auth and session

| Function | Requirement | Result / errors | UI state |
|---|---|---|---|
| `window.codexHandleNativeRegister({ username, password })` | Guest/signed out | `POST /api/auth/native/register`; `201 { user }`, sets HttpOnly session; `USERNAME_TAKEN`, `INVALID_USERNAME`, `INVALID_PASSWORD`, `RATE_LIMITED` | `registering`, then `signed_in` |
| `window.codexHandleNativeLogin({ username, password })` | Guest/signed out | `POST /api/auth/native/login`; `{ user }`, sets HttpOnly session; `INVALID_CREDENTIALS`, `ACCOUNT_TEMPORARILY_LOCKED`, `RATE_LIMITED` | `authenticating`, then `signed_in` |
| `window.codexHandleForgotPassword({ email })` | Account with verified linked email | `POST /api/auth/recovery/request`; `202 RECOVERY_EMAIL_SENT` (also for unknown email to prevent enumeration) | `requesting`, then `email_sent` |
| `POST /api/auth/recovery/complete` | Valid emailed token | `{ token, newPassword }` → `{ reset: true }`; revokes sessions | `resetting`, then require login |
| `POST /api/auth/native/logout` | Native session | `{ signedOut: true }`, revokes server session and clears cookie | `signing_out`, `signed_out` |
| `window.codexHandleGoogleSignIn()` | Optional | Starts configured Supabase Google OAuth | `authenticating`, then redirect |
| `POST /api/guest/projects/claim` | Native cookie or Google bearer + guest cookie | `{ projects: [...] }`; replay returns the same claimed set | Keep local draft until success |

The recovery request also accepts `{ username }` only to let an already-known
account surface `409 RECOVERY_EMAIL_REQUIRED` when no verified email was ever
linked. Recovery by email never reveals whether an arbitrary address exists.

Auth failure or OAuth callback replay must return to the same browser draft. Keep the
opaque HttpOnly guest cookie untouched except through server responses. Do not
derive account state from localStorage.

Usernames are 3–32 normalized lowercase ASCII characters using letters,
numbers, `.`, `_` or `-`. Passwords are 12–128 characters with at least one
letter and number. The Worker derives a PBKDF2-HMAC-SHA-256 verifier with a
unique salt and 100,000 iterations (the Cloudflare Workers runtime maximum); plaintext passwords and raw session tokens
are never stored. Username change requires the current password and has a
30-day cooldown.

## Project, autosave and checkpoints

`GET /api/templates?size=A5_PORTRAIT&pages=12` returns `{ templates }` from the
same immutable repository JSON consumed by the renderer. `GET
/api/templates/:templateId?version=1` returns `{ template }`. Use these
definitions for compatibility, slots and constraints; do not maintain a second
UI-only template model.

| Endpoint | Method/auth | Request | Response / important errors |
|---|---|---|---|
| `/api/guest/projects` | `GET`, guest cookie | — | `{ projects: [...] }` most-recent first |
| `/api/guest/projects` | `POST`, guest cookie | `{ title, document }` | `201 { project }` |
| `/api/guest/projects/:id` | `PUT`, guest cookie | `{ expectedRevision, document }` | `{ project: { id, revision } }`; `REVISION_CONFLICT` |
| `/api/guest/projects/:id/checkpoints` | `POST`, guest cookie | `{ reason: STEP_CHANGE\|PREVIEW\|DESIGN_LOCK }` | `201 { checkpoint }` |
| `/api/projects` | `GET`, bearer | — | `{ projects: [...] }` |
| `/api/projects` | `POST`, bearer | `{ title, document }` | `201 { project }` |
| `/api/projects/:id` | `GET`, bearer | — | `{ project }` for owner or active Duo editor |
| `/api/projects/:id` | `PUT`, bearer | `{ expectedRevision, document }` | `{ project: { id, revision } }`; `REVISION_CONFLICT` |
| `/api/projects/:id` | `DELETE`, bearer/owner | — | Moves the project to 30-day trash; does not hard-delete |
| `/api/projects/:id/restore` | `POST`, bearer/owner | — | Restores an unexpired trashed project |
| `/api/projects/:id/checkpoints` | `POST`, bearer | Same checkpoint request | `201 { checkpoint }` |

Debounce ordinary saves. Create checkpoints only on Studio step change, Preview
and before design lock. The server retains the newest ten. The browser offline
copy belongs in IndexedDB. On reconnect, compare the local expected revision to
the server revision and surface a conflict/rebase path; never overwrite silently.

Current Antigravity dependency: `demo/app.js` still restores the main draft from
`localStorage`. Move the durable offline document to IndexedDB and use
localStorage, if retained, only for small non-canonical bridge identifiers. Codex
does not change this presentation-owned file.

## Assets

| Endpoint | Method/auth | Request | Response / states |
|---|---|---|---|
| `/api/guest/projects/:id/assets` | `POST`, guest cookie | Raw image body and honest `Content-Type` | `201 { asset }` or `200 { asset, duplicate: true }` |
| `/api/projects/:id/assets` | `POST`, bearer | Same | Same |
| `/api/guest/assets/:id/preview` | `GET`, guest cookie | — | Private WebP bytes when `READY`; `ASSET_PREVIEW_NOT_READY` |
| `/api/assets/:id/preview` | `GET`, bearer | — | Private WebP bytes when `READY` |
| `/api/assets/:id` | `GET`, bearer | — | Authorized private original bytes |

Accepted inputs: JPEG, PNG, WebP and HEIC/HEIF after magic-byte and decoder
validation. Maximum one file is 8 MB; a draft is limited to 40 images/150 MB.
Persist the returned asset ID in `content_bindings`. Poll preview only while the
asset has `PENDING`/`PROCESSING`; show a retry action for `FAILED`. Derivatives
strip metadata/GPS and originals remain private.

## Voice persistence

Upload the finalized `Blob` as the raw request body; never place it in
`ALBUM_DATA` or localStorage. Required headers are the honest `Content-Type` and
`X-Melsou-Voice-Duration-Ms`. Production also requires configured
`VOICE_MAX_DURATION_SECONDS`.

| Endpoint | Method/auth | Request | Response / states |
|---|---|---|---|
| `/api/guest/projects/:id/voice-assets` | `POST`, guest cookie | Raw WebM/Ogg/MP4/WAV bytes | `201 { voiceAsset }`; status `DRAFT` |
| `/api/projects/:id/voice-assets` | `POST`, native cookie or Google bearer | Same | Same |
| `/api/guest/projects/:id/voice` | `POST`, guest cookie | `{ expectedRevision, voiceMode, voiceAssetId? }` | Atomically commits `RECORD_ON_WEB` or `RECORD_AT_HOME`; `REVISION_CONFLICT` |
| `/api/projects/:id/voice` | `POST`, authenticated | Same | Same |
| `/api/guest/voice-assets/:id`, `/api/voice-assets/:id` | `GET`, authorized | — | Private audio bytes, `no-store` |
| Same asset URLs | `DELETE`, authorized uploader | — | Cancels only an uncommitted re-record draft and queues cleanup |

Re-record flow: retain the current project voice, upload a new `DRAFT`, and
commit it only after playback confirmation. Cancel deletes only the draft via a
retryable cleanup job. Commit increments the project revision and queues the
superseded object for cleanup. Cleanup never deletes an asset referenced by
`order_voice_selections`. Checkout snapshots the exact voice metadata/storage
reference, or the explicit `RECORD_AT_HOME` choice. Only one uncommitted voice
draft may exist per project, preventing abandoned concurrent recordings from
growing storage without bound.

## Quote, cart and checkout

| Endpoint | Method/auth | Request | Response / errors |
|---|---|---|---|
| `/api/quote` | `POST`, public | `{ packageCode, size, pages, twin, shipments }` | `{ quote, pricingVersion }`; never send/display a client total as authoritative |
| `/api/cart` | `GET`, bearer | — | `{ cart: { id, status, cart_items } }` |
| `/api/cart/items` | `POST`, bearer | `{ projectId, configuration }` | `{ cart }`; upserts one item per project |
| `/api/cart/items/:projectId` | `DELETE`, bearer | — | `{ removed: boolean }` |
| `/api/orders` | `GET`, authenticated | — | `{ orders }` newest first, including the safe voice mode/metadata but never its storage key |
| `/api/orders` | `POST`, bearer | `{ projectId, configuration, shipments }`; preferably header `Idempotency-Key` (16–128 safe characters) | `201 { order }`; deterministic fallback protects the current UI; `PREFLIGHT_BLOCKING_ERROR`, `PRINT_PROFILE_NOT_READY` |
| `/api/orders/:id` | `GET`, authenticated | — | `{ order }` with safe shipment/status/voice selection data; no voice storage key |
| `/api/orders/:id/artifacts/cover` | `GET`, bearer/customer | — | Streams the completed private cover PDF as an attachment; `EXPORT_NOT_READY` |
| `/api/orders/:id/artifacts/interior` | `GET`, bearer/customer | — | Streams the completed private interior PDF as an attachment; `EXPORT_NOT_READY` |

Changing package calls cart upsert again with the full new configuration. Replace
the previous value; do not merge package-specific client state. A checkout retry
must reuse its idempotency key. Server quote, production snapshot, payment
expectation and order line are immutable once created.

The proposed `window.codexHandleExportDesign(ALBUM_DATA)` must not export raw
JSON or generate a production PDF in the browser. The backend contract requires
an authenticated, paid order rendered from its immutable snapshot. Antigravity
should persist/checkpoint the document, keep the resulting `orderId`, and use
one of the authenticated PDF artifact endpoints above once render is complete.
Changing the hook input from raw `ALBUM_DATA` to an order/artifact reference is
a required presentation-layer handoff.

## Customer addresses

`GET /api/addresses` lists only the signed-in customer's addresses. `POST
/api/addresses` accepts `{ label, recipient, phone, address, isDefault? }`.
`PATCH /api/addresses/:id` accepts the same fields partially, and `DELETE
/api/addresses/:id` returns `{ removed }`. Default-address replacement is
atomic; order shipment addresses remain immutable snapshots and never follow a
later account-address edit.

## SePay/VietQR

| Endpoint | Method/auth | Request | Response / states |
|---|---|---|---|
| `/api/orders/:id/payment` | `GET`, bearer/customer | — | `{ order, payment: { provider, mode, amount, currency, transferContent, bankCode, accountNumber, accountName, expiresAt, qrImageUrl } }` |
| `/api/sepay/webhook` | `POST`, SePay HMAC | Raw JSON plus `X-SePay-Signature` and `X-SePay-Timestamp` | `{ success: true }` only after durable dedupe/process |

`payment.mode` is explicitly `TEST` or `LIVE`. Test Mode still follows the real
verified webhook path; frontend code must never manufacture `PAID`. Poll the
authenticated order endpoint for `AWAITING_PAYMENT`, `PAID`, `PAYMENT_EXPIRED`
or `PAYMENT_MISMATCH`. Wrong amount, wrong configured account, late payment or
ambiguous reference never auto-approves.

OWNER resolution uses `POST /api/owner/orders/:id/payment-resolution` with
`{ resolution: "MARK_PAID"|"CANCEL", note }`. The note is mandatory, the action
is audited, and `MARK_PAID` enqueues render through the same database trigger as
an exact webhook payment.

Owner fulfilment uses `POST /api/owner/orders/:id/fulfillment`. Send
`{ status: "READY_TO_SHIP", note }` after production, or a shipment-scoped
`{ sequence, status: "SHIPPING"|"COMPLETED"|"DELIVERY_FAILED", carrier?,
trackingCode?, trackingUrl?, note }`. Dispatch requires carrier and tracking
code. The database derives the order state, completes a Twin order only after
both shipments complete, and audits every transition.

## Safe public tracking

`POST /api/tracking` with `{ orderCode, phone }` returns
`{ order: { orderCode, status, timeline, shipments } }`. It never returns name,
address, email, price, payment payload, assets or design. `404 ORDER_NOT_FOUND`
is also used for a wrong phone. Handle `429 RATE_LIMITED` with a cooldown.

Current Antigravity dependency: the existing code-only `GET /api/tracking/:code`
is intentionally rejected with `TRACKING_VERIFICATION_REQUIRED`. Add a phone
field and switch to the POST contract above.

## Blog

| Endpoint | Method/auth | Request | Response |
|---|---|---|---|
| `/api/blog` | `GET`, public | — | `{ posts }`, published only |
| `/api/blog/:slug` | `GET`, public | — | `{ post }`, published only |
| `/api/blog/:slug/cover` | `GET`, public | — | Short-cache WebP only for a published post |
| `/api/owner/blog` | `GET`, OWNER | — | `{ posts }`, all states |
| `/api/owner/blog` | `POST`, OWNER | `{ slug?, title, excerpt?, content, coverAssetId?, category?, tags?, status? }` | `201 { post }` |
| `/api/owner/blog/:id` | `PUT`, OWNER | Partial fields | `{ post }` |
| `/api/owner/blog/:id` | `DELETE`, OWNER | — | Archives; does not hard-delete |

Statuses are `DRAFT`, `PUBLISHED`, `ARCHIVED`. Treat `content` as untrusted text
and escape/sanitize in the renderer. Never show owner controls based only on a
client flag; the API enforces OWNER.

## Account settings

`GET /api/account` returns `{ profile, auth: { provider, username, email,
emailVerified } }`.
`PATCH /api/account` accepts `{ displayName?, notifications? }`, where supported
notification keys are `orderUpdates`, `paymentUpdates`, `productionUpdates` and
`marketing`, all booleans. It never accepts `role`.

- `POST /api/account/username` accepts `{ username, password }`; current
  password is mandatory and the 30-day cooldown is enforced.
- `POST /api/account/password` accepts `{ currentPassword, newPassword }` and
  revokes every native session after success.
- `POST /api/account/email/link` accepts `{ email }`, sends verification through
  the configured server-side delivery adapter, and does not link before proof.
- `POST /api/account/email/verify` accepts `{ token }` and consumes it once.

## Spotify

Persist Spotify only as project JSON:
`options.spotify_enabled` and an HTTPS `options.spotify_url` under
`open.spotify.com/(track|album|playlist)/...`. Optional UI metadata may include
title, artist, track ID/URI, artwork URL and `selectedAt`, but playback/streaming
is not a backend responsibility. No client secret is exposed. A future search
proxy needs separately approved Spotify credentials and rate limiting.

## Deployment-only dependencies

- Apply all migrations through `202609080002_native_auth_voice.sql`.
- Configure `OWNER_USER_ID`; Google provider/redirect allowlist is optional.
- Configure `AUTH_EMAIL_DELIVERY_URL`, `AUTH_EMAIL_DELIVERY_TOKEN` and
  `APP_BASE_URL` before enabling email link/recovery.
- Configure `VOICE_MAX_DURATION_SECONDS` from the approved hardware workflow.
- V1 currently uses the private Supabase Storage bucket `melsou-assets`; only the Worker service role accesses objects. Bind Images as `IMAGES` for validated, metadata-free image derivatives. The Worker keeps an internal R2-compatible object interface so storage can be changed later without changing browser contracts.
- Configure an `API_RATE_LIMITER` Cloudflare Rate Limiting binding before
  production tracking is enabled.
- Set `SEPAY_MODE=TEST` for course/demo verification or `LIVE` only after go-live
  approval; set bank fields and the HMAC webhook secret in server configuration.
- V1 checkout ends at confirmed payment/order and does not require a print-vendor profile. Any future print/prepress workflow must independently require approved vendor values.
  and a physical sample are approved.
- Configure Drive/Sheets credentials for scheduled archive/reporting. Archive
  files use deterministic Drive `appProperties`; reporting writes the outbox ID
  as column A so uncertain retries can detect an already completed side effect.
