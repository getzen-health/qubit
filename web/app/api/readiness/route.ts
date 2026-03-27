import { calculateBodyBattery, analyzeBatteryTrend, TRAINING_RECOMMENDATION_LABELS, type BodyBatteryInputs } from '@/lib/body-battery'
import { createSecureApiHandler, secureJsonResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [summaryRes, sleepRes, goalsRes, batteryHistoryRes] = await Promise.all([
      supabase.from('daily_summaries')
        .select('date, resting_hr, hrv_ms, active_calories, steps')
        .eq('user_id', user!.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false }),
      supabase.from('sleep_records')
        .select('sleep_date, total_sleep_minutes, sleep_efficiency, deep_sleep_minutes, rem_sleep_minutes')
        .eq('user_id', user!.id)
        .gte('sleep_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('sleep_date', { ascending: false })
        .limit(7),
      supabase.from('user_goals')
        .select('target_sleep_hours')
        .eq('user_id', user!.id)
        .single(),
      supabase.from('body_battery_scores')
        .select('date, score, category')
        .eq('user_id', user!.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false }),
    ])

    const summaries = summaryRes.data ?? []
    const sleepRecords = sleepRes.data ?? []
    const lastSleep = sleepRecords[0]

    // Compute 7-day HRV + RHR baselines
    const recentSummaries = summaries.filter(s => new Date(s.date) >= sevenDaysAgo)
    const hrvValues = recentSummaries.filter(s => s.hrv_ms).map(s => s.hrv_ms as number)
    const hrValues = recentSummaries.filter(s => s.resting_hr).map(s => s.resting_hr as number)
    const hrvBaseline = hrvValues.length ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length : undefined
    const rhrBaseline = hrValues.length ? hrValues.reduce((a, b) => a + b, 0) / hrValues.length : undefined

    // Compute sleep debt (7-day cumulative vs 8h target)
    const targetHours = goalsRes.data?.target_sleep_hours ?? 8
    const sleepDebtHours = sleepRecords.reduce((debt, r) => {
      const got = (r.total_sleep_minutes ?? 0) / 60
      return debt + Math.max(0, targetHours - got)
    }, 0)

    // Build inputs for body battery
    const inputs: BodyBatteryInputs = {
      sleepDurationHours: lastSleep ? (lastSleep.total_sleep_minutes ?? 0) / 60 : undefined,
      sleepEfficiency: lastSleep?.sleep_efficiency ?? undefined,
      sleepDebtHours,
      sleepStageScore: lastSleep
        ? (((lastSleep.deep_sleep_minutes ?? 0) + (lastSleep.rem_sleep_minutes ?? 0)) /
            Math.max(1, lastSleep.total_sleep_minutes ?? 1)) * 100
        : undefined,
      hrvRmssdMs: summaries[0]?.hrv_ms ?? undefined,
      hrvBaseline7d: hrvBaseline,
      restingHrBpm: summaries[0]?.resting_hr ?? undefined,
      restingHrBaseline7d: rhrBaseline,
    }

    const result = calculateBodyBattery(inputs)
    const trend = analyzeBatteryTrend(
      (batteryHistoryRes.data ?? []).map(r => ({ date: r.date, score: r.score, category: r.category as any }))
    )
    const trainingLabel = TRAINING_RECOMMENDATION_LABELS[result.trainingRecommendation]

    return secureJsonResponse({
      score: result.score,
      category: result.category,
      label: result.label,
      color: result.color,
      subScores: result.subScores,
      trainingRecommendation: {
        key: result.trainingRecommendation,
        ...trainingLabel,
      },
      limitingFactor: result.limitingFactor,
      topInsights: result.topInsights,
      trend,
      // Legacy fields for backward compatibility
      status: result.category === 'peak' || result.category === 'high' ? 'optimal'
             : result.category === 'moderate' ? 'good' : 'recovery',
      advice: trainingLabel.description,
      factors: result.topInsights,
      components: {
        hrv: result.subScores.cardiac,
        sleep: result.subScores.sleep,
        restingHr: result.subScores.cardiac,
        strain: result.subScores.trainingBalance,
      },
    })
  }
)
