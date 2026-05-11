# FileDrop Dark Theme UI Specification

## Purpose

This document defines the **dark themed FileDrop frontend** style direction. It is intended to be dropped into the project repo and used by an AI coding assistant or developer to implement the Vue/Vite frontend.

The design target is a **subtle dark mode minimal SaaS interface**: clean, calm, modern, and trustworthy. It should feel polished but remain easy to implement with standard HTML/CSS components, CSS variables, and icon libraries. No light mode is required.

---

## Theme Summary

**Theme name:** Subtle Dark Mode Minimal

The UI should feel:

- Calm
- Secure
- Minimal
- Modern
- Trustworthy
- Slightly technical, but not cyberpunk

Avoid:

- Neon cyberpunk overload
- Retro or pixel art
- Custom mascots
- Heavy illustrations
- Complex animation
- Excessive gradients

The UI should be built mostly from:

- Dark backgrounds
- Slate cards
- Blue and teal accents
- Rounded corners
- Thin borders
- Soft shadows
- Simple icons
- Clear typography

---

## Page Structure

The main home page contains:

```text
App Shell
├── Top Header
├── Hero Section
├── Upload Card
├── Stats Cards
└── Upload Success Panel
```

The stats section should appear directly under the upload card on the home page. There is no separate stats page for v1.

---

## Color System

Use CSS variables for all theme values.

```css
:root {
  --color-bg: #07111f;
  --color-bg-soft: #0b1626;
  --color-surface: #111c2e;
  --color-surface-elevated: #162235;
  --color-surface-muted: #1b2940;

  --color-border: rgba(148, 163, 184, 0.18);
  --color-border-strong: rgba(148, 163, 184, 0.32);

  --color-text: #f8fafc;
  --color-text-muted: #94a3b8;
  --color-text-soft: #cbd5e1;

  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-primary-soft: rgba(59, 130, 246, 0.14);

  --color-accent: #14b8a6;
  --color-accent-hover: #0d9488;
  --color-accent-soft: rgba(20, 184, 166, 0.14);

  --color-success: #22c55e;
  --color-success-soft: rgba(34, 197, 94, 0.14);

  --color-warning: #f59e0b;
  --color-warning-soft: rgba(245, 158, 11, 0.14);

  --color-danger: #ef4444;
  --color-danger-soft: rgba(239, 68, 68, 0.14);

  --shadow-card: 0 18px 60px rgba(0, 0, 0, 0.35);
  --shadow-soft: 0 10px 30px rgba(0, 0, 0, 0.24);
}
```

### Background

```css
body {
  background:
    radial-gradient(circle at top center, rgba(59, 130, 246, 0.18), transparent 34rem),
    radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.12), transparent 30rem),
    var(--color-bg);
  color: var(--color-text);
}
```

Keep the background subtle. It should add depth without looking neon or noisy.

---

## Typography

Recommended fonts:

```text
Inter
Geist
Manrope
Plus Jakarta Sans
```

Preferred default:

```css
body {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

Hero headline:

```css
.hero-title {
  font-size: clamp(2.4rem, 6vw, 4.5rem);
  line-height: 0.98;
  font-weight: 800;
  letter-spacing: -0.055em;
}

.hero-accent {
  color: var(--color-primary);
}
```

Mobile:

```css
@media (max-width: 720px) {
  .hero-title {
    font-size: clamp(2rem, 12vw, 3rem);
    line-height: 1.02;
  }
}
```

---

## Layout

```css
.page-shell {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
}

@media (max-width: 720px) {
  .page-shell {
    width: min(100% - 20px, 1120px);
  }
}
```

Recommended spacing:

```text
Header bottom margin: 64px desktop, 36px mobile
Hero to upload card: 32px desktop, 24px mobile
Upload card to stats: 24px
Stats to success panel: 16px to 24px
Bottom padding: 48px desktop, 28px mobile
```

---

## Header

Desktop layout:

```text
[Logo FileDrop]      [Home How it Works Features Pricing FAQ]      [Moon icon] [Log in] [Sign Up]
```

For v1, nav links can be placeholders or removed.

```css
.header {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 800;
  font-size: 1.35rem;
  color: var(--color-text);
  text-decoration: none;
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: grid;
  place-items: center;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.nav-links a {
  color: inherit;
  text-decoration: none;
}

.nav-links a:hover,
.nav-links .is-active {
  color: var(--color-text);
}

@media (max-width: 720px) {
  .nav-links {
    display: none;
  }

  .header {
    height: 64px;
  }
}
```

---

## Hero Section

Content:

```text
Fast. Secure. Temporary.

Upload a file.
Get a temporary link.

Share files instantly. All files are automatically deleted after 24 hours.
```

```css
.hero {
  text-align: center;
  padding: 58px 0 0;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  background: var(--color-accent-soft);
  border: 1px solid rgba(20, 184, 166, 0.28);
  color: #5eead4;
  font-size: 0.875rem;
  font-weight: 600;
}

.hero-title {
  margin: 20px auto 0;
  max-width: 760px;
}

.hero-subtitle {
  margin: 18px auto 0;
  max-width: 520px;
  color: var(--color-text-muted);
  font-size: 1.125rem;
  line-height: 1.55;
}

@media (max-width: 720px) {
  .hero {
    padding-top: 32px;
  }

  .hero-subtitle {
    font-size: 1rem;
  }
}
```

---

## Upload Card

The upload card is the main interaction area.

```css
.upload-card {
  margin: 32px auto 0;
  max-width: 620px;
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(22, 34, 53, 0.96), rgba(17, 28, 46, 0.96));
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
}

@media (max-width: 720px) {
  .upload-card {
    margin-top: 24px;
    padding: 14px;
    border-radius: 18px;
  }
}
```

### Dropzone

```css
.dropzone {
  min-height: 150px;
  border: 1.5px dashed var(--color-border-strong);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-text-soft);
  background: rgba(7, 17, 31, 0.28);
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
}

.dropzone:hover,
.dropzone.is-dragging {
  border-color: rgba(59, 130, 246, 0.75);
  background: var(--color-primary-soft);
}

.dropzone-icon {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(148, 163, 184, 0.12);
  color: var(--color-text);
}

.dropzone-link {
  color: var(--color-primary);
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  border: 0;
  padding: 0;
}
```

---

## Selected File Row

```css
.file-row {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem;
  border-radius: 14px;
  background: rgba(7, 17, 31, 0.36);
  border: 1px solid var(--color-border);
}

.file-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.file-meta {
  min-width: 0;
  flex: 1;
}

.file-name {
  color: var(--color-text);
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  margin-top: 0.2rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.file-remove-button {
  color: var(--color-text-muted);
  border: 0;
  background: transparent;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
}

.file-remove-button:hover {
  color: var(--color-text);
}
```

---

## Upload Button and Progress

```css
.primary-button {
  width: 100%;
  margin-top: 14px;
  height: 48px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary), #2563eb);
  color: white;
  font-weight: 750;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  cursor: pointer;
  transition: transform 150ms ease, filter 150ms ease, opacity 150ms ease;
}

.primary-button:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.progress-track {
  margin-top: 12px;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.14);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  transition: width 180ms ease;
}
```

---

## Stats Section

Desktop:

```css
.stats-grid {
  margin: 24px auto 0;
  max-width: 980px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
```

Responsive:

```css
@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
```

Card:

```css
.stat-card {
  padding: 18px;
  border-radius: 16px;
  background: rgba(22, 34, 53, 0.82);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
  display: flex;
  gap: 0.9rem;
  align-items: center;
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.stat-icon.uploads {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.stat-icon.downloads {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.stat-icon.active {
  background: rgba(168, 85, 247, 0.14);
  color: #a78bfa;
}

.stat-icon.storage {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.stat-label {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.stat-value {
  margin-top: 0.2rem;
  color: var(--color-text);
  font-size: 1.5rem;
  font-weight: 800;
}

.stat-subtext {
  margin-top: 0.2rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
```

Storage progress:

```css
.storage-progress-track {
  margin-top: 0.5rem;
  height: 7px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
  overflow: hidden;
}

.storage-progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
}
```

---

## Success Panel

```css
.success-panel {
  margin: 16px auto 0;
  max-width: 980px;
  padding: 20px;
  border-radius: 18px;
  border: 1px solid rgba(20, 184, 166, 0.4);
  background: linear-gradient(180deg, rgba(20, 184, 166, 0.12), rgba(20, 184, 166, 0.06));
  box-shadow: var(--shadow-soft);
}

.success-header {
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
}

.success-icon {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  background: var(--color-success-soft);
  color: var(--color-success);
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.success-title {
  font-weight: 800;
  color: var(--color-text);
}

.success-copy {
  margin-top: 0.2rem;
  color: var(--color-text-soft);
}
```

Link row:

```css
.link-row {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.link-field {
  min-width: 0;
  height: 46px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: rgba(7, 17, 31, 0.34);
  color: var(--color-text-soft);
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  overflow: hidden;
}

.link-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-button {
  height: 46px;
  padding: 0 18px;
  border-radius: 12px;
  border: 0;
  background: var(--color-accent);
  color: white;
  font-weight: 750;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.copy-button:hover {
  background: var(--color-accent-hover);
}

@media (max-width: 560px) {
  .link-row {
    grid-template-columns: 1fr;
  }

  .copy-button {
    width: 100%;
    justify-content: center;
  }
}
```

---

## Error and Safety States

Upload error:

```css
.error-panel {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.36);
  background: var(--color-danger-soft);
  color: #fecaca;
  font-size: 0.875rem;
}
```

Safety limit warning:

```css
.warning-panel {
  margin: 16px auto 0;
  max-width: 620px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(245, 158, 11, 0.32);
  background: var(--color-warning-soft);
  color: #fde68a;
}
```

Recommended copy:

```text
Monthly safety limit reached
Uploads and downloads are temporarily paused to protect the server bandwidth.
```

---

## Download Page

The `/file/:token` page should reuse the same dark theme.

Layout:

```text
Header
Centered download card
Optional footer/status
```

Download card content:

```text
Your file is ready
filename.zip
45.2 MB
Expires in 18 hours
[Download]
```

Expired state:

```text
File expired
This link is no longer available.
[Upload another file]
```

Use the same card, button, border, and typography tokens.

---

## Icon System

Use `lucide-vue-next`.

Suggested icons:

```text
Logo: CloudUpload
Upload area: CloudUpload
Selected file: FileText
Remove: X
Success: CheckCircle2
Copy: Copy
Uploads stat: Upload
Downloads stat: Download
Active files: Clock3 or FolderOpen
Storage: Database
Security/helper text: Lock
Warning: TriangleAlert
```

---

## Motion and Interaction

Keep motion subtle.

Use:

- Button hover lift: `translateY(-1px)`
- Dropzone border/background change on drag
- Progress bar width transition
- Copy button text changes from `Copy Link` to `Copied`

Avoid:

- Page fly-ins
- Parallax
- Constant glowing effects
- Complex loading animation

---

## Mobile Compatibility

Breakpoints:

```css
/* suggested */
520px: phone
720px: larger phone / small tablet
900px: tablet
```

Rules:

- Hide nav links below `720px`.
- Keep logo visible.
- Reduce hero padding.
- Make upload card full width.
- Stats cards become 2 columns below `900px`.
- Stats cards become 1 column below `520px`.
- Success link row stacks below `560px`.
- All touch targets should be at least `44px` high.
- Long filenames and URLs must ellipsize.

---

## Accessibility

Required:

- File input must have a label.
- Drag/drop area should also be clickable.
- Buttons must have visible focus states.
- Copy button should announce copied state with text change.
- Do not rely on color alone for errors.
- Use semantic button elements.
- Use `aria-live="polite"` for upload success/error messages.

Focus ring:

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}
```

---

## Vue Component Suggestions

Recommended components:

```text
App.vue
components/
├── AppHeader.vue
├── HeroSection.vue
├── FileUploader.vue
├── StatsCards.vue
├── UploadSuccessPanel.vue
├── DownloadCard.vue
└── StatusNotice.vue
```

`FileUploader.vue` should handle:

- Drag/drop state
- File input selection
- File validation display
- Upload button disabled state
- Upload progress
- Emits upload success result

`StatsCards.vue` should handle:

- Fetching or receiving `/api/stats`
- Formatting bytes
- Rendering upload/download/active/storage cards
- Responsive grid

`UploadSuccessPanel.vue` should handle:

- Displaying generated link
- Copying link to clipboard
- Showing copied state
- Showing expiration info

---

## Utility Functions

```ts
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
}
```

```ts
export function formatTimeRemaining(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now();

  if (diffMs <= 0) return 'Expired';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 1) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
```

---

## Copywriting

Hero:

```text
Upload a file.
Get a temporary link.
```

Subtitle:

```text
Share files instantly. All files are automatically deleted after 24 hours.
```

Dropzone:

```text
Drag & drop your file here
or click to browse
```

Helper:

```text
Max file size: 100 MB. Files expire after 24 hours.
```

Success:

```text
Upload successful!
Your file is ready to share. This link will expire in 24 hours.
```

Safety limit:

```text
Monthly safety limit reached
Uploads and downloads are temporarily paused to protect the server bandwidth.
```

---

## Final Visual Checklist

Before considering the frontend complete, confirm:

- The page is dark-only.
- The upload card is the visual center.
- Stats are directly below the upload area.
- No custom art assets are required.
- The UI works on mobile screens.
- Long filenames ellipsize properly.
- Long URLs ellipsize properly.
- Upload progress is visible.
- Error and disabled states are styled.
- The monthly safety limit state is represented.
- The design feels calm, not neon/cyberpunk.
