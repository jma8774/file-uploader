<script setup lang="ts">
import { computed, ref } from 'vue'
import type { UploadResponse } from '../api'

const props = defineProps<{ response: UploadResponse }>()

const emit = defineEmits<{
  'upload-another': []
}>()

const fullUrl = computed(() => `${window.location.origin}${props.response.downloadPageUrl}`)

const copied = ref(false)
let copiedTimer: number | undefined

async function copyLink() {
  try {
    await navigator.clipboard.writeText(fullUrl.value)
    copied.value = true
    window.clearTimeout(copiedTimer)
    copiedTimer = window.setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    // Clipboard API unavailable (e.g., insecure context). The link below is
    // still selectable for manual copy.
    copied.value = false
  }
}
</script>

<template>
  <div class="result">
    <p class="label">Your link:</p>
    <a class="link" :href="response.downloadPageUrl" target="_blank" rel="noopener">
      {{ fullUrl }}
    </a>
    <div class="actions">
      <button type="button" class="primary-btn" @click="copyLink">
        {{ copied ? 'Copied' : 'Copy Link' }}
      </button>
      <a
        class="open-btn"
        :href="response.downloadPageUrl"
        target="_blank"
        rel="noopener"
      >
        Open Link
      </a>
      <button type="button" class="reset-btn" @click="emit('upload-another')">
        Upload another
      </button>
    </div>
  </div>
</template>

<style scoped>
.result {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

.label {
  font-weight: 600;
}

.link {
  word-break: break-all;
  color: var(--color-accent-strong);
}

.actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.primary-btn,
.open-btn,
.reset-btn {
  min-height: var(--tap-target);
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: background-color 120ms ease, border-color 120ms ease;
}

.open-btn:hover,
.reset-btn:hover {
  border-color: var(--color-muted);
}

.primary-btn {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  border-color: var(--color-accent);
}

.primary-btn:hover {
  background: #2d3748;
  border-color: #2d3748;
}
</style>
