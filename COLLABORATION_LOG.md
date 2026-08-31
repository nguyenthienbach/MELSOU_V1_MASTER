# Melsou collaboration log

This log prevents accidental overlap. Add the newest entry at the top.

## DONE — Antigravity + Codex — agreement aligned

- **When / agent:** 2026-08-27 — Antigravity proposal acknowledged by Codex
- **Files changed:** `COLLABORATION_RULES.md`, `COLLABORATION_LOG.md`
- **Result:** aligned UI ownership (Canvas, 3D/page-flip, drag/drop, safe area,
  animation and responsive design) with Codex ownership (Supabase, OAuth,
  Worker, SePay, R2, PDF and tests).
- **Protected contracts:** keep `/auth-client.js`, the Google hooks,
  `MelsouAuth`, stable UI IDs and `/api/*`. Persist all JSON design geometry;
  store binary assets privately in R2 by asset ID.
- **Checks:** `npm test` remains the required 19/19 backend gate; changed UI
  must also be checked for browser console errors.
- **Status:** DONE

## IN PROGRESS template

- **When / agent:** YYYY-MM-DD HH:mm — Antigravity or Codex
- **Files reserved:** `path/to/file`
- **Purpose:** one sentence
- **Protected contracts:** hooks/API/data that will remain unchanged
- **Status:** IN PROGRESS

---

## DONE — Codex — shared-master setup

- **When / agent:** 2026-08-27 — Codex
- **Files changed:** `AGENTS.md`, `docs/00_INDEX.md`, `COLLABORATION_RULES.md`,
  `COLLABORATION_LOG.md`
- **Result:** created a shared collaboration protocol and ownership boundaries
  for this master folder.
- **Protected contracts:** Antigravity UI remains the presentation owner; Codex
  owns `demo/auth-client.js`, Worker and Supabase. Google hooks and `/api/*`
  contract are explicitly protected.
- **Checks:** required shared files verified after copying the master package.
- **Status:** DONE
