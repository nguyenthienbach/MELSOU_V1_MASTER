# Implementation plan

Execute in order. Do not advance without the phase’s relevant acceptance criteria/tests.

1. **Foundation:** inspect repo; establish app, typed config, lint/type/test/build gates, design tokens and safe environment validation. No secrets.
2. **Canonical data/auth:** Supabase migrations/RLS, application principals, slow-hashed native credentials, opaque sessions, optional verified email/Google identity, guest sessions, projects/revisions/checkpoints/assets and all-draft idempotent claim.
3. **Private asset pipeline:** R2 adapter/private signed access, server validation, preview derivation/metadata stripping, quotas and lifecycle job framework.
4. **Template Studio:** canonical document/schema, eight template stub loader, template selection/remap, slot editor, local+server autosave, preview and preflight UI.
5. **Pricing/checkout:** versioned pricing/quotes, immutable snapshot/order/shipment/voice selection, secure account-gated checkout and safe tracking.
6. **SePay:** payment attempt, verified idempotent webhook, mismatch/expiry flows, audit trail and exactly-once render outbox.
7. **Render/prepress:** renderer abstraction, profile gate, deterministic preview/PDF artifact pipeline, render jobs and owner-only prepress dashboard. Stop production approval until `TBD_PRINT_VENDOR` is supplied.
8. **Archive/reporting:** Drive archive adapter/outbox/checksum lifecycle and Sheets reporting outbox; ensure outages are non-blocking.
9. **Duo Sync:** tokenized room, max-two membership, ephemeral presence/soft locks, revision persistence and checkout read-only mode.
10. **Owner operations/hardening:** dashboard queues, production/shipping/mismatch/refund controls; security review, lifecycle/recovery UX, full e2e/concurrency/accessibility tests and launch checklist.

At every phase: read the routed docs, add migration/rollback notes, use fakes for unavailable integrations, run gates, fix regressions, and summarize verified state. When the physical print vendor provides values, add a versioned print profile, rerun render/preflight tests, and perform a real sample-output signoff before enabling production approval.
