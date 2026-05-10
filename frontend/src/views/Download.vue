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
  gap: 16px;
}

.loading {
  margin: 0;
  color: #555;
}

.safety-banner {
  width: 100%;
  margin: 0;
  padding: 12px 16px;
  border-radius: 8px;
  background: #fffaf0;
  border: 1px solid #f6ad55;
  color: #7b341e;
  text-align: center;
  box-sizing: border-box;
}

.card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  text-align: center;
  box-sizing: border-box;
}

.card h1 {
  margin: 0 0 8px;
}

.card p {
  margin: 0;
}

.filename {
  font-weight: 600;
  word-break: break-all;
}

.size,
.expires {
  color: #555;
}

.download-btn {
  margin-top: 12px;
  padding: 10px 20px;
  font: inherit;
  border: 1px solid #1f2937;
  border-radius: 6px;
  background: #1f2937;
  color: #fff;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.download-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
