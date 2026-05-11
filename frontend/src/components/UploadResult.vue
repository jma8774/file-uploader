<script setup lang="ts">
import { computed, ref } from 'vue'
import { CheckCircle2, Copy, ExternalLink, RotateCcw } from 'lucide-vue-next'
import type { UploadResponse } from '../api'

const props = defineProps<{ response: UploadResponse }>()

const emit = defineEmits<{
  'upload-another': []
}>()

const fullUrl = computed(() => `${window.location.origin}${props.response.downloadPageUrl}`)

const copied = ref(false)
let copiedTimer: number | undefined

function legacyCopy(text: string): boolean {
  // Fallback for non-secure contexts (e.g., plain http://<ip>) where
  // navigator.clipboard is undefined. document.execCommand('copy') is
  // deprecated but every browser still honors it as a fallback.
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(textarea)
  return ok
}

async function copyLink() {
  let ok = false
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(fullUrl.value)
      ok = true
    } catch {
      ok = false
    }
  }
  if (!ok) {
    ok = legacyCopy(fullUrl.value)
  }
  if (!ok) return

  copied.value = true
  window.clearTimeout(copiedTimer)
  copiedTimer = window.setTimeout(() => {
    copied.value = false
  }, 1500)
}
</script>

<template>
  <div class="success-panel" aria-live="polite">
    <div class="success-header">
      <span class="success-icon">
        <CheckCircle2 :size="22" :stroke-width="2.2" />
      </span>
      <div>
        <p class="success-title">Upload successful!</p>
        <p class="success-copy">
          Your file is ready to share. This link will expire in 24 hours.
        </p>
      </div>
    </div>

    <div class="link-row">
      <div class="link-field">
        <span class="link-text" :title="fullUrl">{{ fullUrl }}</span>
      </div>
      <button type="button" class="copy-button" @click="copyLink">
        <Copy :size="16" :stroke-width="2.2" />
        {{ copied ? 'Copied' : 'Copy Link' }}
      </button>
    </div>

    <div class="footer-actions">
      <a
        :href="response.downloadPageUrl"
        target="_blank"
        rel="noopener"
        class="footer-link"
      >
        <ExternalLink :size="14" :stroke-width="2.2" />
        Open link in new tab
      </a>
      <button type="button" class="footer-link as-button" @click="emit('upload-another')">
        <RotateCcw :size="14" :stroke-width="2.2" />
        Upload another
      </button>
    </div>
  </div>
</template>

<style scoped>
.success-panel {
  margin: 0 auto;
  max-width: 620px;
  width: 100%;
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
  border-radius: var(--radius-pill);
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
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 120ms ease;
}

.copy-button:hover {
  background: var(--color-accent-hover);
}

.footer-actions {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-soft);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  line-height: 1;
  transition: color 120ms ease;
}

.footer-link:hover {
  color: var(--color-text);
}

.footer-link.as-button {
  background: transparent;
  border: 0;
  padding: 0;
  /* Use font-family: inherit (not the `font: inherit` shorthand) so the
     button keeps the .footer-link size / weight / line-height instead of
     being reset to the body's values. */
  font-family: inherit;
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
</style>
