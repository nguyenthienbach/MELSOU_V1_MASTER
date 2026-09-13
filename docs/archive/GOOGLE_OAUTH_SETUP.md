# Google Sign-In — setup required before the flow can be tested

The source now contains the real OAuth handoff. It intentionally does **not**
invent an account when configuration is absent. Complete these settings in the
user-owned accounts before testing login.

1. Create a Supabase project and run every SQL migration in `supabase/migrations`
   in filename order. The database is the canonical project/order store.
2. In Google Cloud Console, configure the OAuth consent screen and create an
   **OAuth client ID → Web application**. In its authorised redirect URIs add:
   `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
   (use the equivalent callback for a configured Supabase custom auth domain).
3. In Supabase Dashboard, open **Authentication → Providers → Google**, enable
   Google and paste that Client ID and Client Secret there. Do not put the Client
   Secret in this repository, the browser, or chat.
4. In **Authentication → URL Configuration**, set Site URL to the production
   Melsou URL. Add both the production URL and the local preview URL
   (`http://127.0.0.1:3000`) to the permitted redirect URLs while testing.
5. In Cloudflare Worker, set these secrets/variables:

   ```powershell
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_ANON_KEY
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   ```

   `SUPABASE_SERVICE_ROLE_KEY` must remain Worker-only. The anon key is exposed
   only through `/api/public-config` for the browser OAuth client and is safe
   only because Supabase Row Level Security remains enabled.
6. Deploy the Worker + static assets, then test: edit a guest draft → click
   Google → complete Google consent → return to the same URL → refresh. The
   account must remain logged in and the draft must retain the same project ID.

Use the current official Supabase Google OAuth guide when completing the
dashboard fields: https://supabase.com/docs/guides/auth/social-login/auth-google

## What the code enforces

- A browser-only `melsou_guest_v1` HttpOnly cookie identifies guest drafts for
  14 days; it is not an authentication credential.
- Before redirecting to Google, the active draft is saved through the guest API.
- After Supabase returns a real access token, the Worker validates it, calls the
  database's atomic/idempotent `melsou_claim_guest_projects` function, then
  clears the guest cookie.
- Browser localStorage may retain an editor backup and project revision. It is
  never used to decide whether a visitor is logged in.
- Local binary/Data URL images are not inserted into Postgres JSON. They remain
  local until the existing private-R2 asset upload integration is connected to
  this UI. Do not treat the current freeform upload UI as production image
  storage yet.
