---
name: project-context
description: Use this skill when working in this repository to understand the project, architecture, current tasks, implementation constraints, and decision history before making code changes. This skill provides AI-readable project context, tickets, architecture notes, conventions, and workflow rules so coding agents can make safer, better-scoped changes.
---

# Project Context Skill

You are working inside this repository as a coding assistant.

Before making meaningful code changes, read the project context in this order:

1. `ai/project.md`
2. `ai/architecture.md`
3. `ai/conventions.md`
4. `ai/workflows.md`
5. Relevant files under `ai/context/`
6. Relevant ticket under `ai/tickets/active/`
7. Relevant ADRs under `ai/decisions/`

The code is the source of truth. The `ai/` directory provides orientation, constraints, and task context.

If the docs conflict with the code, identify the conflict and update the docs or code as appropriate.

## Rules

- Prefer small, scoped changes.
- Do not refactor unrelated code.
- Follow existing patterns.
- Add or update tests when behavior changes.
- Do not add dependencies casually.
- Check ADRs before changing architecture.
- Update relevant `ai/` docs when changing behavior, architecture, APIs, database schema, integrations, deployment, or workflows.
- Do not create `ai/agents/`, `ai/prompts/`, or `ai/examples/`.

## Public repository — no sensitive information

This repository is pushed to GitHub and is public. **Anything written under `ai/` (tickets, ADRs, context files, glossary) ends up on the public internet.** When writing tickets, ADRs, or any other docs in this repo:

- No secrets, tokens, API keys, passwords, or `.env` values — not even placeholders that look real.
- No production hostnames, IP addresses, internal URLs, or server paths beyond what the public spec already mentions.
- No personal information (names, emails, phone numbers) other than the repo's own public git identity.
- No customer data, private feedback, or anything received under NDA.
- No copy-pasted error logs that contain stack traces with absolute paths from a personal machine, request IDs tied to real users, etc.

If you need to reference a secret, refer to its environment variable name only (`IP_HASH_SECRET`), never its value. If you're unsure whether something is sensitive, leave it out and ask.
