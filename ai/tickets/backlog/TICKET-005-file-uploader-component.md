# TICKET-005: `FileUploader` component (selection, drag-drop, validation)

## Status

Backlog

## Goal

Build the file selection part of the homepage: drag-and-drop zone + click-to-pick fallback, with frontend size validation. This ticket stops short of actually triggering an upload — that's TICKET-006.

## Background

Spec §8 shows the homepage layout. This component covers the `idle` and `selected` states.

## Requirements

- `src/components/FileUploader.vue` (Composition API, `<script setup lang="ts">`).
- States: `idle` and `selected` (no `uploading` yet — that lands in TICKET-006).
- Drop zone:
  - Big visible target with the spec'd text "Drop file here or click to choose".
  - Highlights on dragover.
  - Accepts files dropped from the OS.
- Click-to-pick: the drop zone is also a label for a hidden `<input type="file">` (single-file only).
- When a file is selected, show "Selected: {name} — {formatBytes(size)}" and an `Upload` button (the button can be inert here, just visible).
- Frontend validation:
  - Reject files larger than 100 MB (`MAX_UPLOAD_BYTES` = 104857600) and show a clear error from spec §21.
  - Reject if no file is selected when `Upload` is clicked.
  - Use `formatBytes` from TICKET-004 for sizes.
- Emit `select` with the `File` so the parent (Home view) owns the value if needed later.
- A `Reset` action that returns to `idle`.

## Acceptance criteria

- Dragging a file over the zone visually highlights it; dropping selects it.
- Clicking the zone opens the OS file picker; selecting a file triggers the same `selected` state.
- A 200 MB file is rejected with the spec's wording ("File is too large. Max size is 100 MB.").
- Reset clears the selection and returns to `idle`.
- `npm run dev` shows the component working on `/`.

## Files likely involved

- `frontend/src/components/FileUploader.vue`
- `frontend/src/views/Home.vue` (mount the component)

## Out of scope

- Network upload (TICKET-006).
- Upload progress UI (TICKET-006).
- The result link / copy button (TICKET-007).
- Stats panel (TICKET-008).
- Polish / responsive design (TICKET-011).

## Notes for implementation

- Use `<label for="...">` + visually-hidden `<input type="file">` for accessibility (keyboard + screen reader).
- Single file only — set `accept="*/*"` but don't set `multiple`.
- Validation messages live in component state; the component owns its own `error` field.
- The `MAX_UPLOAD_BYTES` constant should live in a single place (`src/config.ts` or top of the component). If you create `src/config.ts`, note that in your PR so future tickets can reuse it.
