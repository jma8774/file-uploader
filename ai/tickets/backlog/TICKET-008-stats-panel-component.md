# TICKET-008: `StatsPanel` component

## Status

Backlog

## Goal

Render the homepage stats panel under the upload area, fed by the emulated `api.getStats()`.

## Background

Spec §8:

```text
Site Stats
Total uploads        128
Total downloads      902
Active files         17
Storage used         1.8 GB / 6 GB
Uploads today        9
Downloads today      44
Monthly transfer     12.4 GB / 250 GB safety cap
```

All fields come from `StatsResponse` (`ai/context/api-contracts.md`).

## Requirements

- `src/components/StatsPanel.vue`.
- On mount, call `api.getStats()` and render the panel.
- Use `formatBytes` (TICKET-004) for storage and transfer values.
- Show a loading state while the call is pending (a simple "Loading stats…" or skeleton row).
- If the call fails, render "Stats unavailable" instead of the panel — do not block the rest of the page.
- Refresh: expose a `refresh()` method (or accept a parent-controlled `key` change) so a successful upload can trigger an update. Wiring that into `Home.vue` is part of this ticket.
- If `uploadsEnabled === false` or `downloadsEnabled === false`, show the spec's safety-cap message at the top of the panel:
  > Monthly safety limit reached. Uploads and downloads are temporarily paused to protect server bandwidth.
- Stats panel must never display anything not in the public fields list (see `ai/context/domain-model.md`).

## Acceptance criteria

- Loading state appears briefly (the emulated client injects latency), then values render.
- Storage and transfer values include both used + cap in the spec's format.
- After a successful upload (TICKET-006/007), the panel refreshes with new numbers (the emulated client should slightly bump its canned values each call so this is visible).
- Setting `uploadsEnabled: false` in the mock data renders the safety-cap banner.
- A forced error path (you can temporarily flip a mock flag) renders "Stats unavailable" instead of crashing the page.

## Files likely involved

- `frontend/src/components/StatsPanel.vue`
- `frontend/src/views/Home.vue` (mount + wire refresh trigger)
- `frontend/src/api.ts` (only if you need to add an `uploadsToday`-like bump to the canned data)

## Out of scope

- Charts / daily trend graphs (future).
- Auto-refresh on a timer (future — for now only refresh after an upload).
- Filtering or per-file detail (intentionally not allowed by the privacy rules).

## Notes for implementation

- Keep the markup boring — a `<dl>` or a simple two-column grid. Styling lives in TICKET-011.
- Don't import any chart library.
