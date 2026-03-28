import { apiLogger } from '@/lib/api-logger'
import {
  createSecureApiHandler,
  secureJsonResponse,
} from '@/lib/security'

type Intensity = 'rest' | 'easy' | 'moderate' | 'hard' | 'peak'

interface PrescriptionResult {
  intensity: Intensity
  intensity_label: string
  intensity_emoji: string
  recommended_workout_type: string
  rationale: string
  rationale_points: string[]
  suggested_workouts: string[]
  duration_range: string
  heart_rate_zone: string
  recovery_tip: string
  scores: {
    hrv: number | null
    sleep_hours: number | null
    readiness: number | null
    acwr: number | null
  }
}

function calcIntensity(hrv: number | null, sleepHours: number | null, readiness: number | null, acwr: number | null): {
  intensity: Intensity
  points: string[]
} {
  let score = 0 // 0-100 readiness score
  const points: string[] = []

  if (hrv !== null) {
    if (hrv >= 70) { score += 35; points.push(`HRV ${hrv.toFixed(0)}ms — excellent recovery`) }
    else if (hrv >= 50) { score += 20; points.push(`HRV ${hrv.toFixed(0)}ms — moderate recovery`) }
    else { score += 5; points.push(`HRV ${hrv.toFixed(0)}ms — low, body under stress`) }
  } else {
    score += 20 // neutral if no data
    points.push('No HRV data — defaulting to moderate')
  }

  if (sleepHours !== null) {
    if (sleepHours >= 8) { score += 35; points.push(`${sleepHours.toFixed(1)}h sleep — well rested`) }
    else if (sleepHours >= 7) { score += 25; points.push(`${sleepHours.toFixed(1)}h sleep — adequate`) }
    else if (sleepHours >= 6) { score += 15; points.push(`${sleepHours.toFixed(1)}h sleep — slightly low`) }
    else { score += 5; points.push(`${sleepHours.toFixed(1)}h sleep — insufficient, consider rest`) }
  } else {
    score += 20
  }

  if (readiness !== null) {
    score += Math.round(readiness * 0.3) // up to 30 points from readiness (0-100 scale)
    if (readiness >= 70) points.push(`Readiness ${readiness.toFixed(0)} — feeling good`)
    else if (readiness >= 40) points.push(`Readiness ${readiness.toFixed(0)} — moderate`)
    else points.push(`Readiness ${readiness.toFixed(0)} — take it easy`)
  }

  if (acwr !== null) {
    if (acwr > 1.5) { score -= 20; points.push(`ACWR ${acwr.toFixed(2)} — overreaching zone, injury risk elevated`) }
    else if (acwr > 1.3) { score -= 10; points.push(`ACWR ${acwr.toFixed(2)} — slightly high load`) }
    else if (acwr >= 0.8) { points.push(`ACWR ${acwr.toFixed(2)} — optimal training load`) }
    else { score -= 5; points.push(`ACWR ${acwr.toFixed(2)} — low load, room to push`) }
  }

  score = Math.max(0, Math.min(100, score))

  let intensity: Intensity
  if (score >= 80) intensity = 'peak'
  else if (score >= 65) intensity = 'hard'
  else if (score >= 45) intensity = 'moderate'
  else if (score >= 25) intensity = 'easy'
  else intensity = 'rest'

  return { intensity, points }
}

const WORKOUT_SUGGESTIONS: Record<Intensity, { type: string; workouts: string[]; duration: string; hrZone: string; emoji: string; label: string; tip: string }> = {
  rest: {
    type: 'Active Recovery',
    emoji: '🛌',
    label: 'Rest Day',
    workouts: ['Gentle walk (20 min)', 'Yoga / stretching', 'Foam rolling', 'Meditation'],
    duration: '0-30 min',
    hrZone: 'Zone 1 only (<50% max HR)',
    tip: 'Sleep is recovery. Consider going to bed 30min earlier tonight.',
  },
  easy: {
    type: 'Low Intensity Cardio',
    emoji: '🚶',
    label: 'Easy Day',
    workouts: ['Easy jog or walk (30-45 min)', 'Light cycling', 'Swimming (easy pace)', 'Mobility work'],
    duration: '30-45 min',
    hrZone: 'Zone 2 (60-70% max HR)',
    tip: 'Zone 2 cardio builds aerobic base without taxing CNS. Keep conversational pace.',
  },
  moderate: {
    type: 'Moderate Training',
    emoji: '🏃',
    label: 'Moderate Day',
    workouts: ['Tempo run (40 min)', 'Strength training (3×8, 70% 1RM)', 'Cycling with intervals', 'CrossFit at 75% intensity'],
    duration: '45-60 min',
    hrZone: 'Zone 3-4 (70-85% max HR)',
    tip: 'Good day for skill work and technique. Not peak effort.',
  },
  hard: {
    type: 'High Intensity',
    emoji: '💪',
    label: 'Hard Day',
    workouts: ['Interval run (5×800m)', 'Heavy strength (4×5, 85% 1RM)', 'HIIT (45 min)', 'Long run (60-75 min)'],
    duration: '60-75 min',
    hrZone: 'Zone 4-5 (85-95% max HR)',
    tip: 'Push hard but leave 1 rep in the tank. Fuel well post-workout.',
  },
  peak: {
    type: 'Peak Performance',
    emoji: '🔥',
    label: 'Peak Day',
    workouts: ['Race / competition', 'PR attempt', 'Max effort intervals', 'Heavy complex lifts'],
    duration: '60-90 min',
    hrZone: 'Zone 5 (>95% max HR OK)',
    tip: 'Your body is primed. Warm up well, execute your A-game.',
  },
}

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const today = new Date().toISOString().slice(0, 10)

    // Check for cached prescription today
    const { data: existing } = await supabase
      .from('workout_prescriptions')
      .select('*')
      .eq('user_id', user!.id)
      .eq('date', today)
      .single()

    // Fetch recent metrics
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: metrics } = await supabase
      .from('health_metrics')
      .select('metric_type, value, recorded_at')
      .eq('user_id', user!.id)
      .gte('recorded_at', since24h)
      .order('recorded_at', { ascending: false })

    // Extract latest values
    const get = (type: string) => metrics?.find(m => m.metric_type === type)?.value ?? null

    const hrv = get('hrv')
    const sleepMin = get('sleep_duration_minutes')
    const sleepHours = sleepMin ? sleepMin / 60 : null
    const readiness = get('readiness_score')

    // Calculate ACWR (acute 7d / chronic 28d steps ratio)
    const since28d = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: steps28, error: steps28Err } = await supabase.from('health_metrics').select('value').eq('user_id', user!.id).eq('metric_type', 'steps').gte('recorded_at', since28d)
    const { data: steps7, error: steps7Err } = await supabase.from('health_metrics').select('value').eq('user_id', user!.id).eq('metric_type', 'steps').gte('recorded_at', since7d)
    if (steps28Err || steps7Err) apiLogger('steps fetch error', steps28Err ?? steps7Err)

    let acwr: number | null = null
    if (steps28 && steps28.length >= 7 && steps7 && steps7.length >= 3) {
      const acute = steps7.reduce((s, r) => s + r.value, 0) / 7
      const chronic = steps28.reduce((s, r) => s + r.value, 0) / 28
      if (chronic > 0) acwr = Math.round((acute / chronic) * 100) / 100
    }

    const { intensity, points } = calcIntensity(hrv, sleepHours, readiness, acwr)
    const suggestion = WORKOUT_SUGGESTIONS[intensity]

    const result: PrescriptionResult = {
      intensity,
      intensity_label: suggestion.label,
      intensity_emoji: suggestion.emoji,
      recommended_workout_type: suggestion.type,
      rationale: points.join('. '),
      rationale_points: points,
      suggested_workouts: suggestion.workouts,
      duration_range: suggestion.duration,
      heart_rate_zone: suggestion.hrZone,
      recovery_tip: suggestion.tip,
      scores: { hrv, sleep_hours: sleepHours, readiness, acwr },
    }

    // Save/update today's prescription
    if (!existing) {
      const { error: upsertErr } = await supabase.from('workout_prescriptions').upsert({
        user_id: user!.id,
        date: today,
        intensity,
        recommended_workout_type: suggestion.type,
        rationale: result.rationale,
        hrv_score: hrv,
        sleep_quality: sleepHours,
        readiness_score: readiness,
        acwr,
      })
      if (upsertErr) apiLogger('prescription upsert error', upsertErr)
    }

    return secureJsonResponse({ prescription: result, cached: !!existing })
  }
)

export const PATCH = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    // Mark prescription as followed/not followed
    const { date, followed } = await request.json()
    const { error: updateErr } = await supabase.from('workout_prescriptions').update({ followed }).eq('user_id', user!.id).eq('date', date ?? new Date().toISOString().slice(0, 10))
    if (updateErr) apiLogger('prescription update error', updateErr)
    return secureJsonResponse({ success: true })
  }
)
