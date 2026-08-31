# Error handling and recovery

Never sacrifice data, payment correctness or artifact reproducibility for a cheerful UI. All user-facing failures must say what happened, whether data is safe, and a retry/next action without revealing internals.

| Failure | Required behavior |
|---|---|
| Offline/autosave failure | persist local state; show offline; retry/reconcile on reconnect; no silent overwrite |
| Revision conflict | preserve local copy, fetch server revision, offer clear merge/retry path |
| Upload failure | validate before storage, resumable/retry where supported, clean orphan parts safely |
| Guest expiry/claim retry | no partial ownership; idempotent claim and clear expiration message |
| SePay duplicate/late/invalid event | persist/dedupe; no duplicate fulfilment; mismatch/manual queue when uncertain |
| Render failure | `RENDER_FAILED`, preserve snapshot, safely redact diagnostics, idempotent retry by owner/system |
| Drive/Sheets outage | durable outbox/retry/backoff; DB/order operations continue; surface integration health |
| R2 pressure | alert/cleanup/archive workflow; never purge active or production-referenced data |
| Duo disconnect | expire presence/soft lock, retain saved revision, resync on return |

Use durable job records with attempts, status, timestamps, error class and idempotency key; avoid in-process-only queues. Implement retry with bounded exponential backoff and a review/dead-letter state where continued automatic retry is unsafe. State transitions and external side effects must be separately retryable. Backups/restore procedures for Postgres must be documented and periodically exercised before launch. Audit consequential manual recovery actions.
