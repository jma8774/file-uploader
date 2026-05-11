# ADR-0002: Build the frontend first against an emulated backend

## Status

Superseded by TICKET-022 (2026-05-10). The frontend now talks to the real
Node/Express backend (`/api/*` and `/d/*`); the emulation in `src/api.ts`
has been replaced with axios + fetch calls. This ADR stays in place for
historical context — the frontend-first phase made the UI buildable
before the backend existed, and the contract-matched emulation made the
swap a single-file change.

## Context

The full system in ADR-0001 spans a Vue frontend, Node/Express backend, SQLite DB, Nginx, and systemd. Building everything in parallel makes it hard to iterate on the UI — every UI change requires the backend to also be in a working state. We want fast feedback on the UI/UX (drag-drop, upload state machine, download page, stats panel) without standing up the server side first.

## Decision

Build the frontend first. All network calls go through `src/api.ts`, which currently returns canned data and emits fake upload-progress events. Real button clicks that would hit the backend (`/d/:token` download, copy-link, etc.) are either:

- noops with a `console.log`, **or**
- realistic frontend-only behavior (e.g., real Clipboard API for "copy link").

Emulated code paths are marked with a `// EMULATED:` comment so they're greppable when the real backend lands.

The function signatures, request shapes, and response shapes in `src/api.ts` must match the spec'd backend contracts exactly (see `ai/context/api-contracts.md`). When the backend is built, swapping the emulation out should be a one-file change.

## Consequences

**Benefits**
- Frontend can be designed, styled, and demoed end-to-end without the backend existing.
- Tightens the API contract early: the emulation is itself an executable spec.
- No infrastructure or environment setup needed to develop the UI.

**Tradeoffs**
- The emulation can drift from what a real backend would actually do (latency, error modes, edge cases). Mitigate by injecting some artificial latency and exercising error states explicitly.
- Two `src/api.ts` versions will need to coexist briefly during cutover.

## Alternatives considered

- **Build backend first**: rejected. Slower UX feedback; the user wants to see the frontend working first.
- **MSW (Mock Service Worker)**: rejected for v1. Adds a dependency for what amounts to ~6 functions returning canned data. Revisit if the emulation grows enough that a real intercept layer would be cleaner.
