# Antigravity UI → Melsou backend integration status

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

No user-owned Supabase project, Google OAuth client or Worker secrets were
provided. Therefore a genuine Google redirect, database insert, claim and
refresh cannot be run in this environment yet. Follow `GOOGLE_OAUTH_SETUP.md`;
then this package can be tested against those real services.

The Antigravity UI's freeform image uploads still require a separate migration
to the existing private R2 asset API. This is deliberately not faked by storing
photo binaries in localStorage or Postgres JSON.
