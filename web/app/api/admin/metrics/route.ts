import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const querySchema = z.object({
  hours: z.string().regex(/^\d+$/).optional(),
  endpoint: z.string().optional(),
})

/**
 * GET /api/admin/metrics
 * Admin-only endpoint to view API metrics and error budget
 * Returns aggregated metrics for monitored endpoints
 */
export const GET = createSecureApiHandler(
  { rateLimit: 'default', requireAuth: true, querySchema },
  async (_req, { user, query, supabase }) => {
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user!.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return secureErrorResponse('Forbidden - admin only', 403)
    }

    const { hours, endpoint } = query as z.infer<typeof querySchema>
    const hoursBack = parseInt(hours ?? '24', 10)
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

    let q = supabase
      .from('api_metrics')
      .select('endpoint, duration_ms, status_code')
      .gte('created_at', since)

    if (endpoint) {
      q = q.eq('endpoint', endpoint)
    }

    const { data, error } = await q

    if (error) return secureErrorResponse(error.message, 400)

    if (!data || data.length === 0) {
      return secureJsonResponse({
        message: 'No metrics found for the specified time period',
        hoursBack,
        endpoints: [],
      })
    }

    const endpointMap = new Map<string, { durations: number[]; statuses: number[] }>()
    for (const metric of data) {
      if (!endpointMap.has(metric.endpoint)) {
        endpointMap.set(metric.endpoint, { durations: [], statuses: [] })
      }
      const entry = endpointMap.get(metric.endpoint)!
      entry.durations.push(metric.duration_ms)
      entry.statuses.push(metric.status_code)
    }

    const endpoints = Array.from(endpointMap.entries()).map(
      ([ep, { durations, statuses }]) => {
        const sorted = durations.sort((a, b) => a - b)
        const errors = statuses.filter((s) => s >= 400).length
        return {
          endpoint: ep,
          requests: sorted.length,
          p50_ms: sorted[Math.floor(sorted.length * 0.5)],
          p95_ms: sorted[Math.floor(sorted.length * 0.95)],
          p99_ms: sorted[Math.floor(sorted.length * 0.99)],
          max_ms: sorted[sorted.length - 1],
          errors,
          error_rate: ((errors / sorted.length) * 100).toFixed(2) + '%',
          slow_requests: sorted.filter((d) => d > 2000).length,
        }
      }
    )

    const totalRequests = data.length
    const totalErrors = data.filter((m) => m.status_code >= 400).length
    const overallErrorRate = ((totalErrors / totalRequests) * 100).toFixed(2)
    const errorBudgetSLA = 0.001
    const availableBudget = (errorBudgetSLA * totalRequests).toFixed(0)
    const budgetRemaining = Math.max(0, parseInt(availableBudget) - totalErrors)

    return secureJsonResponse({
      time_period_hours: hoursBack,
      timestamp: new Date().toISOString(),
      summary: {
        total_requests: totalRequests,
        total_errors: totalErrors,
        error_rate: overallErrorRate + '%',
        sla: '99.9%',
        error_budget_available: availableBudget,
        error_budget_remaining: budgetRemaining,
        budget_status: budgetRemaining > 0 ? 'healthy' : 'exceeded',
      },
      endpoints,
    })
  }
)
