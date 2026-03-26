import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/metrics
 * Admin-only endpoint to view API metrics and error budget
 * Returns aggregated metrics for monitored endpoints
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin (you may need to adjust based on your auth setup)
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userProfile || userProfile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const hoursBack = parseInt(searchParams.get('hours') ?? '24', 10)
  const endpoint = searchParams.get('endpoint')

  try {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('api_metrics')
      .select('endpoint, duration_ms, status_code')
      .gte('created_at', since)

    if (endpoint) {
      query = query.eq('endpoint', endpoint)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        message: 'No metrics found for the specified time period',
        hoursBack,
        endpoints: [],
      })
    }

    // Group by endpoint and calculate percentiles
    const endpointMap = new Map<
      string,
      { durations: number[]; statuses: number[] }
    >()

    for (const metric of data) {
      if (!endpointMap.has(metric.endpoint)) {
        endpointMap.set(metric.endpoint, { durations: [], statuses: [] })
      }
      const entry = endpointMap.get(metric.endpoint)!
      entry.durations.push(metric.duration_ms)
      entry.statuses.push(metric.status_code)
    }

    const endpoints = Array.from(endpointMap.entries()).map(
      ([endpoint, { durations, statuses }]) => {
        const sorted = durations.sort((a, b) => a - b)
        const errors = statuses.filter((s) => s >= 400).length

        return {
          endpoint,
          requests: sorted.length,
          p50_ms: sorted[Math.floor(sorted.length * 0.5)],
          p95_ms: sorted[Math.floor(sorted.length * 0.95)],
          p99_ms: sorted[Math.floor(sorted.length * 0.99)],
          max_ms: sorted[sorted.length - 1],
          errors: errors,
          error_rate: ((errors / sorted.length) * 100).toFixed(2) + '%',
          slow_requests: sorted.filter((d) => d > 2000).length,
        }
      }
    )

    // Calculate overall error budget
    const totalRequests = data.length
    const totalErrors = data.filter((m: any) => m.status_code >= 400).length
    const overallErrorRate = ((totalErrors / totalRequests) * 100).toFixed(2)

    // Error budget (assuming 99.9% uptime SLA = 0.1% error budget)
    const errorBudgetSLA = 0.001 // 99.9%
    const availableBudget = (errorBudgetSLA * totalRequests).toFixed(0)
    const budgetRemaining = Math.max(0, parseInt(availableBudget) - totalErrors)

    return NextResponse.json({
      time_period_hours: hoursBack,
      timestamp: new Date().toISOString(),
      summary: {
        total_requests: totalRequests,
        total_errors: totalErrors,
        error_rate: overallErrorRate + '%',
        sla: '99.9%',
        error_budget_available: availableBudget,
        error_budget_remaining: budgetRemaining,
        budget_status:
          budgetRemaining > 0 ? 'healthy' : 'exceeded',
      },
      endpoints,
    })
  } catch (err) {
    console.error('Error fetching metrics:', err)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
