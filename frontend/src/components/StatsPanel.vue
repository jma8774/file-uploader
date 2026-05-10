<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getStats, type StatsResponse } from '../api'
import { formatBytes } from '../utils/formatBytes'

type FetchState = 'loading' | 'ready' | 'error'

const state = ref<FetchState>('loading')
const stats = ref<StatsResponse | null>(null)

async function load() {
  state.value = 'loading'
  try {
    stats.value = await getStats()
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}

defineExpose({ refresh: load })

onMounted(load)
</script>

<template>
  <section class="stats">
    <h2 class="title">Site Stats</h2>

    <p v-if="state === 'loading'" class="loading">Loading stats…</p>

    <p v-else-if="state === 'error'" class="unavailable">Stats unavailable</p>

    <template v-else-if="stats">
      <p
        v-if="stats.uploadsEnabled === false || stats.downloadsEnabled === false"
        class="safety-banner"
        role="alert"
      >
        Monthly safety limit reached. Uploads and downloads are temporarily paused
        to protect server bandwidth.
      </p>

      <dl class="grid">
        <dt>Total uploads</dt>
        <dd>{{ stats.totalUploads }}</dd>

        <dt>Total downloads</dt>
        <dd>{{ stats.totalDownloads }}</dd>

        <dt>Active files</dt>
        <dd>{{ stats.activeFiles }}</dd>

        <dt>Storage used</dt>
        <dd>{{ formatBytes(stats.storageUsedBytes) }} / {{ formatBytes(stats.storageLimitBytes) }}</dd>

        <dt>Uploads today</dt>
        <dd>{{ stats.uploadsToday }}</dd>

        <dt>Downloads today</dt>
        <dd>{{ stats.downloadsToday }}</dd>

        <dt>Monthly transfer</dt>
        <dd>
          {{ formatBytes(stats.estimatedMonthlyTransferBytes) }}
          / {{ formatBytes(stats.monthlyTransferSafetyLimitBytes) }} safety cap
        </dd>
      </dl>
    </template>
  </section>
</template>

<style scoped>
.stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.title {
  margin: 0;
  font-size: 1.125rem;
}

.loading,
.unavailable {
  margin: 0;
  color: #555;
}

.safety-banner {
  margin: 0;
  padding: 12px 16px;
  border-radius: 8px;
  background: #fffaf0;
  border: 1px solid #f6ad55;
  color: #7b341e;
}

.grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 16px;
  margin: 0;
}

.grid dt {
  color: #555;
}

.grid dd {
  margin: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
