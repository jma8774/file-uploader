const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`
}

export function formatTimeRemaining(expiresAt: string | Date): string {
  const target = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)
  const now = Date.now()
  const remaining = target.getTime() - now

  if (Number.isNaN(target.getTime()) || remaining <= 0) {
    return 'Expired'
  }

  if (remaining >= DAY) {
    return `Expires in ${plural(Math.floor(remaining / DAY), 'day')}`
  }
  if (remaining >= HOUR) {
    return `Expires in ${plural(Math.floor(remaining / HOUR), 'hour')}`
  }
  if (remaining >= MINUTE) {
    return `Expires in ${plural(Math.floor(remaining / MINUTE), 'minute')}`
  }
  return `Expires in ${plural(Math.max(1, Math.floor(remaining / SECOND)), 'second')}`
}
