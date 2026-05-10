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
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  background: #f7fafc;
}

.label {
  margin: 0;
  font-weight: 600;
}

.link {
  word-break: break-all;
  color: #1a365d;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.primary-btn,
.open-btn,
.reset-btn {
  padding: 8px 16px;
  font: inherit;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: inline-flex;
  align-items: center;
}

.primary-btn {
  background: #1f2937;
  color: #fff;
  border-color: #1f2937;
}
</style>
