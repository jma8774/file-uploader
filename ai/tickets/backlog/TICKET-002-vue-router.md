# TICKET-002: Add Vue Router with `/` and `/file/:token` routes

## Status

Backlog

## Goal

Set up client-side routing with the two routes from the spec so future tickets can land their views on the correct paths.

## Background

The spec defines two pages: `/` (home + upload + stats) and `/file/:token` (download landing page). We need the router wired up before building either page in detail.

## Requirements

- Install `vue-router@4`.
- Create `src/views/Home.vue` and `src/views/Download.vue` as placeholder shells (each just an `<h1>` with the page name and the route param if relevant).
- Configure routes in `src/main.ts` (or a `src/router.ts` if it keeps `main.ts` cleaner):
  - `/` → `Home`
  - `/file/:token` → `Download`, with the `token` param exposed as a prop or via `useRoute()`.
- Add a catch-all `/:pathMatch(.*)*` route that renders a minimal "Not found" view (can live inline in the router config or as `views/NotFound.vue`).
- `App.vue` should render `<router-view />` and nothing else page-specific.

## Acceptance criteria

- Visiting `/` shows the Home placeholder.
- Visiting `/file/abc123` shows the Download placeholder and the placeholder reads back `abc123`.
- Visiting `/garbage` shows the Not found page.
- `npm run build` passes.

## Files likely involved

- `frontend/package.json`
- `frontend/src/main.ts` (or new `frontend/src/router.ts`)
- `frontend/src/App.vue`
- `frontend/src/views/Home.vue`
- `frontend/src/views/Download.vue`
- `frontend/src/views/NotFound.vue` (optional)

## Out of scope

- Any real content on Home or Download (later tickets).
- API calls (TICKET-003).
- Styling (TICKET-011).

## Notes for implementation

- Use HTML5 history mode (`createWebHistory()`), not hash mode.
- Keep the router config small — no nested routes, no route-level guards in v1.
