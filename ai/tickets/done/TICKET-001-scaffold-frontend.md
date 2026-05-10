# TICKET-001: Scaffold Vue + Vite + TypeScript frontend

## Status

Active

## Goal

Create the `frontend/` project skeleton so subsequent tickets have a place to add components, routes, and the API client.

## Background

The repository currently contains only `ai/` docs and a `.gitignore`. The product is a Vue 3 SPA built with Vite. We are in the frontend-first phase (see ADR-0002), so this ticket only scaffolds the frontend — no backend.

## Requirements

- Create `frontend/` at the repo root.
- Initialize a Vue 3 + Vite + TypeScript project inside it (e.g., `npm create vite@latest frontend -- --template vue-ts`, or equivalent manual setup).
- Trim the default boilerplate down to a clean starting point:
  - Replace the demo `HelloWorld` content in `App.vue` with a placeholder homepage shell (app title + short description from the spec).
  - Delete unused demo assets.
- `frontend/package.json` should have working `dev`, `build`, and `preview` scripts.
- `frontend/.gitignore` is either present (Vite generates one) or covered by the repo-root `.gitignore`. Don't commit `node_modules/` or `dist/`.

## Acceptance criteria

- `cd frontend && npm install && npm run dev` starts the dev server on the default Vite port.
- The dev page renders the app title and the spec's homepage description text.
- `npm run build` produces a `dist/` folder with no errors.
- `tsc --noEmit` (or `vue-tsc --noEmit`, whatever the template uses) passes.

## Files likely involved

- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/vite.config.ts`
- `frontend/index.html`
- `frontend/src/main.ts`
- `frontend/src/App.vue`

## Out of scope

- Routing (TICKET-002).
- API client (TICKET-003).
- Any actual upload UI (TICKET-005+).
- Styling beyond what Vite ships with (TICKET-011).

## Notes for implementation

- TypeScript over JavaScript (per conventions).
- Composition API + `<script setup>`.
- Don't add UI libraries.
- Leave a `// TODO: routes` comment in `main.ts` where the router will be mounted in TICKET-002.
