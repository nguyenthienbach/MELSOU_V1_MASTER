# Architecture

## System of record and boundaries

`Supabase PostgreSQL` is canonical for application principals, native credential hashes, opaque sessions, optional linked identities/email verification, projects, image/voice asset metadata, prices, quotes, orders, payment attempts/events, state transitions, shipments, audit logs, render jobs, archive jobs and integration status. Use RLS plus server-side authorization. Native username sessions use the Worker API because they are not Supabase JWT identities; optional Google users map into the same application-principal table.

`Cloudflare R2` is private hot storage for authorized originals, previews and temporary/working files. Browser access uses short-lived signed URL/POST grants. Keep it below an operational 8 GB target, independently of a provider quota, via lifecycle jobs.

`Google Drive` is private archive for production outputs and cold originals. It receives asynchronous, retryable archive copies only after database state commits. Store paths such as `ORDERS/YYYY/MM/<order-code>/`; never names, phone numbers, email, or other PII.

`Google Sheets` receives retryable reporting exports only. It cannot create/change orders, payment state, customer state, pricing, or production state.

`SePay` supplies external payment events. Verify and persist first, then transition an order transactionally. `Supabase Realtime` is ephemeral presence/slot-lock transport and never replaces database persistence.

## Adapter interfaces

Keep business services independent behind interfaces: `ObjectStorage`, `ArchiveStorage`, `PaymentProvider`, `ReportingSink`, `RenderWorker`, `RealtimeRoom`. Implement R2, Drive, SePay, Sheets and Supabase adapters for V1. Development fakes must be visibly labelled and cannot claim production completion.

## Core sequence

Studio → revision-checked project/image/voice persist → preflight → native account authentication (or optional Google) + idempotent guest claim → immutable production snapshot + quote/order/voice selection → SePay payment → verified paid transition → render job → files/voice archive → owner prepress approval → production/shipping/completion.
