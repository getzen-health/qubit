import { describe, it, expect } from 'vitest'
import { createRateLimitHeaders, RATE_LIMITS } from '../lib/security/rate-limit'

describe('createRateLimitHeaders', () => {
  it('returns X-RateLimit-Remaining header', () => {
    const headers = createRateLimitHeaders(42, 60000)
    expect(headers['X-RateLimit-Remaining']).toBe('42')
  })

  it('returns X-RateLimit-Reset header as a future epoch timestamp', () => {
    const before = Math.ceil(Date.now() / 1000)
    const headers = createRateLimitHeaders(10, 60000)
    const reset = Number(headers['X-RateLimit-Reset'])
    expect(reset).toBeGreaterThanOrEqual(before + 59)
  })

  it('returns Retry-After header in seconds', () => {
    const headers = createRateLimitHeaders(0, 120000)
    expect(headers['Retry-After']).toBe('120')
  })

  it('has exactly three headers', () => {
    const headers = createRateLimitHeaders(5, 30000)
    expect(Object.keys(headers)).toHaveLength(3)
    expect(headers).toHaveProperty('X-RateLimit-Remaining')
    expect(headers).toHaveProperty('X-RateLimit-Reset')
    expect(headers).toHaveProperty('Retry-After')
  })

  it('handles zero remaining requests', () => {
    const headers = createRateLimitHeaders(0, 60000)
    expect(headers['X-RateLimit-Remaining']).toBe('0')
  })

  it('handles very large resetIn values', () => {
    const headers = createRateLimitHeaders(1, 3600000) // 1 hour
    const retryAfter = Number(headers['Retry-After'])
    expect(retryAfter).toBe(3600)
  })
})

describe('RATE_LIMITS constant', () => {
  it('contains all expected endpoint keys', () => {
    const expectedKeys = [
      'foodPhotoAnalyze', 'auth', 'integrations', 'healthData',
      'foodScan', 'aiChat', 'export', 'report', 'import', 'default',
    ]
    expectedKeys.forEach(key => {
      expect(RATE_LIMITS).toHaveProperty(key)
    })
  })

  it('every endpoint has positive maxRequests', () => {
    Object.entries(RATE_LIMITS).forEach(([key, config]) => {
      expect(config.maxRequests, `${key}.maxRequests`).toBeGreaterThan(0)
    })
  })

  it('every endpoint has positive windowMs', () => {
    Object.entries(RATE_LIMITS).forEach(([key, config]) => {
      expect(config.windowMs, `${key}.windowMs`).toBeGreaterThan(0)
    })
  })

  it('auth has the strictest per-minute limit', () => {
    expect(RATE_LIMITS.auth.maxRequests).toBe(5)
    expect(RATE_LIMITS.auth.windowMs).toBe(60_000)
  })

  it('default is the most permissive per-minute limit', () => {
    expect(RATE_LIMITS.default.maxRequests).toBe(100)
  })

  it('export has hourly window to prevent abuse', () => {
    expect(RATE_LIMITS.export.windowMs).toBe(3_600_000)
    expect(RATE_LIMITS.export.maxRequests).toBe(3)
  })

  it('aiChat has hourly window to control API costs', () => {
    expect(RATE_LIMITS.aiChat.windowMs).toBe(3_600_000)
    expect(RATE_LIMITS.aiChat.maxRequests).toBe(10)
  })
})
