<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import FileUploader from '../components/FileUploader.vue'
import UploadResult from '../components/UploadResult.vue'
import StatsPanel from '../components/StatsPanel.vue'
import HeroSection from '../components/HeroSection.vue'
import { getStats, type StatsResponse, type UploadResponse } from '../api'

const uploadResponse = ref<UploadResponse | null>(null)
const uploaderKey = ref(0)

const statsState = ref<'loading' | 'ready' | 'error'>('loading')
const stats = ref<StatsResponse | null>(null)

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
  <div class="home">
    <HeroSection />

    <FileUploader
      v-if="!uploadResponse"
      :key="uploaderKey"
      :disabled="uploadsDisabled"
      class="home-uploader"
      @uploaded="onUploaded"
    />

    <UploadResult
      v-else
      :response="uploadResponse"
      class="home-uploader"
      @upload-another="onUploadAnother"
    />

    <StatsPanel class="home-stats" :state="statsState" :stats="stats" />
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.home-uploader {
  margin-top: 32px;
}

.home-stats {
  margin-top: 24px;
}

@media (max-width: 720px) {
  .home-uploader {
    margin-top: 24px;
  }
}
</style>
