<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ApiError,
  getFileInfo,
  getStats,
  type FileInfoActive,
  type StatsResponse,
} from '../api'
import { formatBytes } from '../utils/formatBytes'
import { formatTimeRemaining } from '../utils/formatTime'
import { SAFETY_LIMIT_MESSAGE } from '../messages'

const props = defineProps<{ token: string }>()

type ViewState = 'loading' | 'active' | 'expired' | 'error'

const state = ref<ViewState>('loading')
const info = ref<FileInfoActive | null>(null)
const stats = ref<StatsResponse | null>(null)

const downloadsDisabled = computed(() => stats.value?.downloadsEnabled === false)

async function load() {
  state.value = 'loading'
  try {
    const [fileResponse, statsResponse] = await Promise.allSettled([
      getFileInfo(props.token),
      getStats(),
    ])

    if (statsResponse.status === 'fulfilled') {
      stats.value = statsResponse.value
    }

    if (fileResponse.status === 'rejected') {
      const err = fileResponse.reason
      if (err instanceof ApiError && (err.error === 'EXPIRED' || err.error === 'FILE_NOT_FOUND')) {
        state.value = 'expired'
      } else {
        state.value = 'error'
      }
      return
    }

    const response = fileResponse.value
    if (response.status === 'active') {
      info.value = response
      state.value = 'active'
    } else {
      state.value = 'expired'
    }
  } catch {
    state.value = 'error'
  }
}

onMounted(load)
</script>

<template>
  <section class="download">
    <p v-if="state === 'loading'" class="loading">Loading…</p>

    <template v-else>
      <p v-if="downloadsDisabled" class="safety-banner" role="alert">
        {{ SAFETY_LIMIT_MESSAGE }}
      </p>

      <article v-if="state === 'active' && info" class="card">
        <h1>Your file is ready</h1>
        <p class="filename">{{ info.originalName }}</p>
        <p class="size">{{ formatBytes(info.sizeBytes) }}</p>
        <p class="expires">{{ formatTimeRemaining(info.expiresAt) }}</p>
        <!-- EMULATED: /d/:token is served by the (deferred) backend. The anchor
             will 404 during the frontend-first phase. -->
        <a
          v-if="!downloadsDisabled"
          class="download-btn"
          :href="`/d/${info.token}`"
          :download="info.originalName"
        >
          Download
        </a>
        <button v-else type="button" class="download-btn" disabled>Download</button>
      </article>

      <article v-else-if="state === 'expired'" class="card">
        <h1>File expired</h1>
        <p>This download link is no longer available.</p>
        <p>Files are automatically deleted after expiration.</p>
        <RouterLink to="/" class="download-btn">Upload another file</RouterLink>
      </article>

      <article v-else class="card">
        <h1>Something went wrong</h1>
        <p>Please try the link again later.</p>
        <RouterLink to="/" class="download-btn">Upload another file</RouterLink>
      </article>
    </template>
  </section>
</template>

<style scoped>
.download {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.loading {
  color: var(--color-muted);
}

.safety-banner {
  width: 100%;
  padding: var(--space-3) 16px;
  border-radius: var(--radius);
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  color: var(--color-warning-text);
  text-align: center;
}

.card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  text-align: center;
}

.card h1 {
  margin-block-end: var(--space-2);
}

.filename {
  font-weight: 600;
  word-break: break-all;
}

.size,
.expires {
  color: var(--color-muted);
}

.download-btn {
  margin-top: var(--space-3);
  min-height: var(--tap-target);
  padding: 10px 22px;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}

.download-btn:hover {
  background: #2d3748;
  border-color: #2d3748;
}

.download-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
