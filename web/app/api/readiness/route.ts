import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const [summaryRes, sleepRes, goalsRes] = await Promise.all([
    supabase.from('daily_summaries')
      .select('date, resting_hr, hrv_ms, active_calories')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false }),
    supabase.from('sleep_records')
      .select('sleep_date, total_sleep_minutes')
      .eq('user_id', user.id)
      .gte('sleep_date', yesterday.toISOString().split('T')[0])
      .order('sleep_date', { ascending: false })
      .limit(1),
    supabase.from('user_goals')
      .select('target_sleep_hours')
      .eq('user_id', user.id)
      .single()
  ])

  const summaries = summaryRes.data ?? []
  const targetSleepMinutes = ((goalsRes.data?.target_sleep_hours ?? 8) * 60)

  // HRV component
  const hrvValues = summaries.filter(s => s.hrv_ms).map(s => s.hrv_ms as number)
  const avgHrv = hrvValues.length ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length : null
  const todayHrv = summaries[0]?.hrv_ms ?? null
  let hrvScore = 20
  if (avgHrv && todayHrv) {
    const pctDiff = (todayHrv - avgHrv) / avgHrv
    if (pctDiff >= 0.15) hrvScore = 30
    else if (pctDiff >= 0.05) hrvScore = 25
    else if (pctDiff >= -0.05) hrvScore = 20
    else if (pctDiff >= -0.15) hrvScore = 14
    else hrvScore = 10
  }

  // Sleep component
  const lastSleep = sleepRes.data?.[0]?.total_sleep_minutes ?? null
  const sleepScore = lastSleep ? Math.min(Math.round((lastSleep / targetSleepMinutes) * 25), 25) : 15

  // Resting HR component
  const hrValues = summaries.filter(s => s.resting_hr).map(s => s.resting_hr as number)
  const avgHr = hrValues.length ? hrValues.reduce((a, b) => a + b, 0) / hrValues.length : null
  const todayHr = summaries[0]?.resting_hr ?? null
  let hrScore = 14
  if (avgHr && todayHr) {
    const diff = avgHr - todayHr
    if (diff >= 5) hrScore = 20
    else if (diff >= 2) hrScore = 17
    else if (diff >= -2) hrScore = 14
    else if (diff >= -5) hrScore = 10
    else hrScore = 8
  }

  // Activity strain component (last 3 days)
  const recentSummaries = summaries.filter(s => new Date(s.date) >= threeDaysAgo)
  const totalRecentCalories = recentSummaries.reduce((s, r) => s + (r.active_calories ?? 0), 0)
  let strainScore = 18
  if (totalRecentCalories > 3000) strainScore = 15
  else if (totalRecentCalories >= 1500) strainScore = 25
  else if (totalRecentCalories >= 800) strainScore = 20
  else strainScore = 18

  const totalScore = Math.round(hrvScore + sleepScore + hrScore + strainScore)

  // Generate explanation
  const factors: string[] = []
  if (todayHrv && avgHrv) {
    const pct = Math.round(((todayHrv - avgHrv) / avgHrv) * 100)
    factors.push(`HRV is ${Math.abs(pct)}% ${pct >= 0 ? 'above' : 'below'} your baseline`)
  }
  if (lastSleep) {
    factors.push(`${Math.round(lastSleep / 60 * 10) / 10}h sleep last night`)
  }
  if (totalRecentCalories > 2500) factors.push('High activity load this week — your body may need recovery')

  const status = totalScore >= 70 ? 'optimal' : totalScore >= 40 ? 'good' : 'recovery'
  const advice = {
    optimal: 'Great day to push hard or try a new PR.',
    good: 'Moderate intensity workout recommended.',
    recovery: 'Prioritize rest, stretching, or light walking today.'
  }[status]

  return NextResponse.json({
    score: totalScore,
    status,
    advice,
    factors,
    components: { hrv: hrvScore, sleep: sleepScore, restingHr: hrScore, strain: strainScore },
  })
}
