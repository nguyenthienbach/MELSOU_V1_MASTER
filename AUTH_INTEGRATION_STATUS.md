# Antigravity UI → Melsou backend integration status

## Product Owner auth update

Native `username + password` is now the canonical V1 account method. The Worker
implements register, login, hashed HttpOnly session restore/logout, password
change, 30-day username-change policy, optional verified email link and
verified-email-only recovery. Google OAuth is optional and maps to the same
application-principal model.

## Implemented in this package

- Preserved the latest Antigravity `demo/index.html` visual UI as the starting
  presentation layer.
- Added `demo/auth-client.js`, which calls the existing canonical Worker guest
  project APIs, performs real Supabase Google OAuth and claims the same guest
  draft once a verified Supabase session returns.
- Removed the UI's former localStorage-based account restore. A displayed user
  name now comes only from `Supabase.auth.getSession()`.
- Added debounced guest/account draft persistence with project revision checks.
  A stale write receives the backend conflict response rather than silently
  overwriting newer work.
- Replaced the UI's fake SePay success action. A customer cannot mark an order
  as paid; only the server-verified SePay webhook may do that.
- Updated the local preview server to serve `auth-client.js` and route `/api/*`
  into the canonical Worker for local checks.

## Still required from the owner

No user-owned Supabase project, email-delivery adapter or Worker secrets were
provided. Therefore the native migration/session/RLS path and recovery email
cannot be exercised against real services yet. Optional Google OAuth still
requires the setup in `GOOGLE_OAUTH_SETUP.md` if Product Owner enables it.

The Worker now exposes decoder-validated private R2 upload/preview routes for
both guest and authenticated projects, including checksum deduplication and
metadata-free derivatives. Antigravity still needs to hook the guest Studio
picker to those routes before checkout; until then its local image copy is an
offline-only UX cache, not durable server persistence. The main offline project
document must move from localStorage to IndexedDB as documented in
`BACKEND_INTEGRATION_CONTRACT.md`.

Antigravity may now connect `codexHandleNativeLogin({ username, password })`,
`codexHandleNativeRegister({ username, password })` and verified-email recovery
to the endpoints in `BACKEND_INTEGRATION_CONTRACT.md`. It must also add the
private voice draft/play/commit/cancel flow without putting audio blobs in
localStorage. `codexHandleExportDesign` still needs an authenticated order ID
and private server-rendered PDF artifact; raw `ALBUM_DATA` is not a final export.
