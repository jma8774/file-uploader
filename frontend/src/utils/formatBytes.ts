const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0 B'

  let i = 0
  let value = n
  while (value >= 1024 && i < UNITS.length - 1) {
    value /= 1024
    i++
  }

  if (i === 0) return `${Math.round(value)} ${UNITS[0]}`

  // 1 decimal for values under 100 ("1.8 GB", "42.8 MB"), 0 for larger ("250 GB").
  // Trim a trailing ".0" so whole-number values render cleanly ("6 GB", not "6.0 GB").
  const decimals = value < 100 ? 1 : 0
  let formatted = value.toFixed(decimals)
  if (formatted.endsWith('.0')) formatted = formatted.slice(0, -2)
  return `${formatted} ${UNITS[i]}`
}
