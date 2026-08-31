# Studio canonical model

The canonical project document is lightweight/versioned JSON, references asset IDs, and uses normalized coordinates (`0..1`), never viewport pixels. It contains schema version, project id/title, owner type/id, album configuration, template id/version, slot content bindings, `unplaced_content`, options, revision and timestamps.

Template owns geometry and locked decoration. Project owns customer bindings: image asset id plus crop/zoom/reposition, constrained text, allowed sticker choice and Spotify URL/QR option. Images are never embedded in JSON. The Studio preview renderer and high-resolution print renderer must consume the same document/template binding semantics.

## Editing model

Interiors are two-page layflat spreads; front and back covers are separate. Panorama/background may cross the center fold. Text, QR and other critical content must be prevented/warned from entering the config-defined gutter/safe-risk zones. Do not hard-code geometry values: use a selected `print_profile` with `TBD_PRINT_VENDOR` inputs.

Autosave is two-layer: local IndexedDB/browser persistence and debounced server persistence. Offline editing remains local; reconnect compares revisions and exposes a conflict/rebase flow. UI reports saving/saved/offline/conflict truthfully. Create a checkpoint on step change, Preview and before design lock; retain ten.

Template switching remaps like-compatible slot bindings in deterministic order. Surplus image/text/sticker content is placed in `unplaced_content`, not deleted. Switching is revision-controlled and undoable through checkpoints.
