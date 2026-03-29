/**
 * Rate Limiting for API Protection
 * Supabase-backed implementation — safe for Vercel serverless where each
 * function invocation gets a fresh process and in-memory Maps reset to zero.
 */

import { createClient } from '@supabase/supabase-js'

interface RateLimitConfig {
  maxRequests: number // Maximum requests allowed
  windowMs: number   // Time window in milliseconds
}

/**
 * Default rate limit configurations for different endpoints
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  foodPhotoAnalyze: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  // Auth endpoints - strict limits
  auth: { maxRequests: 5, windowMs: 60_000 }, // 5 requests per minute

  // Integration auth flows (OAuth, etc) - very strict
  integrations: { maxRequests: 10, windowMs: 60_000 }, // 10 requests per minute

  // Health data APIs - moderate limits
  healthData: { maxRequests: 60, windowMs: 60_000 }, // 60 requests per minute

  // Food scanning - allow more frequent use
  foodScan: { maxRequests: 30, windowMs: 60_000 }, // 30 scans per minute

  // AI chat/insights - limit to reduce API costs
  aiChat: { maxRequests: 10, windowMs: 3_600_000 }, // 10 requests per hour per user

  // Data export - prevent bulk scraping
  export: { maxRequests: 3, windowMs: 3_600_000 }, // 3 exports per hour per user

  // Doctor report PDF - limited generation
  report: { maxRequests: 5, windowMs: 3_600_000 }, // 5 reports per hour per user

  // Data import - prevent abuse
  import: { maxRequests: 10, windowMs: 3_600_000 }, // 10 imports per hour per user

  // General API - default
  default: { maxRequests: 100, windowMs: 60_000 }, // 100 requests per minute
}

/** Build a service-role Supabase client for server-side rate limit writes. */
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * Check if a request should be rate limited using Supabase as the shared
 * counter store.  Falls back to "allow" if Supabase is unavailable so a
 * misconfigured environment doesn't block every request.
 *
 * @returns Object with allowed status and remaining requests
 */
export async function checkRateLimit(
  identifier: string | Request,
  endpoint: keyof typeof RATE_LIMITS = 'default'
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const id = typeof identifier === 'string' ? identifier : getClientIdentifier(identifier)
  const config = RATE_LIMITS[endpoint]
  const key = `${endpoint}:${id}`
  const windowStart = new Date(Date.now() - config.windowMs).toISOString()

  const supabase = getServiceClient()
  if (!supabase) {
    // Supabase not configured — fail open so the app stays usable
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs }
  }

  // Count events for this key inside the current window
  const { count, error } = await supabase
    .from('rate_limit_events')
    .select('id', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', windowStart)

  if (error) {
    // On DB error fail open to avoid blocking legitimate requests
    console.error('rate-limit count error:', error.message)
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs }
  }

  const current = count ?? 0

  if (current >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: config.windowMs,
    }
  }

  // Record this request
  const { error: rlErr } = await supabase.from('rate_limit_events').insert({
    key,
    endpoint: String(endpoint),
    identifier: id,
  })
  if (rlErr) console.error('rate_limit_events insert error', rlErr)

  return {
    allowed: true,
    remaining: config.maxRequests - current - 1,
    resetIn: config.windowMs,
  }
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  if (cfConnectingIp) return cfConnectingIp
  if (realIp) return realIp

  const userAgent = request.headers.get('user-agent') || 'unknown'
  const accept = request.headers.get('accept') || 'unknown'
  return `ua:${hashString(userAgent + accept)}`
}

/** Simple djb2-style hash for string identifiers. */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
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

