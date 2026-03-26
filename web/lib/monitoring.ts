/**
 * API Monitoring and Metrics Tracking
 * Tracks API call latency and status codes for error budget monitoring
 */

import { createClient } from '@supabase/supabase-js'

const SLOW_REQUEST_THRESHOLD_MS = 2000

export interface ApiMetric {
  endpoint: string
  duration_ms: number
  status_code: number
  user_id?: string
  timestamp?: Date
}

export interface EndpointMetrics {
  endpoint: string
  count: number
  p50_ms: number
  p95_ms: number
  p99_ms: number
  error_count: number
  error_rate: number
  slow_requests: number
}

/**
 * Track an API call to the metrics table
 * Called after API request completes
 */
export async function trackApiCall(
  metric: ApiMetric,
  userId?: string
): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not configured for metrics tracking')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // Log slow requests
    if (metric.duration_ms > SLOW_REQUEST_THRESHOLD_MS) {
      console.warn(`[SLOW_REQUEST] ${metric.endpoint}: ${metric.duration_ms}ms`)
    }

    // Insert metric
    const { error } = await supabase.from('api_metrics').insert({
      user_id: userId,
      endpoint: metric.endpoint,
      duration_ms: metric.duration_ms,
      status_code: metric.status_code,
      created_at: metric.timestamp || new Date().toISOString(),
    })

    if (error) {
      console.error('Failed to track API metric:', error)
    }
  } catch (err) {
    console.error('Error tracking API call:', err)
    // Don't throw - metrics tracking should not break the API
  }
}

/**
 * Get aggregated metrics for an endpoint
 * Returns p50, p95, p99 latencies and error rates
 */
export async function getEndpointMetrics(
  endpoint: string,
  hoursBack: number = 24
): Promise<EndpointMetrics | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) return null

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('api_metrics')
      .select('duration_ms, status_code')
      .eq('endpoint', endpoint)
      .gte('created_at', since)

    if (error || !data || data.length === 0) {
      return null
    }

    const durations = data.map((d: any) => d.duration_ms).sort((a: number, b: number) => a - b)
    const statuses = data.map((d: any) => d.status_code)
    const errorCount = statuses.filter((s: number) => s >= 400).length

    return {
      endpoint,
      count: data.length,
      p50_ms: durations[Math.floor(durations.length * 0.5)],
      p95_ms: durations[Math.floor(durations.length * 0.95)],
      p99_ms: durations[Math.floor(durations.length * 0.99)],
      error_count: errorCount,
      error_rate: errorCount / data.length,
      slow_requests: durations.filter((d: number) => d > SLOW_REQUEST_THRESHOLD_MS).length,
    }
  } catch (err) {
    console.error('Error fetching endpoint metrics:', err)
    return null
  }
}

/**
 * Get metrics for multiple endpoints
 */
export async function getAllEndpointMetrics(
  endpoints: string[],
  hoursBack: number = 24
): Promise<EndpointMetrics[]> {
  const results = await Promise.all(
    endpoints.map((endpoint) => getEndpointMetrics(endpoint, hoursBack))
  )
  return results.filter((r): r is EndpointMetrics => r !== null)
}

/**
 * Middleware wrapper to track API call performance
 * Usage: wrap your API handler with this middleware
 */
export function withMetricsTracking(
  handler: Function,
  endpoint: string,
  getUserId?: (request: any) => string | undefined
) {
  return async (request: any, ...args: any[]) => {
    const startTime = Date.now()

    try {
      const response = await handler(request, ...args)
      const duration = Date.now() - startTime
      const userId = getUserId?.(request)

      // Extract status code
      let statusCode = 200
      if (response?.status) {
        statusCode = response.status
      } else if (response?.statusCode) {
        statusCode = response.statusCode
      }

      // Track the metric
      await trackApiCall(
        {
          endpoint,
          duration_ms: duration,
          status_code: statusCode,
          user_id: userId,
        },
        userId
      )

      return response
    } catch (err) {
      const duration = Date.now() - startTime
      const userId = getUserId?.(request)

      // Track error
      await trackApiCall(
        {
          endpoint,
          duration_ms: duration,
          status_code: 500,
          user_id: userId,
        },
        userId
      )

      throw err
    }
  }
}
