export const SAFETY_LIMIT_MESSAGE =
  'Monthly safety limit reached. Uploads and downloads are temporarily paused to protect server bandwidth.'

export const UPLOADS_PAUSED_MESSAGE = 'Uploads are temporarily paused.'
export const DOWNLOADS_PAUSED_MESSAGE = 'Downloads are temporarily paused.'
export const BOTH_PAUSED_MESSAGE = 'Uploads and downloads are temporarily paused.'

interface PausedInput {
  uploadsEnabled: boolean
  downloadsEnabled: boolean
  estimatedMonthlyTransferBytes: number
  monthlyTransferSafetyLimitBytes: number
}

/**
 * Returns the user-facing message that explains why uploads/downloads are
 * paused, or null if they aren't paused. The safety-cap copy is only used
 * when the cap has actually been hit — otherwise the flags are presumed to
 * have been flipped for some other reason (operator override, etc.) and we
 * stay honest about it.
 */
export function pausedMessage(stats: PausedInput): string | null {
  if (stats.uploadsEnabled && stats.downloadsEnabled) return null

  const capReached =
    stats.monthlyTransferSafetyLimitBytes > 0 &&
    stats.estimatedMonthlyTransferBytes >= stats.monthlyTransferSafetyLimitBytes
  if (capReached) return SAFETY_LIMIT_MESSAGE

  if (!stats.uploadsEnabled && !stats.downloadsEnabled) return BOTH_PAUSED_MESSAGE
  if (!stats.uploadsEnabled) return UPLOADS_PAUSED_MESSAGE
  return DOWNLOADS_PAUSED_MESSAGE
}
