/**
 * Simple LRU in-memory cache for server-side response caching
 *
 * Features:
 * - Per-user cache isolation
 * - TTL (Time To Live) support
 * - LRU eviction policy when size limit exceeded
 * - Cache hit/miss tracking
 *
 * Usage:
 *   const cache = new ServerCache()
 *   cache.set('dashboard:user123', data, 300) // 5 minutes
 *   const data = cache.get('dashboard:user123')
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
  hits: number
  created: number
}

export class ServerCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private readonly maxSize: number = 1000
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize
    // Auto-cleanup expired entries every 5 minutes
    this.startCleanup()
  }

  private startCleanup() {
    if (this.cleanupInterval) return
    this.cleanupInterval = setInterval(() => {
      this.purgeExpired()
    }, 5 * 60 * 1000) // 5 minutes
    // Allow process to exit even with this timer
    this.cleanupInterval.unref?.()
  }

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or undefined if expired/missing
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    // Update hit count for LRU
    entry.hits++
    return entry.value as T
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    // Evict LRU if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      hits: 0,
      created: Date.now(),
    })
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        hits: entry.hits,
        ttlRemaining: Math.max(0, Math.round((entry.expiresAt - Date.now()) / 1000)),
        age: Math.round((Date.now() - entry.created) / 1000),
      })),
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null
    let lruHits = Infinity
    let lruTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      // Prioritize evicting by: hits (ascending), then age (oldest first)
      if (entry.hits < lruHits || (entry.hits === lruHits && entry.created < lruTime)) {
        lruKey = key
        lruHits = entry.hits
        lruTime = entry.created
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
    }
  }

  /**
   * Remove all expired entries
   */
  private purgeExpired(): void {
    const now = Date.now()
    const expired = Array.from(this.cache.entries())
      .filter(([_, entry]) => now > entry.expiresAt)
      .map(([key]) => key)

    expired.forEach(key => this.cache.delete(key))
  }
}

// Global singleton instance
let globalCache: ServerCache | null = null

export function getServerCache(): ServerCache {
  if (!globalCache) {
    globalCache = new ServerCache(1000)
  }
  return globalCache
}
