# TICKET-009: Download landing page (`/file/:token`) — all states

## Status

Backlog

## Goal

Build out the `/file/:token` view with active / expired / not-found / error states, using the emulated `api.getFileInfo()`.

## Background

Spec §8 defines two visible states:

```text
Your file is ready
example.zip
42.8 MB
Expires in 18 hours
[ Download ]
```

```text
File expired
This download link is no longer available.
Files are automatically deleted after expiration.
[ Upload another file ]
```

The frontend collapses "not found" into the expired state per the spec.

## Requirements

- `src/views/Download.vue` (replace the placeholder from TICKET-002).
- On mount, read `:token` from the route and call `api.getFileInfo(token)`.
- Render one of these states:
  - **Loading**: a simple "Loading…" while the call is pending.
  - **Active** (`status: 'active'`): show original filename, formatted size, formatted time remaining (`formatTimeRemaining(expiresAt)`), and a `Download` button.
  - **Expired** (`status: 'expired'`): show the spec's expired message and an `Upload another file` button that navigates to `/`.
  - **Error** (network failure / malformed response): show "Something went wrong. Please try the link again later." with the same `Upload another file` action.
- `Download` button is a real anchor pointing at `directDownloadUrl` (i.e., `/d/:token`):
  - Use `<a href="/d/:token" download>` so the browser handles it natively.
  - In the emulated frontend phase, this will 404 — that's expected. Add a `// EMULATED:` comment near it.
- Use `formatBytes` and `formatTimeRemaining` from TICKET-004.

## Acceptance criteria

- Visiting `/file/<active-token>` shows filename, size, "Expires in …", and a Download button pointing at `/d/<token>`.
- Visiting `/file/<expired-token>` (use the sentinel token defined in TICKET-003) shows the expired state.
- Visiting `/file/<malformed-token-that-throws>` shows the generic error state.
- The `Upload another file` action navigates to `/`.
- Refreshing the page on any state re-runs `getFileInfo` correctly.

## Files likely involved

- `frontend/src/views/Download.vue`
- `frontend/src/api.ts` (consumer — should already support `expired-test` sentinel from TICKET-003)
- `frontend/src/utils/formatBytes.ts`, `frontend/src/utils/formatTime.ts`

## Out of scope

- Password-protected downloads (future).
- Rendering download progress (the browser does this).
- Refresh-on-interval to update the "expires in" string (acceptable to leave static for v1).

## Notes for implementation

- The page should be usable even with JS disabled at the link level (the `<a>` tag works on its own). Not a hard requirement — just don't go out of your way to prevent it.
- Don't fetch on every route-param change unless you actually navigate between two different `/file/:token` URLs in one session (unlikely). A single fetch on mount is fine.
