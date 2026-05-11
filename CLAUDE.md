# Claude / AI agent guidance

This repository is **public on GitHub**. Anything written here — code, tickets, ADRs, context docs — is visible to the world.

**Never put sensitive information in this repo.** No secrets, no real API keys, no production hostnames, no personal info, no customer data, no NDA material. Reference secrets by environment variable name only. If unsure, leave it out.

## Where to start

Project context for AI coding agents lives under [`ai/`](./ai/). Read these before making changes:

1. `ai/SKILL.md` — the loaded skill rules (including the no-sensitive-info rule above).
2. `ai/project.md` — what FileDrop is and where we are.
3. `ai/architecture.md` — system shape (frontend-first, backend emulated).
4. `ai/conventions.md` — coding conventions.
5. `ai/workflows.md` — how to implement / fix / ship.
6. `ai/tickets/active/` — what's currently being worked on.
7. `ai/decisions/` — ADRs.

The source code is the source of truth. The `ai/` directory provides orientation.

## Current phase

Frontend talks to a real backend over `/api/*` and `/d/*`. The MVP server (TICKETs 014–019) is built; hardening tickets (020 cleanup, 021 rate limits, 023 tests) remain. Run both with `npm run dev` from the repo root.
