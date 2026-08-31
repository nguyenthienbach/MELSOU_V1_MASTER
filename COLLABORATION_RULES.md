# Melsou — shared Antigravity + Codex working agreement

This folder is the single shared master:

`C:\Users\Thien Bach\Documents\MELSOU_V1_MASTER`

Both agents must read `AGENTS.md`, this file, and the relevant documentation
before changing anything. The product owner is the final decision-maker.

## 1. Ownership boundaries

| Area | Primary editor | What the other agent may do |
|---|---|---|
| `demo/index.html`, `demo/styles.css`, `demo/app.js`, visual assets and responsive UX | Antigravity | Read, review, and add a minimal integration hook only after logging it. Do not redesign or replace UI. |
| `demo/auth-client.js`, `demo/server.mjs` API bridge | Codex | Antigravity may keep the script include and named hooks intact, but must not alter auth/session logic. |
| `worker/`, `supabase/`, `tests/`, `wrangler.jsonc`, secret/config documentation | Codex | Antigravity may read only; never replace with a mock Worker or browser-only database. |
| Product/business documentation and locked template data | Owner + Codex | Antigravity must ask before changing rules, prices, or templates. |

No boundary grants permission to delete, mass-format, or rewrite another
agent's files.

## 2. Protected integration contract

Antigravity must preserve these UI-to-backend hooks while updating the UI:

- `<script src="/auth-client.js"></script>` in `demo/index.html`.
- `window.codexHandleGoogleSignIn()` called by the Google button.
- `MelsouAuth.handleAuthSuccess({ id, name, email, avatar })` for an already
  verified Supabase session only.
- `window.melsouGetActiveDraft()` and `window.melsouOnDraftChanged?.()` for
  draft persistence.
- Relative API calls under `/api/*`; do not hard-code a personal URL or secret.

Antigravity owns the Canvas Photobook, page-flip/3D presentation, drag/drop,
rotation, print-safe-area visualisation, modal/animation and responsive visual
experience. Codex must not replace or restyle these systems while doing backend
work.

`ALBUM_DATA` is the shared design contract. Codex must preserve its complete
JSON design data—including coordinates, crop, zoom, rotation, frame style and
text—when saving/restoring a draft. Image/video/audio *binary* data is the only
exception: it must live in authorised private R2 storage and be referenced by
asset ID, never inserted into Postgres JSON or treated as a durable browser
localStorage payload.

Codex must preserve the visual DOM, classes, copy, navigation and design assets
unless the owner explicitly asks for a UI change. Codex never inserts fake
accounts, localStorage-as-auth, client-side secrets or a fake payment success.

## 3. Before editing

1. Read `COLLABORATION_LOG.md` and inspect current changes.
2. Announce in the log which files you will touch and why.
3. Do not edit a file already marked **IN PROGRESS** by the other agent. Ask the
   owner to relay a handoff, or wait for the other agent to mark it complete.
4. If a task needs a shared file, make the smallest compatible change and state
   exactly which contract you preserved.
5. Never overwrite an unfamiliar change. Stop and report the conflict instead.

## 4. While editing

- Work only inside your ownership area whenever possible.
- Preserve API request/response shapes, database migrations and product rules.
- Add a new migration; never edit a migration that has already been applied to
  a real Supabase project.
- Do not commit keys, OAuth secrets, service-account JSON or SePay secrets.
- Do not use destructive reset/checkout commands to “clean” shared work.
- Keep changes small and test them before handing off.
- A handoff may be marked complete only when `npm test` passes (currently
  19/19 backend tests) and the changed browser flow has no new console errors.

## 5. Handoff protocol

After each completed change, append an entry to `COLLABORATION_LOG.md` with:

- date/time and agent name;
- files changed;
- user-visible result;
- protected contracts checked;
- commands/tests run and result;
- known limitations or the exact next task.

Mark an in-progress entry **DONE** only after checks pass. If a task is blocked,
mark it **BLOCKED** with the exact missing owner input; do not guess values.

## 6. Safe rollback

Before any large visual redesign or backend migration, create a Git commit on a
separate branch once GitHub is connected. Until then, make a dated ZIP backup
outside this master folder. Never delete the previous working version merely
because a new one exists.

## 7. Immediate current assignment

- Antigravity: UI/UX only in `demo/index.html`, `demo/styles.css`,
  `demo/app.js` and visual assets. Preserve the protected integration contract
  above.
- Codex: Supabase, Google OAuth, API security, draft persistence, payment and
  test infrastructure. Preserve Antigravity's presentation layer.
- Owner: relays requests between agents until the shared GitHub repository is
  connected; do not share secrets in chat.
