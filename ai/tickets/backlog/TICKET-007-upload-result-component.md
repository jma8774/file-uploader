# TICKET-007: `UploadResult` component (link + copy + open)

## Status

Backlog

## Goal

Render the resulting download link after a successful upload, with working "Copy Link" and "Open Link" buttons.

## Background

Spec §8 shows the post-upload UI:

```text
Your link:
https://example.com/file/abc123
[ Copy Link ] [ Open Link ]
```

After TICKET-006, the parent has the `UploadResponse` shape from `api.ts`. This ticket renders it.

## Requirements

- `src/components/UploadResult.vue`, accepts a prop of the `UploadResponse` type (or just `token` + `downloadPageUrl`).
- Compute the full absolute URL for display: `${window.location.origin}${downloadPageUrl}` (so it's copy-pastable into another browser).
- Show the URL as text and as a `<a>` so it's selectable.
- `Copy Link` button:
  - Uses the Clipboard API (`navigator.clipboard.writeText`).
  - Shows a brief "Copied" affirmation (e.g., button label flips to "Copied" for ~1.5s, then reverts).
  - Falls back gracefully if the Clipboard API isn't available — at minimum, the link itself is still selectable.
- `Open Link` button: opens the download page in a new tab (`<a target="_blank" rel="noopener">` or `window.open(url, '_blank', 'noopener')`).
- Render an `Upload another` action that resets the parent state back to `idle`.

## Acceptance criteria

- After a successful emulated upload, the link displays with the right URL.
- Clicking `Copy Link` puts the URL on the clipboard and flips the label to "Copied".
- Clicking `Open Link` opens the download landing page in a new tab.
- Clicking `Upload another` returns the homepage to the initial empty state.

## Files likely involved

- `frontend/src/components/UploadResult.vue`
- `frontend/src/views/Home.vue` (mount it conditionally on success)
- `frontend/src/components/FileUploader.vue` (emit an `upload-another`/reset event)

## Out of scope

- QR code, sharing menus, email send (not in v1).
- Server-side link analytics.

## Notes for implementation

- `Open Link` will land on the (still placeholder-or-real) `/file/:token` view from TICKET-002/009 — that's fine.
- Don't construct the URL by string-concatenating with a hardcoded host. Use `window.location.origin`.
- The "Copied" toast can be plain reactive state — don't pull in a toast library.
