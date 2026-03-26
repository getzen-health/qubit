import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getServerCache } from '@/lib/server-cache'

export const dynamic = 'force-dynamic'

interface MonthlySummary {
  month: string
  year: number
  month_num: number
  avg_steps: number
  total_steps: number
  avg_sleep_minutes: number
  avg_recovery_score: number
  days_recorded: number
}

interface YearlySummary {
  year: number
  total_days_recorded: number
  avg_daily_steps: number
  total_steps: number
  best_month_steps: number
  worst_month_steps: number
  avg_sleep_hours: number
  avg_recovery_score: number
  months_with_data: number
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check cache first
    const cache = getServerCache()
    const cacheKey = `monthly_report:${user.id}:${year}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT', 'Cache-Control': 'max-age=300, s-maxage=300' },
      })
    }

    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    // Fetch monthly summaries if available, otherwise calculate from daily data
    const { data: monthlySummaries, error: monthError } = await supabase
      .from('monthly_summaries')
      .select('*')
      .eq('user_id', user.id)
      .gte('year', year)
      .lte('year', year)
      .order('month_num', { ascending: true })

    if (!monthError && monthlySummaries && monthlySummaries.length > 0) {
      // Use pre-calculated monthly summaries
      const formatted = (monthlySummaries as any[]).map(m => ({
        month: new Date(year, m.month_num - 1).toLocaleDateString('en-US', { month: 'long' }),
        year: m.year,
        month_num: m.month_num,
        avg_steps: m.avg_daily_steps || 0,
        total_steps: m.total_steps || 0,
        avg_sleep_minutes: m.avg_sleep_minutes || 0,
        avg_recovery_score: m.avg_recovery_score || 0,
        days_recorded: m.days_recorded || 0,
      }))

      const result = {
        monthly_data: formatted,
        yearly_summary: calculateYearlySummary(formatted, year),
      }

      // Cache for 1 hour for monthly reports
      cache.set(cacheKey, result, 3600)

      return NextResponse.json(result, {
        headers: { 'X-Cache': 'MISS', 'Cache-Control': 'max-age=3600, s-maxage=3600' },
      })
    }

    // Fall back to calculating from daily_summaries
    const { data: dailyData } = await supabase
      .from('daily_summaries')
      .select('date, steps, sleep_duration_minutes, recovery_score')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (!dailyData || dailyData.length === 0) {
      const emptyResult = {
        monthly_data: [],
        yearly_summary: {
          year,
          total_days_recorded: 0,
          avg_daily_steps: 0,
          total_steps: 0,
          best_month_steps: 0,
          worst_month_steps: 0,
          avg_sleep_hours: 0,
          avg_recovery_score: 0,
          months_with_data: 0,
        },
      }
      cache.set(cacheKey, emptyResult, 3600)
      return NextResponse.json(emptyResult, {
        headers: { 'X-Cache': 'MISS', 'Cache-Control': 'max-age=3600, s-maxage=3600' },
      })
    }

    // Group by month
    const monthMap = new Map<number, typeof dailyData>()
    for (const day of dailyData) {
      const monthNum = new Date(day.date).getMonth() + 1
      if (!monthMap.has(monthNum)) monthMap.set(monthNum, [])
      monthMap.get(monthNum)!.push(day)
    }

    const monthly: MonthlySummary[] = []
    for (let m = 1; m <= 12; m++) {
      const monthDays = monthMap.get(m) || []
      if (monthDays.length === 0) continue

      const totalSteps = monthDays.reduce((s, d) => s + (d.steps || 0), 0)
      const avgSteps = Math.round(totalSteps / monthDays.length)
      const avgSleep = Math.round(
        monthDays.reduce((s, d) => s + (d.sleep_duration_minutes || 0), 0) / monthDays.length
      )
      const avgRecovery = Math.round(
        monthDays.reduce((s, d) => s + (d.recovery_score || 0), 0) / monthDays.length * 100
      ) / 100

      monthly.push({
        month: new Date(year, m - 1).toLocaleDateString('en-US', { month: 'long' }),
        year,
        month_num: m,
        avg_steps: avgSteps,
        total_steps: totalSteps,
        avg_sleep_minutes: avgSleep,
        avg_recovery_score: avgRecovery,
        days_recorded: monthDays.length,
      })
    }

    const result = {
      monthly_data: monthly,
      yearly_summary: calculateYearlySummary(monthly, year),
    }

    // Cache for 1 hour
    cache.set(cacheKey, result, 3600)

    return NextResponse.json(result, {
      headers: { 'X-Cache': 'MISS', 'Cache-Control': 'max-age=3600, s-maxage=3600' },
    })
  } catch (error) {
    console.error('Monthly summary error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monthly summary' },
      { status: 500 }
    )
  }
}

function calculateYearlySummary(monthly: MonthlySummary[], year: number): YearlySummary {
  if (monthly.length === 0) {
    return {
      year,
      total_days_recorded: 0,
      avg_daily_steps: 0,
      total_steps: 0,
      best_month_steps: 0,
      worst_month_steps: 0,
      avg_sleep_hours: 0,
      avg_recovery_score: 0,
      months_with_data: 0,
    }
  }

  const totalDays = monthly.reduce((s, m) => s + m.days_recorded, 0)
  const totalSteps = monthly.reduce((s, m) => s + m.total_steps, 0)
  const avgDailySteps = Math.round(totalSteps / (totalDays || 1))
  const bestMonth = Math.max(...monthly.map(m => m.total_steps))
  const worstMonth = Math.min(...monthly.map(m => m.total_steps))
  const avgSleep = Math.round(
    (monthly.reduce((s, m) => s + (m.avg_sleep_minutes * m.days_recorded), 0) / (totalDays || 1)) / 60 * 10
  ) / 10
  const avgRecovery = Math.round(
    (monthly.reduce((s, m) => s + (m.avg_recovery_score * m.days_recorded), 0) / (totalDays || 1)) * 100
  ) / 100

  return {
    year,
    total_days_recorded: totalDays,
    avg_daily_steps: avgDailySteps,
    total_steps: totalSteps,
    best_month_steps: bestMonth,
    worst_month_steps: worstMonth,
    avg_sleep_hours: avgSleep,
    avg_recovery_score: avgRecovery,
    months_with_data: monthly.length,
  }
}
