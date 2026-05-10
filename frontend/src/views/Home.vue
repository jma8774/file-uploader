<script setup lang="ts">
import { ref } from 'vue'
import FileUploader from '../components/FileUploader.vue'
import UploadResult from '../components/UploadResult.vue'
import type { UploadResponse } from '../api'

const uploadResponse = ref<UploadResponse | null>(null)
const uploaderKey = ref(0)

function onUploaded(response: UploadResponse) {
  uploadResponse.value = response
}

function onUploadAnother() {
  uploadResponse.value = null
  // Force the FileUploader to fully remount so its internal state resets.
  uploaderKey.value += 1
}
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
      @uploaded="onUploaded"
    />

    <UploadResult
      v-else
      :response="uploadResponse"
      @upload-another="onUploadAnother"
    />

    <!-- TODO: StatsPanel (TICKET-008) -->
  </section>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.home-header {
  text-align: center;
}

.home-header h1 {
  margin: 0 0 8px;
}

.home-header p {
  margin: 0;
}
</style>
