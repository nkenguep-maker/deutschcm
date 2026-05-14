const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 heure

export function getCached(key: string) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data
}

export function setCached(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() })
}

export function cacheKey(...parts: string[]) {
  return parts.join(":")
}
