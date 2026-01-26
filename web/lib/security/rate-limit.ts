/**
 * Rate Limiting for API Protection
 * Protects against brute force attacks and DoS
 */

interface RateLimitConfig {
  maxRequests: number // Maximum requests allowed
  windowMs: number // Time window in milliseconds
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (for serverless, consider using Redis/Upstash)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  const keysToDelete: string[] = []
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      keysToDelete.push(key)
    }
  })
  keysToDelete.forEach((key) => rateLimitStore.delete(key))
}, 60000) // Clean every minute

/**
 * Default rate limit configurations for different endpoints
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Auth endpoints - strict limits
  auth: { maxRequests: 5, windowMs: 60000 }, // 5 requests per minute

  // Health data APIs - moderate limits
  healthData: { maxRequests: 60, windowMs: 60000 }, // 60 requests per minute

  // Food scanning - allow more frequent use
  foodScan: { maxRequests: 30, windowMs: 60000 }, // 30 scans per minute

  // General API - default
  default: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
}

/**
 * Check if a request should be rate limited
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  endpoint: keyof typeof RATE_LIMITS = 'default'
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMITS[endpoint]
  const key = `${endpoint}:${identifier}`
  const now = Date.now()

  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    }
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    }
  }

  // Increment counter
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  }
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  // Use the first IP in x-forwarded-for chain, or fall back to others
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  if (realIp) {
    return realIp
  }

  // Fallback to a hash of user agent + accept headers (not ideal but better than nothing)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const accept = request.headers.get('accept') || 'unknown'
  return `ua:${hashString(userAgent + accept)}`
}

/**
 * Simple hash function for strings
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(
  remaining: number,
  resetIn: number
): Record<string, string> {
  return {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + resetIn / 1000).toString(),
    'Retry-After': Math.ceil(resetIn / 1000).toString(),
  }
}
