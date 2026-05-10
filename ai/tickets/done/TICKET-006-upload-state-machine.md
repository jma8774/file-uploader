# TICKET-006: Upload state machine + simulated progress

## Status

Backlog

## Goal

Wire the `Upload` button in `FileUploader` to the emulated `api.uploadFile()`, render progress, and surface success or error states.

## Background

After TICKET-005 the user can pick a file. After TICKET-003 there's an emulated upload function with progress callbacks. This ticket connects them.

States are defined in the spec §8 and `ai/conventions.md`:

```text
idle | selected | uploading | success | error
```

## Requirements

- Clicking `Upload` transitions `selected → uploading`.
- The button is disabled (and cannot be re-clicked) while in `uploading`.
- A progress indicator renders below the button while in `uploading`. Format from the spec: "Upload progress: 64%". Either a text line, a `<progress>` element, or both — pick one and be consistent.
- On `uploadFile` resolve → state becomes `success` and the resulting upload metadata is held in component state (and/or emitted via an event for TICKET-007 to consume).
- On `uploadFile` reject (any thrown `ApiError` or generic error) → state becomes `error`, and the matching user-visible message from spec §21 is shown. `FILE_TOO_LARGE` and `INTERNAL_ERROR` are the two most likely paths in emulation.
- A `Try again` action returns the user to `selected` (with the same file) or `idle` (cleared). Pick whichever is less confusing — document the choice in the PR.

## Acceptance criteria

- Picking a valid file then clicking `Upload` shows progress that ticks up to 100% and ends on a success state.
- The upload button cannot be clicked twice in a row to trigger two uploads.
- Picking a >100 MB file and clicking `Upload` ends on an `error` state with the correct message (most of this validation is already in TICKET-005 — this ticket ensures the post-server-side `FILE_TOO_LARGE` is also handled, even though the emulation injects it client-side).
- `Try again` resets the state and lets the user upload again without a page refresh.

## Files likely involved

- `frontend/src/components/FileUploader.vue`
- `frontend/src/api.ts` (consumer-only — no changes expected, but verify)
- `frontend/src/views/Home.vue` (only if events bubble up to here)

## Out of scope

- Rendering the resulting download link (TICKET-007).
- Stats panel refresh after upload (TICKET-008).

## Notes for implementation

- Hold the state as a discriminated union or a single string ref plus a few related refs. Don't reinvent XState for this — it's five states.
- Wire `onProgress` from `api.uploadFile` directly into a `progress` ref.
- Cancellation (user closes the tab mid-upload) is acceptable to ignore in v1; document if you do anything beyond letting the promise hang.
