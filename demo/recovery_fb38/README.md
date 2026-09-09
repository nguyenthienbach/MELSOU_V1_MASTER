# MELSOU V1 — CURRENT WORKING RECOVERY FB38 (FB90 MILESTONE)

- **Designation:** `CURRENT ACTIVE WORKING DIRECTORY (FB90 MILESTONE)`
- **Target Timestamp:** `2026-09-10T00:20:00+07:00`
- **Approved by Product Owner:** `2026-09-10` (Directive: "đặt phiên bản FB 90 này là tốt nhất, tạo folder riêng như các phiên bản khác, đồng thời tải lên github")
- **Active Baseline Checkpoint:** `demo/checkpoint_fb90_golden/`
- **Baseline Lineage:** Evolves cleanly from `checkpoint_fb87_golden` and integrates:
  - **FB88 (Page Management / Add–Remove Spread UX):**
    - 1 action = 1 spread = 2 pages = ± 15.000đ. Adding spread appends a 2-page interior spread before Back Cover, consecutively numbered.
    - Default spreads (Bìa Trước, Trang 2–3 through Trang 10–11, Bìa Sau) are strictly protected with 0 remove buttons.
    - Only user-added spreads (`isCustomAdded: true`) expose the red circular remove button (`.filmstrip-remove-btn`, 22px, z-index: 30, #dc2626).
    - Custom bilingual confirmation dialog (`#removeSpreadConfirmModal`).
    - Bidirectional price reconciliation: adding spreads +15.000đ, removing spreads -15.000đ. Extra spread count invariant: `ALBUM_DATA.extraSpreadsCount = ALBUM_DATA.spreads.filter(s => s.isCustomAdded).length`. Synchronized across Studio topbar, cart items, and draft autosaver.
    - Mobile filmstrip fully accessible: removed `display: none !important;`, enabled smooth horizontal swipe with scroll-snapping, auto-scroll active spread into view.
  - **FB89 (Studio Undo/Redo Engine):**
    - Wired pushStudioSnapshot across 17 atomic canvas operations: photo placement, photo deletion, photo frames, stickers, text adding, inline text editing, font styling, font sizing, font color, bold, italic, layer z-index manipulation, element locking, duplication, alignment, horizontal flipping, 90° rotation, spread background color, and spread adding/removal.
    - Transaction/commit model for drag, resize, rotate, and inline text.
    - Full bidirectional integration with spread management: Undo "Thêm 2 trang" removes spread and decrements price by 15.000đ; Redo restores spread and price.
    - History limit expanded to 50 (`STUDIO_HISTORY_LIMIT = 50`). Full keyboard shortcut support (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`).
  - **FB90 (Studio Workspace Fitting when Left Drawer Opens):**
    - Canva mental model: When desktop drawer opens (>= 960px), `.studio-stage` shifts by margin-left: 320px via smooth CSS transition. The remaining space between the drawer and screen edge becomes the exact available workspace.
    - adjustMobileStageScale() resets stageWrapper.style.marginLeft = '0px', takes the true available rectangle, and calculates contain/fit scale `scale = Math.min(availW / baseW, availH / baseH)`. Album is centered in the available space (`diff: 0.0px`).
    - Post-transition timer (`setTimeout(adjustMobileStageScale, 250)`) ensures pixel-perfect recalculation upon drawer open/close. Zero page clipping, zero aspect-ratio deformation, zero coordinate drift.

## Verification Status
- Automated FB88/FB89/FB90 test suite (`test_fb88_fb89_fb90_suite.cjs`): 41/41 PASSED (100%).
- Extra verification suite (`test_extra_verifications.cjs`): 2/2 PASSED (100%).
- Automated FB87 clean state test suite (`test_fb87_clean_state.cjs`): 8/8 PASSED (100%).
- Automated FB85 responsive matrix suite (`test_fb85_full_matrix.cjs`): 16/16 viewports PASSED (100%).
- JS Syntax check: `node -c demo/recovery_fb38/app.js` exited with 0 (0 errors).
- Clean visual proof artifacts saved in brain artifact directory.
