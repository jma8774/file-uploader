# Coding Conventions

## Stack

- Vue 3 (Composition API + `<script setup>`)
- Vite
- TypeScript (preferred over JS)
- Plain CSS (or scoped CSS in `.vue` files). No Tailwind / no CSS-in-JS unless justified.
- Vue Router for routes.
- Axios for the upload progress endpoint; the rest of `api.ts` can use `fetch` or axios — pick one and stay consistent.
- **Icons**: `lucide-vue-next`. Use existing icons before adding new SVG assets.
- **Font**: Inter (300–800), loaded via a `<link>` to Google Fonts in `index.html`. System fallbacks if the network is unavailable.
- **Theme**: dark only (Subtle Dark Mode Minimal). See `ai/context/theme-spec.md` and `src/assets/styles.css`. No light-mode branching — tokens are the only switch.

## File organization

- Components in `frontend/src/components/`.
- Page-level views in `frontend/src/views/`.
- Utilities in `frontend/src/utils/`.
- The API client is a single file: `frontend/src/api.ts`. Real and emulated implementations live behind the same exported functions.

## Naming conventions

- Component files: `PascalCase.vue` (e.g., `FileUploader.vue`).
- Composables: `useThing.ts`.
- Util files: `camelCase.ts` (`formatBytes.ts`).
- Route paths match the spec: `/` and `/file/:token`.
- Upload state values: `idle | selected | uploading | success | error` (strings, exactly these).

## API client conventions

- `api.ts` exports typed functions: `uploadFile`, `getFileInfo`, `getStats`, `getHealth`.
- Function signatures and return types must match the spec'd backend contracts (§9 of the spec). The emulated implementation produces matching shapes, so swapping in the real backend is a one-file change.
- Errors thrown by the API client must include `{ error, message }` so callers can render the right user-visible string.

## State management

- Local component state via `ref`/`reactive`. No Pinia/Vuex unless a third component needs to share state.
- Upload state lives inside `FileUploader.vue`; the resulting link is emitted to the parent which forwards to `UploadResult.vue`.

## Error handling

- Each network call goes through a try/catch in the calling component; errors set the local `error` state and display a user-visible message.
- Don't swallow errors. Always surface a clear message — see spec §21 for canonical wording.

## Logging

- `console.error` for unexpected failures during development.
- No analytics / no third-party logging in v1.

## Testing expectations

- TODO: Test framework not yet picked. When added, follow spec §20 frontend test list.
- Snapshot tests are discouraged; prefer behavior-focused assertions.

## Dependency rules

- Default answer is no. Vite, Vue, vue-router, axios are pre-approved. Anything else needs justification in the PR or an ADR.

## What not to do

- Don't refactor unrelated code while implementing a ticket.
- Don't add a UI framework or component library.
- Don't introduce real backend calls — backend is deferred.
- Don't use the original filename as anything other than display text.
- Don't bypass frontend size validation; it's a UX concern but should still be enforced.
- Don't put secrets in committed code.
