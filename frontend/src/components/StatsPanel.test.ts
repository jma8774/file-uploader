import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StatsPanel from './StatsPanel.vue'
import type { StatsResponse } from '../api'

const STATS: StatsResponse = {
  totalUploads: 128,
  totalDownloads: 902,
  activeFiles: 17,
  storageUsedBytes: 1932735283,
  storageLimitBytes: 6 * 1024 ** 3,
  uploadsToday: 9,
  downloadsToday: 44,
  expiredFilesDeleted: 0,
  estimatedMonthlyTransferBytes: 13314398617,
  monthlyTransferSafetyLimitBytes: 250 * 1024 ** 3,
  uploadsEnabled: true,
  downloadsEnabled: true,
}

describe('StatsPanel', () => {
  it('shows loading state when state is loading', () => {
    const wrapper = mount(StatsPanel, {
      props: { state: 'loading', stats: null },
    })
    expect(wrapper.text()).toContain('Loading stats')
  })

  it('renders all the spec stat labels with formatted values', () => {
    const wrapper = mount(StatsPanel, {
      props: { state: 'ready', stats: STATS },
    })
    const text = wrapper.text()
    // Top-row card labels
    expect(text).toContain('Total uploads')
    expect(text).toContain('Total downloads')
    expect(text).toContain('Active files')
    expect(text).toContain('Storage used')
    // "Uploads today" and "Downloads today" are surfaced as card subtexts
    // (e.g., "9 today" / "44 today") under the totals. wrapper.text() squashes
    // adjacent values, so we only assert the suffix is present at all.
    expect(text).toContain('9 today')
    expect(text).toContain('44 today')
    // Monthly transfer is the full-width card below the grid
    expect(text).toContain('Monthly transfer')
    // Formatted byte values:
    expect(text).toContain('1.8 GB')
    expect(text).toContain('6 GB')
    expect(text).toContain('250 GB')
  })

  it('falls back to "Stats unavailable" on error', () => {
    const wrapper = mount(StatsPanel, {
      props: { state: 'error', stats: null },
    })
    expect(wrapper.text()).toContain('Stats unavailable')
  })

  it('shows the safety-cap banner when uploadsEnabled is false', () => {
    const wrapper = mount(StatsPanel, {
      props: { state: 'ready', stats: { ...STATS, uploadsEnabled: false } },
    })
    expect(wrapper.text()).toContain('Monthly safety limit reached')
  })
})
