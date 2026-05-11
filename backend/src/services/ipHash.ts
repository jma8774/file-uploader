import { createHmac } from 'node:crypto'
import { config } from '../config.js'

export function hashIp(ip: string | undefined): string | null {
  if (!ip) return null
  return createHmac('sha256', config.ipHashSecret).update(ip).digest('hex')
}
