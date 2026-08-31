# Guest, Google auth and ownership

## Guest-first workflow

Visitors can create multiple drafts, upload approved images, edit, autosave and obtain a quote without an account. Store a random opaque guest-session secret only in secure browser storage/cookie according to the selected framework; store only a verifier/hash server-side. Do not use email/phone as a guest identity.

Guest drafts expire 14 days after last activity. The same browser/device can restore them; the most recently active draft is highlighted. Asset access remains scoped to the guest session and project. Expiry cleanup is recoverable only through documented lifecycle policy, not by extending access indefinitely.

At “Continue to order”, require Supabase Google Sign-In. Google is the only V1 login flow. After successful callback, transactionally claim **all** eligible drafts/assets associated with the guest session into the signed-in customer. Replaying the claim must be safe and produce the same ownership state. Do not claim unrelated guest drafts based on a client-supplied project id.

## Roles and authorization

The only roles are `CUSTOMER` and configured `OWNER`. Determine owner only on trusted server configuration/migration logic; never trust a client role field. Customers can operate only their own projects, assets, orders and addresses. Owner-only server actions include pricing/config changes, mismatch resolution, refund action, production changes and prepress approval. Duo participants have scoped project editing access but do not gain ownership, billing, archive or order authority.

## Account lifecycle

Account projects live until user deletion; deletion moves project/assets to trash for 30 days. Keep newest 10 checkpoints. Auth failures, callback replay and expired guest tokens must be non-destructive. Session and OAuth state must use CSRF protections, secure cookie flags and redirect allowlists.
