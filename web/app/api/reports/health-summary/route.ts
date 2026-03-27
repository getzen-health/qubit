import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const since = thirtyDaysAgo.toISOString()

  // Fetch all health data in parallel
  const [stepsResult, sleepResult, heartRateResult, weightResult, moodResult, labResult, workoutsResult] = await Promise.all([
    supabase.from('health_metrics').select('value,recorded_at').eq('user_id', user.id).eq('metric_type', 'steps').gte('recorded_at', since).order('recorded_at'),
    supabase.from('health_metrics').select('value,recorded_at').eq('user_id', user.id).eq('metric_type', 'sleep_duration_minutes').gte('recorded_at', since),
    supabase.from('health_metrics').select('value,recorded_at').eq('user_id', user.id).eq('metric_type', 'resting_heart_rate').gte('recorded_at', since),
    supabase.from('health_metrics').select('value,recorded_at').eq('user_id', user.id).eq('metric_type', 'weight').gte('recorded_at', since).order('recorded_at'),
    supabase.from('mood_logs').select('score,created_at').eq('user_id', user.id).gte('created_at', since),
    supabase.from('lab_results').select('biomarker_name,value,unit,status,tested_at').eq('user_id', user.id).order('tested_at', { ascending: false }).limit(20),
    supabase.from('workouts').select('name,duration_minutes,calories,started_at').eq('user_id', user.id).gte('started_at', since).order('started_at', { ascending: false }),
  ])

  const steps = stepsResult.data ?? []
  const sleep = sleepResult.data ?? []
  const hr = heartRateResult.data ?? []
  const weight = weightResult.data ?? []
  const mood = moodResult.data ?? []
  const labs = labResult.data ?? []
  const workouts = workoutsResult.data ?? []

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null

  return NextResponse.json({
    user_id: user.id,
    period: { start: thirtyDaysAgo.toISOString(), end: new Date().toISOString() },
    stats: {
      steps: { avg: avg(steps.map(s => s.value)), total: steps.reduce((a, s) => a + s.value, 0), days: steps.length },
      sleep: { avg_hours: sleep.length ? Math.round((avg(sleep.map(s => s.value)) ?? 0) / 6) / 10 : null, days: sleep.length },
      resting_hr: { avg: avg(hr.map(h => h.value)) },
      weight: {
        start: weight[0]?.value ?? null,
        end: weight[weight.length - 1]?.value ?? null,
        change: weight.length >= 2 ? Math.round((weight[weight.length-1].value - weight[0].value) * 10) / 10 : null,
      },
      mood: { avg: mood.length ? Math.round((avg(mood.map(m => m.score)) ?? 0) * 10) / 10 : null, logs: mood.length },
      workouts: { count: workouts.length, total_minutes: workouts.reduce((a, w) => a + (w.duration_minutes ?? 0), 0) },
    },
    labs,
    recent_workouts: workouts.slice(0, 5),
    generated_at: new Date().toISOString(),
  })
}
