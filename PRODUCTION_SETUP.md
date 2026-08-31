# Production configuration checklist

The app is structurally prepared for Cloudflare Workers static assets plus `/api/*` endpoints. It is not safe to accept payments until all items below are complete and verified.

## 1. Supabase PostgreSQL

Apply all files in `supabase/migrations/` to the intended Supabase project in filename order. Configure Google OAuth in Supabase with the final HTTPS callback URL. Set `OWNER_EMAIL` as a Worker secret; the server promotes only that verified Google account to OWNER after it signs in. Never accept an Owner role from browser input.

## 2. Cloudflare Worker

Create/deploy this Worker using `wrangler.jsonc`. Configure non-secret variables separately from secrets. Sensitive values belong in Cloudflare Secrets—not source control—using the names in `.dev.vars.example` and `.env.example`; include the internal render callback token. Cloudflare supports encrypted Worker secrets and static assets in one deployment. [Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/) and [static assets](https://developers.cloudflare.com/workers/static-assets/).

## 3. SePay

Create a public HTTPS webhook at `https://<domain>/api/sepay/webhook`; choose **HMAC-SHA256**, never unauthenticated webhooks. Store the generated key as `SEPAY_WEBHOOK_SECRET`. The worker validates raw body, `X-SePay-Timestamp`, HMAC and a five-minute replay window before calling the transactional Supabase RPC. It deduplicates on SePay event `id`, matches payment code/amount, and only transitions an awaiting order to `PAID` on exact match. SePay documents this signing input as `{timestamp}.{raw_body}` and requires `{"success": true}` response for successful receipt. [SePay authentication](https://developer.sepay.vn/en/sepay-webhooks/xac-thuc), [payload and response contract](https://developer.sepay.vn/en/sepay-webhooks/tich-hop-webhook).

## 4. Required additional services

Configure private Cloudflare R2 for upload originals/previews, Google OAuth, and the real print-vendor profile before enabling checkout. The code deliberately blocks checkout at `TBD_PRINT_VENDOR` until the print partner supplies values. After the verified Owner account signs in, activate the vendor profile through `POST /api/owner/print-profiles`; that Owner-only route validates all dimensions, DPI and color profile and deactivates any earlier profile. Google Drive is archive-only through the scheduled archive outbox; Google Sheets is reporting-only through the scheduled reporting outbox. Neither ever becomes a transactional source of truth.

## 5. Go-live gates

Run real Google login, SePay test mode, HMAC forged/replay/duplicate/mismatch tests, R2 authorization tests, order and prepress-owner authorization checks, and an actual print sample with approved vendor profile. Keep production in preview/demo mode until every gate passes.
