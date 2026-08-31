# SePay payments

SePay is the sole V1 payment provider. An order moves to `AWAITING_PAYMENT` with a server-generated payment reference, expected amount/currency, expiry of 30 minutes, and payment attempt record. Present only server-derived QR/instructions; never trust client “paid” messages.

## Webhook processing

Verify the configured SePay webhook signature/authentication before parsing a transition. Persist a deduplicated provider event keyed by provider transaction/event identity; process under a database transaction and use an idempotency key. Match correct account/reference, expected currency/amount and non-expired intended order. Duplicate and reordered events must make no additional transition, render, archive or notification.

Exact verified payment transitions to `PAID`, writes audit state, and enqueues exactly one render job. A wrong amount, missing/ambiguous reference, suspicious event, or unsupported refund evidence goes to `PAYMENT_MISMATCH` and never auto-approves. Expired unpaid attempt becomes `PAYMENT_EXPIRED`; later events require owner review, not silent automatic success.

Owner mismatch resolution, cancellation and refund actions need a reason/note and append-only audit log (actor, before/after, timestamp, note). Treat SePay API/webhook credentials as server secrets. Tests must include forged signature, duplicate events, amount mismatch, late event, concurrent deliveries and happy path.
