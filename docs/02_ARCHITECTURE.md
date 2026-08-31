# Architecture

## System of record and boundaries

`Supabase PostgreSQL` is canonical for identities, projects, assets metadata, prices, quotes, orders, payment attempts/events, state transitions, shipments, audit logs, render jobs, archive jobs and integration status. Use RLS plus server-side authorization.

`Cloudflare R2` is private hot storage for authorized originals, previews and temporary/working files. Browser access uses short-lived signed URL/POST grants. Keep it below an operational 8 GB target, independently of a provider quota, via lifecycle jobs.

`Google Drive` is private archive for production outputs and cold originals. It receives asynchronous, retryable archive copies only after database state commits. Store paths such as `ORDERS/YYYY/MM/<order-code>/`; never names, phone numbers, email, or other PII.

`Google Sheets` receives retryable reporting exports only. It cannot create/change orders, payment state, customer state, pricing, or production state.

`SePay` supplies external payment events. Verify and persist first, then transition an order transactionally. `Supabase Realtime` is ephemeral presence/slot-lock transport and never replaces database persistence.

## Adapter interfaces

Keep business services independent behind interfaces: `ObjectStorage`, `ArchiveStorage`, `PaymentProvider`, `ReportingSink`, `RenderWorker`, `RealtimeRoom`. Implement R2, Drive, SePay, Sheets and Supabase adapters for V1. Development fakes must be visibly labelled and cannot claim production completion.

## Core sequence

Studio → revision-checked project persist → preflight → immutable production snapshot + quote/order → Google authentication → SePay payment → verified paid transition → render job → files/archive → owner prepress approval → production/shipping/completion.
