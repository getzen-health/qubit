import { createSecureApiHandler, secureJsonResponse } from '@/lib/security'

const DRINK_HYDRATION_FACTOR: Record<string, number> = {
  water: 1.0,
  tea: 0.9,
  coffee: 0.8,
  juice: 0.85,
  milk: 0.85,
  sports_drink: 1.0,
  soda: 0.75,
  alcohol: -0.5,
}

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    // Get body weight
    const { data: bodyComp } = await supabase
      .from('body_composition')
      .select('weight_kg')
      .eq('user_id', user!.id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()

    const weightKg = bodyComp?.weight_kg ?? 70

    // Base: 35ml/kg (EFSA 2023)
    const baseTarget = Math.round(weightKg * 35)

    // Exercise adjustment: check today's workouts
    const today = new Date().toISOString().slice(0, 10)
    const { data: workouts } = await supabase
      .from('workout_records')
      .select('duration_minutes, intensity')
      .eq('user_id', user!.id)
      .gte('started_at', today)
      .lt('started_at', today + 'T23:59:59')

    let exerciseBonus = 0
    if (workouts) {
      for (const w of workouts) {
        const hoursActive = (w.duration_minutes ?? 45) / 60
        const factor = w.intensity === 'high' ? 1000 : 500
        exerciseBonus += Math.round(hoursActive * factor)
      }
    }

    // Today's logged water
    const { data: todayLogs } = await supabase
      .from('water_logs')
      .select('amount_ml, drink_type')
      .eq('user_id', user!.id)
      .gte('logged_at', today)
      .lt('logged_at', today + 'T23:59:59')

    let consumed = 0
    if (todayLogs) {
      for (const log of todayLogs) {
        const factor = DRINK_HYDRATION_FACTOR[log.drink_type ?? 'water'] ?? 1.0
        consumed += Math.round(log.amount_ml * factor)
      }
    }

    const totalTarget = baseTarget + exerciseBonus
    const remaining = Math.max(0, totalTarget - consumed)
    const pct = Math.min(100, Math.round((consumed / totalTarget) * 100))

    // Hydration status
    let status = 'hydrated'
    let statusEmoji = '💧'
    if (pct < 40) { status = 'dehydrated'; statusEmoji = '⚠️' }
    else if (pct < 70) { status = 'moderate'; statusEmoji = '🟡' }
    else if (pct >= 100) { status = 'well-hydrated'; statusEmoji = '✅' }

    return secureJsonResponse({
      target_ml: totalTarget,
      base_ml: baseTarget,
      exercise_bonus_ml: exerciseBonus,
      consumed_ml: consumed,
      remaining_ml: remaining,
      percentage: pct,
      status,
      status_emoji: statusEmoji,
      weight_kg: weightKg,
      logs: todayLogs ?? [],
    })
  }
)
