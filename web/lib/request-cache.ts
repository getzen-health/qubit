/**
 * Simple in-memory request cache with 3-second TTL
 * Deduplicates GET requests to prevent redundant API calls
 */

interface CacheEntry {
  data: any
  timestamp: number
  promise?: Promise<any>
}

const requestCache = new Map<string, CacheEntry>()
const CACHE_TTL = 3000 // 3 seconds

/**
 * Get from cache or fetch with deduplication
 * Multiple concurrent calls for the same URL will share the same promise
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const cacheKey = `${url}:${JSON.stringify(options || {})}`
  const now = Date.now()

  // Check if we have valid cached data
  const cached = requestCache.get(cacheKey)
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }

  // Check if there's an in-flight request we can reuse
  if (cached?.promise) {
    return cached.promise
  }

  // Create new fetch promise
  const fetchPromise = fetch(url, {
    ...options,
    method: options?.method || 'GET',
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })
    .catch((error) => {
      // Remove from cache on error
      requestCache.delete(cacheKey)
      throw error
    })

  // Store the in-flight promise
  requestCache.set(cacheKey, {
    data: null,
    timestamp: now,
    promise: fetchPromise,
  })

  // Wait for result and update cache
  const data = await fetchPromise
  requestCache.set(cacheKey, {
    data,
    timestamp: now,
    promise: undefined,
  })

  return data as T
}

/**
 * Invalidate cache entry
 */
export function invalidateCache(urlPattern?: string) {
  if (!urlPattern) {
    requestCache.clear()
    return
  }

  for (const [key] of requestCache) {
    if (key.includes(urlPattern)) {
      requestCache.delete(key)
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: requestCache.size,
    entries: Array.from(requestCache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      hasData: !!value.data,
      inFlight: !!value.promise,
    })),
  }
}
