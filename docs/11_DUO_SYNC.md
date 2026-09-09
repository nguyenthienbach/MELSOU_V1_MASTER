# Duo Sync V1

Duo Sync allows **at most two** people to edit one canonical project. Owner creates a revocable, expiring invite; store only a token hash. Invite grants constrained collaboration on that project, not account, billing, order, owner or archive permission. Do not expose project contents before validated join.

Use Supabase Realtime for ephemeral presence such as participant display name, currently viewed spread and active slot. Do not write cursors/presence stream into PostgreSQL. A slot being edited has a renewable soft lock with TTL; a disconnect/expiry releases it. Participants may edit different slots concurrently. If a participant opens a locked slot, show who is editing and prevent conflicting UI edits.

All durable edits go through the normal expected-revision project write API. Realtime may optimistically show edits, but PostgreSQL revision is authoritative. On race/conflict, reconcile against latest document; never silently drop/overwrite content. One canonical project retains normal checkpoints (maximum 10).

When project owner locks design, enters review, or begins checkout, room changes read-only. Returning to Studio can reopen it. V1 does not merge simultaneous Duo recordings: a voice re-record follows the same single canonical project reference and version-safe commit rules as other edits. Test invite security, max-two enforcement, lock expiration, disconnect/reconnect, concurrent different slots, same-slot collision, voice replacement conflicts, auth scope and checkout read-only behavior.
