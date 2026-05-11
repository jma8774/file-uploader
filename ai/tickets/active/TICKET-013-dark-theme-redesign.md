# TICKET-013: Subtle Dark Mode Minimal redesign

## Status

Active

## Goal

Replace the placeholder light theme from TICKET-011 with the **Subtle Dark Mode Minimal** look defined in `ai/context/theme-spec.md` and the reference mock at `~/Downloads/ChatGPT Image May 10, 2026, 08_08_55 PM.png`. The structural layout grows a top header and a hero section above the upload card, and the stats panel becomes a card grid.

## Background

The frontend is functionally complete after TICKETs 001–012. TICKET-011 established a working light theme as a placeholder so the UI was usable while we built behavior. The product direction is now a calm, dark, slightly-technical SaaS aesthetic — see the theme spec for the color system, layout, typography, and component-level rules.

This is a visual + structural pass. Behavior (state machines, emulated API, validation, tests) stays as-is. Tests that assert specific UI strings will need updates to match the new copy.

## Requirements

### Tokens + global

- Replace `frontend/src/assets/styles.css` with the dark token set from the theme spec (color, shadow, radii, spacing — keep what we have where the spec doesn't conflict).
- Body gets the layered radial-gradient background from the spec (top-center blue glow, bottom-right teal glow). Keep it subtle.
- Default font is **Inter** with system fallbacks. Load it from Google Fonts in `index.html` so we don't add a runtime dependency. The conventions ban on web fonts is lifted for this ticket; update `ai/conventions.md`.
- `:focus-visible` becomes `outline: 2px solid var(--color-primary); outline-offset: 3px;` (no more box-shadow ring).

### Layout shell

- `App.vue` becomes the page shell with the `.page-shell` rule (`width: min(1120px, calc(100% - 32px))`), not the old 640 px max-width.
- New `AppHeader.vue` with logo (cloud icon + "FileDrop"), placeholder nav links (Home active, How it Works, Features, Pricing, FAQ), and a right cluster (moon icon, Log in link, Sign up button). Nav links collapse below 720 px. v1 keeps them as `<a href="#">` placeholders — no real routes.
- New `HeroSection.vue` with the badge ("Fast. Secure. Temporary."), the two-line headline ("Upload a file." / "Get a *temporary link*." with the second word in `--color-primary`), and the subtitle.

### Upload card

- `FileUploader.vue` is the focal element on Home:
  - Outer card with the theme-spec gradient surface + `--shadow-card`.
  - Dropzone with the circular `dropzone-icon` (CloudUpload icon, 52 px), two copy lines ("Drag & drop your file here" / "or click to browse" — the "click to browse" portion is a button-styled link).
  - Selected file row with `FileText` icon, ellipsizing filename, subtle size text, and an X remove button. A small green check on the right confirms validity.
  - Primary upload button is full-width 48 px tall with the blue gradient (`linear-gradient(135deg, --color-primary, #2563eb)`) and a `translateY(-1px)` hover lift. Use the `CloudUpload` icon inside.
  - Progress: gradient track from primary → accent. Keep the "Upload progress: NN%" line above it (the original spec calls for the percentage to be visible).
  - Helper line below the dropzone: "Max file size: 100 MB. Files expire after 24 hours."
  - Error panel: `--color-danger-soft` background, danger border, light red text.

### Success panel

- `UploadResult.vue` becomes `UploadSuccessPanel`-style:
  - Teal-accent card with `CheckCircle2` icon, "Upload successful!" title, "Your file is ready to share. This link will expire in 24 hours." subtitle.
  - Link row with a dark read-only-looking field (the link text ellipsizes) and a teal **Copy Link** button (flips to **Copied** on click, same Clipboard logic as before).
  - The link row stacks below 560 px.
  - Keep the "Upload another" action — render it as a subtle secondary link below the link row.

### Stats

- `StatsPanel.vue` becomes a card grid (responsive: 4 → 2 → 1 columns at 900 / 520 px breakpoints):
  - Four primary cards: Total uploads, Total downloads, Active files, Storage used. Each has a colored icon tile, large value, label, and a subtext line:
    - Uploads: subtext "{uploadsToday} today"
    - Downloads: subtext "{downloadsToday} today"
    - Active files: subtext "in last 24 hours"
    - Storage used: subtext "of X GB used" + a thin gradient progress bar (storage/limit).
  - A fifth, full-width card below the grid for **Monthly transfer**: "X / 250 GB safety cap" with the same gradient bar. This keeps all seven values from the original spec on screen without crowding the top row.
- Loading / error / safety-cap branches keep the same logic — restyled to the dark warning panel for safety-cap.

### Download page

- `Download.vue` reuses the upload card style (gradient surface, rounded). Active state: filename + size + "Expires in X" + a blue gradient Download button. Expired / error: themed cards with **Upload another file** action.

### NotFound

- Themed to match (dark card + primary button) so it doesn't visually pop white.

### Icons

- Install `lucide-vue-next` and use the icons listed in the theme spec (CloudUpload, FileText, X, CheckCircle2, Copy, Upload, Download, Clock3, Database, Lock, TriangleAlert).

### Tests

- Update any unit / e2e tests that assert the old strings — primarily:
  - "Drop file here or click to choose" → "Drag & drop your file here" + "or click to browse".
  - Stats panel labels stay the same per the original spec (still "Total uploads" etc.), but the e2e selector strategies may need adjusting for the new DOM (cards instead of `<dl>`).
- All unit tests (`npm test`) and e2e tests (`npm run test:e2e`) must still pass.

## Acceptance criteria

- `npm run dev` shows the page rendering ~visually as in the reference image (allow for minor copy / spacing tweaks). The page is dark only.
- All five existing UI flows from TICKETs 005–010 still work — file pick, drag-drop, validation, progress, success result with copy, stats render, safety-cap banner, download landing page (active / expired / error).
- `npm run build`, `npm test`, and `npm run test:e2e` all pass.
- The Vitest unit suite and Playwright e2e suite from TICKET-012 have been updated to assert the new copy where it changed.
- Conventions updated: `ai/conventions.md` notes Inter is loaded via Google Fonts.

## Files likely involved

- `frontend/index.html`
- `frontend/package.json` (new dep: `lucide-vue-next`)
- `frontend/src/assets/styles.css`
- `frontend/src/App.vue`
- `frontend/src/components/AppHeader.vue` (new)
- `frontend/src/components/HeroSection.vue` (new)
- `frontend/src/components/FileUploader.vue`
- `frontend/src/components/UploadResult.vue`
- `frontend/src/components/StatsPanel.vue`
- `frontend/src/views/Home.vue`
- `frontend/src/views/Download.vue`
- `frontend/src/views/NotFound.vue`
- `frontend/src/**/*.test.ts` (updated assertions)
- `frontend/e2e/*.spec.ts` (updated assertions)
- `ai/conventions.md`
- `ai/context/theme-spec.md` (mirrored from ~/Downloads)

## Out of scope

- Real nav routes for Home/How it Works/Features/Pricing/FAQ — these stay as placeholder anchors. Building those pages is a separate ticket.
- Dark mode toggle / per-user theme preference. The product is dark-only for v1.
- New icon assets or custom illustrations.
- Backend changes — the emulated client and contracts stay identical.

## Notes for implementation

- The theme spec recommends formatBytes and formatTimeRemaining variants that differ slightly from ours (`value.toFixed(0)` at ≥10, `"18h 42m"`). Keep our existing implementations — they match the original product spec (`ai/context/spec.md`) and are covered by tests. The theme spec util section is informational.
- Keep the safety-cap message constant (`src/messages.ts`) — no copy change.
- Don't introduce dark-mode-only conditional code or a `dark` class on `<html>`. The site is dark-only; tokens are the only switch.
- If you find yourself adding more than a handful of bespoke component-level colors, you're missing a token — extract it.
