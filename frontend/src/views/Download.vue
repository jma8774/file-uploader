<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Download as DownloadIcon, FileText, TriangleAlert } from 'lucide-vue-next'
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
      <p v-if="downloadsDisabled" class="warning-panel" role="alert">
        <TriangleAlert :size="18" :stroke-width="2.2" />
        <span>{{ SAFETY_LIMIT_MESSAGE }}</span>
      </p>

      <article v-if="state === 'active' && info" class="card">
        <span class="card-icon">
          <FileText :size="22" :stroke-width="2" />
        </span>
        <h1>Your file is ready</h1>
        <p class="filename" :title="info.originalName">{{ info.originalName }}</p>
        <p class="meta">{{ formatBytes(info.sizeBytes) }}</p>
        <p class="meta">{{ formatTimeRemaining(info.expiresAt) }}</p>
        <!-- The anchor navigates to /d/:token; the backend streams the bytes. -->
        <a
          v-if="!downloadsDisabled"
          class="primary-button"
          :href="`/d/${info.token}`"
          :download="info.originalName"
        >
          <DownloadIcon :size="18" :stroke-width="2.2" />
          Download
        </a>
        <button v-else type="button" class="primary-button" disabled>
          <DownloadIcon :size="18" :stroke-width="2.2" />
          Download
        </button>
      </article>

      <article v-else-if="state === 'expired'" class="card">
        <h1>File expired</h1>
        <p class="meta">This link is no longer available.</p>
        <p class="meta">Files are automatically deleted after expiration.</p>
        <RouterLink to="/" class="primary-button">Upload another file</RouterLink>
      </article>

      <article v-else class="card">
        <h1>Something went wrong</h1>
        <p class="meta">Please try the link again later.</p>
        <RouterLink to="/" class="primary-button">Upload another file</RouterLink>
      </article>
    </template>
  </section>
</template>

<style scoped>
.download {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading {
  color: var(--color-text-muted);
}

.warning-panel {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  max-width: 620px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(245, 158, 11, 0.32);
  background: var(--color-warning-soft);
  color: #fde68a;
}

.card {
  width: 100%;
  max-width: 620px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 32px 24px;
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, rgba(22, 34, 53, 0.96), rgba(17, 28, 46, 0.96));
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
  text-align: center;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-pill);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: grid;
  place-items: center;
  margin-bottom: 8px;
}

.card h1 {
  margin-block-end: 8px;
}

.filename {
  font-weight: 700;
  color: var(--color-text);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  color: var(--color-text-muted);
}

.primary-button {
  margin-top: 18px;
  min-height: 48px;
  padding: 0 22px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary), #2563eb);
  color: white;
  font-weight: 700;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  cursor: pointer;
  transition: transform 150ms ease, filter 150ms ease, opacity 150ms ease;
}

.primary-button:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.primary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
