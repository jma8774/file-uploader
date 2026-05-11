<script setup lang="ts">
import { computed } from 'vue'
import {
  Activity,
  Clock3,
  Database,
  Download,
  TriangleAlert,
  Upload,
} from 'lucide-vue-next'
import type { StatsResponse } from '../api'
import { formatBytes } from '../utils/formatBytes'
import { SAFETY_LIMIT_MESSAGE } from '../messages'

const DASH = '—'

const props = defineProps<{
  state: 'loading' | 'ready' | 'error'
  stats: StatsResponse | null
}>()

const hasStats = computed(() => props.state === 'ready' && props.stats !== null)

function num(value: number): string {
  return hasStats.value ? value.toLocaleString() : DASH
}

function bytes(value: number): string {
  return hasStats.value ? formatBytes(value) : DASH
}

const storagePct = computed(() => {
  if (!hasStats.value || !props.stats || props.stats.storageLimitBytes <= 0) return 0
  return Math.min(100, (props.stats.storageUsedBytes / props.stats.storageLimitBytes) * 100)
})

const monthlyPct = computed(() => {
  if (!hasStats.value || !props.stats || props.stats.monthlyTransferSafetyLimitBytes <= 0) return 0
  return Math.min(
    100,
    (props.stats.estimatedMonthlyTransferBytes / props.stats.monthlyTransferSafetyLimitBytes) * 100,
  )
})

const safetyCapReached = computed(
  () =>
    hasStats.value &&
    props.stats !== null &&
    (props.stats.uploadsEnabled === false || props.stats.downloadsEnabled === false),
)
</script>

<template>
  <section class="stats-section">
    <p v-if="safetyCapReached" class="warning-panel" role="alert">
      <TriangleAlert :size="18" :stroke-width="2.2" />
      <span>{{ SAFETY_LIMIT_MESSAGE }}</span>
    </p>

    <div class="stats-grid" :class="{ 'is-placeholder': !hasStats }">
      <div class="stat-card">
        <div class="stat-icon uploads">
          <Upload :size="20" :stroke-width="2" />
        </div>
        <div>
          <p class="stat-label">Total uploads</p>
          <p class="stat-value">{{ num(stats?.totalUploads ?? 0) }}</p>
          <p v-if="hasStats" class="stat-subtext">{{ stats?.uploadsToday }} today</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon downloads">
          <Download :size="20" :stroke-width="2" />
        </div>
        <div>
          <p class="stat-label">Total downloads</p>
          <p class="stat-value">{{ num(stats?.totalDownloads ?? 0) }}</p>
          <p v-if="hasStats" class="stat-subtext">{{ stats?.downloadsToday }} today</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon active">
          <Clock3 :size="20" :stroke-width="2" />
        </div>
        <div>
          <p class="stat-label">Active files</p>
          <p class="stat-value">{{ num(stats?.activeFiles ?? 0) }}</p>
          <p v-if="hasStats" class="stat-subtext">in last 24 hours</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon storage">
          <Database :size="20" :stroke-width="2" />
        </div>
        <div class="storage-meta">
          <p class="stat-label">Storage used</p>
          <p class="stat-value">{{ bytes(stats?.storageUsedBytes ?? 0) }}</p>
          <p v-if="hasStats" class="stat-subtext">
            of {{ bytes(stats?.storageLimitBytes ?? 0) }} used
          </p>
          <div v-if="hasStats" class="storage-progress-track">
            <div class="storage-progress-bar" :style="{ width: `${storagePct}%` }" />
          </div>
        </div>
      </div>
    </div>

    <div class="transfer-card" :class="{ 'is-placeholder': !hasStats }">
      <div class="transfer-header">
        <div class="stat-icon transfer">
          <Activity :size="20" :stroke-width="2" />
        </div>
        <div class="transfer-meta">
          <p class="stat-label">Monthly transfer</p>
          <p class="transfer-line">
            <span class="transfer-value">{{ bytes(stats?.estimatedMonthlyTransferBytes ?? 0) }}</span>
            <span v-if="hasStats" class="transfer-cap">
              / {{ bytes(stats?.monthlyTransferSafetyLimitBytes ?? 0) }} safety cap
            </span>
          </p>
        </div>
      </div>
      <div v-if="hasStats" class="storage-progress-track">
        <div class="storage-progress-bar" :style="{ width: `${monthlyPct}%` }" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.stats-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.warning-panel {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(245, 158, 11, 0.32);
  background: var(--color-warning-soft);
  color: #fde68a;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  transition: opacity 200ms ease;
}

.stats-grid.is-placeholder,
.transfer-card.is-placeholder {
  opacity: 0.55;
}

.stat-card {
  padding: 18px;
  border-radius: var(--radius);
  background: rgba(22, 34, 53, 0.82);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.stat-icon.uploads {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.stat-icon.downloads {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.stat-icon.active {
  background: rgba(168, 85, 247, 0.14);
  color: #a78bfa;
}

.stat-icon.storage {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.stat-icon.transfer {
  background: rgba(94, 234, 212, 0.14);
  color: #5eead4;
}

.stat-label {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.stat-value {
  margin-top: 0.2rem;
  color: var(--color-text);
  font-size: 1.5rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.stat-subtext {
  margin-top: 0.2rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.storage-meta {
  min-width: 0;
  width: 100%;
}

.storage-progress-track {
  margin-top: 0.5rem;
  height: 7px;
  border-radius: var(--radius-pill);
  background: rgba(148, 163, 184, 0.16);
  overflow: hidden;
}

.storage-progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
}

.transfer-card {
  padding: 18px;
  border-radius: var(--radius);
  background: rgba(22, 34, 53, 0.82);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
}

.transfer-header {
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
}

.transfer-meta {
  flex: 1;
  min-width: 0;
}

.transfer-line {
  margin-top: 0.2rem;
  color: var(--color-text);
  font-weight: 700;
}

.transfer-value {
  font-size: 1.25rem;
  font-variant-numeric: tabular-nums;
  margin-right: 0.4rem;
}

.transfer-cap {
  color: var(--color-text-muted);
  font-weight: 500;
  font-size: 0.875rem;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
