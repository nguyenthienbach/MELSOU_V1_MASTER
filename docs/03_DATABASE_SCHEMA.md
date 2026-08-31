# Database schema and invariants

Use UUID primary keys, UTC timestamps, `created_at`, `updated_at`, and explicit foreign keys. Put all client-visible data behind RLS. Canonical entities:

| Entity | Critical fields / invariant |
|---|---|
| `profiles` | `user_id`, `role` (`OWNER`/`CUSTOMER`); role is server-owned |
| `guest_sessions` | opaque, HttpOnly-safe identifier/hash, expiration, no PII path usage |
| `projects` | owner user/guest, status, document JSON, `revision`, template id/version, last activity |
| `project_checkpoints` | immutable document copies; retain newest 10 per project |
| `project_assets` | project id, R2 keys, MIME, dimensions, bytes, checksum, status/quality; never binary in DB |
| `duo_rooms`/`duo_members` | project id, owner, invite token hash, max 2 active members, read-only state |
| `pricing_versions`/`pricing_rules` | versioned values/effective state; never edit a value referenced by an order |
| `quotes` | priced configuration + expiry + pricing version; immutable after order creation |
| `production_snapshots` | immutable project document/template/asset refs/print-profile reference |
| `orders`/`order_lines` | code, status enum, customer, quote and price snapshot, snapshot id |
| `payment_attempts`/`payment_events` | provider ids, expected/received amount, idempotency key, raw payload protected |
| `render_jobs` | snapshot id, attempts, status, artifact refs, error classification |
| `shipments` | order id, independent status/carrier/tracking/address snapshot |
| `audit_logs` | actor, action, before/after, note, timestamp; append-only |
| `archive_jobs`/`reporting_outbox` | idempotent retry state; side effects never inside request transaction |

## Order status enum

`DRAFT`, `PRICE_READY`, `ORDER_CREATED`, `AWAITING_PAYMENT`, `PAID`, `RENDERING`, `PREPRESS_REVIEW`, `PRODUCTION`, `READY_TO_SHIP`, `SHIPPING`, `COMPLETED`, plus `PAYMENT_EXPIRED`, `PAYMENT_MISMATCH`, `CANCELLED`, `REFUND_REQUESTED`, `REFUNDED`, `RENDER_FAILED`, `DELIVERY_FAILED`.

Only allowed transitions are implemented in a server-side state machine. `COMPLETED` requires every required shipment completed. Snapshot, quote, price breakdown and payment expectation are immutable once the order is created.

## Optimistic concurrency

Project writes require the caller’s expected revision and atomically increment revision. On mismatch return a conflict with current revision; never silently overwrite. Guest claim is transactional and idempotent. Tenant/guest project, asset, snapshot, order and signed-object authorization must be checked at every read/write.
