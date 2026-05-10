<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ApiError, getFileInfo, type FileInfoActive } from '../api'
import { formatBytes } from '../utils/formatBytes'
import { formatTimeRemaining } from '../utils/formatTime'

const props = defineProps<{ token: string }>()

type ViewState = 'loading' | 'active' | 'expired' | 'error'

const state = ref<ViewState>('loading')
const info = ref<FileInfoActive | null>(null)

async function load() {
  state.value = 'loading'
  try {
    const response = await getFileInfo(props.token)
    if (response.status === 'active') {
      info.value = response
      state.value = 'active'
    } else {
      state.value = 'expired'
    }
  } catch (err) {
    if (err instanceof ApiError && (err.error === 'EXPIRED' || err.error === 'FILE_NOT_FOUND')) {
      state.value = 'expired'
    } else {
      state.value = 'error'
    }
  }
}

onMounted(load)
</script>

<template>
  <section class="download">
    <p v-if="state === 'loading'" class="loading">Loading…</p>

    <article v-else-if="state === 'active' && info" class="card">
      <h1>Your file is ready</h1>
      <p class="filename">{{ info.originalName }}</p>
      <p class="size">{{ formatBytes(info.sizeBytes) }}</p>
      <p class="expires">{{ formatTimeRemaining(info.expiresAt) }}</p>
      <!-- EMULATED: /d/:token is served by the (deferred) backend. The anchor
           will 404 during the frontend-first phase. -->
      <a
        class="download-btn"
        :href="`/d/${info.token}`"
        :download="info.originalName"
      >
        Download
      </a>
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
  </section>
</template>

<style scoped>
.download {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.loading {
  margin: 0;
  color: #555;
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
  border-radius: 6px;
  background: #1f2937;
  color: #fff;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
</style>
