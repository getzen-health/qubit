import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Seiler 80/20 polarization model
// Easy:     avg_hr < 77% HRmax  (zone 1)
// Moderate: avg_hr 77–87% HRmax (zone 2 — the "moderate zone" to avoid)
// Hard:     avg_hr > 87% HRmax  (zone 3+)

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch user age for HRmax estimate
  const { data: profile } = await supabase
    .from('users')
    .select('age')
    .eq('id', user.id)
    .single()

  // Fetch last 13 weeks of cardio workouts with heart rate data
  const since = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString()
  const { data: workouts, error } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, avg_heart_rate, max_heart_rate, workout_type')
    .eq('user_id', user.id)
    .not('avg_heart_rate', 'is', null)
    .gte('start_time', since)
    .order('start_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sessions = workouts ?? []

  // Determine HRmax: max observed, then age-based, then default 185
  const observedMax = sessions.reduce((m, s) => Math.max(m, s.max_heart_rate ?? 0), 0)
  const ageBasedMax = profile?.age ? 220 - profile.age : 0
  const hrmax = observedMax > 100 ? observedMax : ageBasedMax > 0 ? ageBasedMax : 185

  const lt1 = hrmax * 0.77
  const lt2 = hrmax * 0.87

  function classify(hr: number | null): 'easy' | 'moderate' | 'hard' {
    if (!hr) return 'easy'
    if (hr < lt1) return 'easy'
    if (hr < lt2) return 'moderate'
    return 'hard'
  }

  // Overall summary
  const total = sessions.length
  let easy = 0, moderate = 0, hard = 0
  for (const s of sessions) {
    const zone = classify(s.avg_heart_rate)
    if (zone === 'easy') easy++
    else if (zone === 'moderate') moderate++
    else hard++
  }

  const easyPct = total > 0 ? Math.round((easy / total) * 100) : 0
  const moderatePct = total > 0 ? Math.round((moderate / total) * 100) : 0
  const hardPct = total > 0 ? 100 - easyPct - moderatePct : 0

  // Polarization score: how close to Seiler's ideal 80/20 (easy/hard, with ~0% moderate)
  const score = total > 0 ? Math.round(
    100 -
      Math.abs(easyPct - 80) * 0.8 -
      Math.abs(hardPct - 20) * 0.8 -
      moderatePct * 0.6
  ) : 0

  // Weekly trend (last 13 weeks)
  const weeks: Record<string, { easy: number; total: number }> = {}
  for (const s of sessions) {
    const d = new Date(s.start_time)
    // Floor to Monday of week
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((day + 6) % 7))
    const wk = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!weeks[wk]) weeks[wk] = { easy: 0, total: 0 }
    weeks[wk].total++
    if (classify(s.avg_heart_rate) === 'easy') weeks[wk].easy++
  }
  const weeklyTrend = Object.entries(weeks).map(([week, { easy: e, total: t }]) => ({
    week,
    easyPct: t > 0 ? Math.round((e / t) * 100) : 0,
  }))

  // Sport breakdown
  const sports: Record<string, { easy: number; moderate: number; hard: number; sessions: number }> = {}
  for (const s of sessions) {
    const type = s.workout_type
      ? s.workout_type
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
          .slice(0, 12)
      : 'Other'
    if (!sports[type]) sports[type] = { easy: 0, moderate: 0, hard: 0, sessions: 0 }
    sports[type].sessions++
    const zone = classify(s.avg_heart_rate)
    sports[type][zone]++
  }
  const sportBreakdown = Object.entries(sports)
    .sort((a, b) => b[1].sessions - a[1].sessions)
    .slice(0, 6)
    .map(([sport, d]) => ({
      sport,
      easy: d.sessions > 0 ? Math.round((d.easy / d.sessions) * 100) : 0,
      moderate: d.sessions > 0 ? Math.round((d.moderate / d.sessions) * 100) : 0,
      hard: d.sessions > 0 ? Math.round((d.hard / d.sessions) * 100) : 0,
      sessions: d.sessions,
    }))

  return NextResponse.json({
    summary: { score: Math.max(0, score), totalSessions: total, easyPct, moderatePct, hardPct },
    weeklyTrend,
    sportBreakdown,
    hasData: total > 0,
  })
}
