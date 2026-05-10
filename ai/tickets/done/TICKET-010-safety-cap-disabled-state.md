# TICKET-010: Safety-cap / uploads-disabled state on the homepage

## Status

Backlog

## Goal

When the stats payload reports `uploadsEnabled: false` (or `downloadsEnabled: false`), the homepage upload flow should be visibly disabled and the user should see the spec'd safety-cap message.

## Background

Spec §12 defines the global monthly safety hard-stop. Spec §8 ("Public Stats Privacy" / safety-cap quote):

> Monthly safety limit reached. Uploads and downloads are temporarily paused to protect server bandwidth.

TICKET-008 already adds this banner inside the StatsPanel. This ticket extends the same flag through to the uploader.

## Requirements

- The Home view reads `uploadsEnabled` from the stats response and propagates it into `FileUploader.vue`.
- When `uploadsEnabled === false`:
  - The drop zone is visually muted / non-interactive.
  - File pick + drag-drop are disabled (the `<input type="file">` is `disabled`, dragover state doesn't activate).
  - The `Upload` button (if a file was already selected before the flag flipped) is disabled.
  - The spec's safety-cap message is visible above the upload area as well as in the stats panel.
- When `downloadsEnabled === false`, the download landing page (`/file/:token`) should also surface the same message above the file info card. The `Download` button stays visible but is disabled.
- Use the same one-liner message everywhere — define it in a shared constant (e.g., `src/messages.ts` or top of `src/views/Home.vue`).

## Acceptance criteria

- Flipping the emulated stats `uploadsEnabled` to `false` (test by editing the mock data) disables the uploader and shows the message above it.
- Flipping `downloadsEnabled` to `false` disables the download button on `/file/:token`.
- The frontend never crashes if the flags are missing — treat undefined as `true` (uploads/downloads enabled).

## Files likely involved

- `frontend/src/views/Home.vue`
- `frontend/src/views/Download.vue`
- `frontend/src/components/FileUploader.vue`
- `frontend/src/messages.ts` (new, optional)

## Out of scope

- Polling the stats endpoint to detect the flag flipping during a session (one fetch on mount is enough).
- Showing a countdown or ETA — the backend doesn't expose one.

## Notes for implementation

- Disabled-state styling can be minimal (reduce opacity, `cursor: not-allowed`). The polish ticket can refine it.
- Don't piggyback validation logic in this ticket. It's just "if flag is false, lock the controls and show the banner."
