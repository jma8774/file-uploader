# Workflows

## Implementing a feature

1. Read the active ticket in `ai/tickets/active/`.
2. Read `ai/project.md`, `ai/architecture.md`, `ai/conventions.md`.
3. Inspect the existing code (small repo — usually ~5 files).
4. Identify the smallest safe change.
5. Implement.
6. Manually verify in the dev server (`npm run dev`). For UI changes, exercise the golden path and any error states the ticket lists.
7. Update relevant `ai/` docs if behavior, structure, or contracts changed.
8. Move the ticket from `active/` → `done/` only if the user asks.

## Fixing a bug

1. Reproduce in the dev server.
2. Locate the smallest faulty area.
3. Fix the root cause; don't paper over symptoms.
4. Add a manual repro step to the PR description (or a test if a test framework is set up).
5. If the bug reveals a wrong assumption in the `ai/` docs, update them in the same change.

## Adding or changing tests

No test framework is wired up yet. When adding one:
- Use Vitest for unit, Vue Test Utils for components, Playwright (optional) for e2e.
- Co-locate `*.test.ts` next to the unit under test, or use `__tests__/` if it gets crowded.
- File a small ADR explaining the choice.

## Updating the API client

The backend is emulated. When you change a function signature in `src/api.ts`:
- Update both the real shape (per `ai/context/api-contracts.md`) and the emulated implementation.
- Update all callers in the same change.
- If the change diverges from the spec'd backend contract, update `ai/context/api-contracts.md` and call it out — the eventual real backend will need to match.

## Adding a new page

1. Add a route in `src/main.ts` (or wherever the router is mounted).
2. Add the view component in `src/views/`.
3. Add a link/redirect path if anything else needs to navigate there.

## Preparing a pull request

- Short, specific title (what changed).
- Summary: what the user-visible behavior is now, plus a screenshot/gif for UI work.
- Test plan: manual steps to reproduce. If you wrote tests, mention them.
- Note any `ai/` doc changes.

## Updating project context

When behavior, architecture, APIs, conventions, or workflows change, update the relevant `ai/` file in the same change. Stale docs are worse than no docs.
