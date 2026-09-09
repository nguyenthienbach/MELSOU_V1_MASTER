# Guest, account auth and ownership

## Guest-first workflow

Visitors can create multiple drafts, upload approved images, edit, autosave and obtain a quote without an account. Store a random opaque guest-session secret only in secure browser storage/cookie according to the selected framework; store only a verifier/hash server-side. Do not use email/phone as a guest identity.

Guest drafts expire 14 days after last activity. The same browser/device can restore them; the most recently active draft is highlighted. Asset access remains scoped to the guest session and project. Expiry cleanup is recoverable only through documented lifecycle policy, not by extending access indefinitely.

At “Continue to order”, require authentication. Canonical V1 registration/login uses a unique normalized username plus password; email is optional. Passwords are slow-hashed with unique salts, never logged/stored plaintext, and login is rate-limited with bounded account lockout. Sessions are opaque HttpOnly cookies whose hashes and expiry are stored server-side. Google OAuth may remain as an additive identity. After successful authentication, transactionally claim **all** eligible drafts/assets associated with the guest session into the signed-in customer. Replaying the claim must be safe and produce the same ownership state. Do not claim unrelated guest drafts based on a client-supplied project id.

## Roles and authorization

The only roles are `CUSTOMER` and configured `OWNER`. Determine owner only on trusted server configuration/migration logic; never trust a client role field. Customers can operate only their own projects, assets, orders and addresses. Owner-only server actions include pricing/config changes, mismatch resolution, refund action, production changes and prepress approval. Duo participants have scoped project editing access but do not gain ownership, billing, archive or order authority.

## Account lifecycle

Account projects live until user deletion; deletion moves project/assets to trash for 30 days. Keep newest 10 checkpoints. Auth failures, callback replay and expired guest tokens must be non-destructive. Native sessions use Secure/HttpOnly/SameSite cookies; OAuth state uses CSRF protections and redirect allowlists. Username changes require password confirmation and a cooldown. Recovery email works only after optional email linkage is verified; an account without verified email receives an explicit non-destructive `RECOVERY_EMAIL_REQUIRED` state and must continue using its password until a separately owner-approved support recovery policy exists.
