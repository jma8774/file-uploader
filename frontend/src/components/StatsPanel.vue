<script setup lang="ts">
import type { StatsResponse } from '../api'
import { formatBytes } from '../utils/formatBytes'
import { SAFETY_LIMIT_MESSAGE } from '../messages'

defineProps<{
  state: 'loading' | 'ready' | 'error'
  stats: StatsResponse | null
}>()
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
        {{ SAFETY_LIMIT_MESSAGE }}
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
  gap: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.loading,
.unavailable {
  color: var(--color-muted);
}

.safety-banner {
  padding: var(--space-3) 16px;
  border-radius: var(--radius);
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  color: var(--color-warning-text);
}

.grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-1) 16px;
  margin: 0;
}

.grid dt {
  color: var(--color-muted);
}

.grid dd {
  margin: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 380px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 0 0;
  }
  .grid dt {
    padding-top: var(--space-2);
  }
  .grid dd {
    text-align: left;
  }
}
</style>
