<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import FileUploader from '../components/FileUploader.vue'
import UploadResult from '../components/UploadResult.vue'
import StatsPanel from '../components/StatsPanel.vue'
import { getStats, type StatsResponse, type UploadResponse } from '../api'

const uploadResponse = ref<UploadResponse | null>(null)
const uploaderKey = ref(0)

const statsState = ref<'loading' | 'ready' | 'error'>('loading')
const stats = ref<StatsResponse | null>(null)

// Treat a missing flag as enabled — only an explicit `false` should lock UI.
const uploadsDisabled = computed(() => stats.value?.uploadsEnabled === false)

async function loadStats() {
  statsState.value = 'loading'
  try {
    stats.value = await getStats()
    statsState.value = 'ready'
  } catch {
    statsState.value = 'error'
  }
}

function onUploaded(response: UploadResponse) {
  uploadResponse.value = response
  loadStats()
}

function onUploadAnother() {
  uploadResponse.value = null
  uploaderKey.value += 1
}

onMounted(loadStats)
</script>

<template>
  <section class="home">
    <header class="home-header">
      <h1>Temporary File Drop</h1>
      <p>Upload a file and get a temporary download link.</p>
      <p>Files expire after 24 hours.</p>
    </header>

    <FileUploader
      v-if="!uploadResponse"
      :key="uploaderKey"
      :disabled="uploadsDisabled"
      @uploaded="onUploaded"
    />

    <UploadResult
      v-else
      :response="uploadResponse"
      @upload-another="onUploadAnother"
    />

    <StatsPanel :state="statsState" :stats="stats" />
  </section>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.home-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.home-header p {
  color: var(--color-muted);
}
</style>
