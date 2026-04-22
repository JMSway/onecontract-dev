import { getCloudflareContext } from '@opennextjs/cloudflare'

export function readMobizonKey(): string | undefined {
  try {
    const { env } = getCloudflareContext()
    if (env?.MOBIZON_API_KEY) return env.MOBIZON_API_KEY
  } catch {
    // not running inside Cloudflare runtime (e.g. `next dev`) — fall through
  }
  return process.env.MOBIZON_API_KEY
}
