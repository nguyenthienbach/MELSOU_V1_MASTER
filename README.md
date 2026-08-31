# Melsou — Codex-ready V1 Handoff

This package is the implementation contract for Melsou V1: a guest-first, template-first web-to-print studio for layflat 180° photo albums.

## Start here

1. Read `AGENTS.md`.
2. Read `docs/00_INDEX.md` and the documents it routes to.
3. Run the exact prompt in `CODEX_MASTER_EXECUTION_PROMPT.md`.

The specifications are authoritative. Values tagged `TBD_PRINT_VENDOR` must be obtained from the actual print vendor before production rendering; they must never be guessed.

## Run locally

```powershell
npm install
npm run demo
```

Open `http://127.0.0.1:3000` for the visual Studio. For the connected app, copy `.dev.vars.example` to `.dev.vars`, set the Supabase values, then run `npm run dev:worker`.

## Go live

1. Apply all `supabase/migrations/*.sql` files in name order.
2. Configure Supabase Google OAuth for the final domain.
3. Create the private R2 bucket and update its name in `wrangler.jsonc` if needed.
4. Add Worker secrets from `.dev.vars.example`, including Supabase, SePay, `OWNER_EMAIL`, and the internal render token.
5. Point SePay HMAC webhook to `https://<your-domain>/api/sepay/webhook`, test it, then deploy with `npm run deploy`.

The print profile remains intentionally disabled until the vendor gives the real geometry, DPI and color profile. That is a safety gate, not a missing price field.

## Locked V1 outcomes

- Supabase PostgreSQL is the canonical system of record.
- Cloudflare R2 is private hot/working storage; Google Drive is archive; Google Sheets is reporting only.
- Studio is guest-first. Google Sign-In appears only at checkout.
- Auth is Google-only. Roles are `OWNER` and `CUSTOMER`.
- Packages: Melody 159,000 VND, Voice 219,000 VND, Signature 259,000 VND.
- Shipping is 30,000 VND per shipment. A Twin second copy is 75% of the configured first-copy price and may use two shipments.
- SePay is the payment provider. Only an `OWNER` can approve prepress into production.
- Duo Sync has at most two participants and no web voice recording/upload.

## Package map

```
AGENTS.md                          Engineering contract
CODEX_MASTER_EXECUTION_PROMPT.md   One-command kickoff
docs/                              Authoritative specifications
templates/                         Eight versioned V1 template stubs
tests/fixtures/                    Safe fixtures/placeholders
```

No secrets are included. Copy `.env.example` to a local environment file and set only real credentials outside version control.
