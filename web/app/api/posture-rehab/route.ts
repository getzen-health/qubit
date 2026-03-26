import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [assessmentsResult, logsResult] = await Promise.all([
    supabase
      .from('posture_assessments')
      .select('id, date, deviations, pain_areas, ergonomic_score, notes, created_at')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(5),
    supabase
      .from('posture_exercise_logs')
      .select('id, date, exercise_id, sets_completed, reps_completed, duration_sec, deviation_focus, notes, created_at')
      .eq('user_id', user.id)
      .gte('date', since.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(30),
  ])

  if (assessmentsResult.error)
    return NextResponse.json({ error: assessmentsResult.error.message }, { status: 500 })
  if (logsResult.error)
    return NextResponse.json({ error: logsResult.error.message }, { status: 500 })

  // Progress metrics: exercise frequency per day for heatmap
  const logsByDate: Record<string, number> = {}
  for (const log of logsResult.data ?? []) {
    logsByDate[log.date] = (logsByDate[log.date] ?? 0) + 1
  }

  // Most completed exercises
  const exerciseCount: Record<string, number> = {}
  for (const log of logsResult.data ?? []) {
    exerciseCount[log.exercise_id] = (exerciseCount[log.exercise_id] ?? 0) + 1
  }
  const topExercises = Object.entries(exerciseCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => ({ id, count }))

  return NextResponse.json({
    assessments: assessmentsResult.data ?? [],
    exerciseLogs: logsResult.data ?? [],
    logsByDate,
    topExercises,
  })
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const rateLimitOk = await checkRateLimit(`posture-rehab:${ip}`, 30, 60)
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { type } = body

  if (type === 'assessment') {
    const { date, deviations, pain_areas, ergonomic_score, notes } = body

    if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 })
    if (typeof ergonomic_score !== 'number' || ergonomic_score < 0 || ergonomic_score > 8) {
      return NextResponse.json({ error: 'ergonomic_score must be 0–8' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('posture_assessments')
      .upsert(
        {
          user_id: user.id,
          date,
          deviations: deviations ?? {},
          pain_areas: pain_areas ?? [],
          ergonomic_score,
          notes: notes ?? null,
        },
        { onConflict: 'user_id,date' },
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (type === 'exercise_log') {
    const { date, exercise_id, sets_completed, reps_completed, duration_sec, deviation_focus, notes } = body

    if (!date || !exercise_id) {
      return NextResponse.json({ error: 'date and exercise_id are required' }, { status: 400 })
    }
    if (typeof sets_completed !== 'number' || sets_completed < 1) {
      return NextResponse.json({ error: 'sets_completed must be ≥ 1' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('posture_exercise_logs')
      .insert({
        user_id: user.id,
        date,
        exercise_id,
        sets_completed,
        reps_completed: reps_completed ?? null,
        duration_sec: duration_sec ?? null,
        deviation_focus: deviation_focus ?? null,
        notes: notes ?? null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'type must be "assessment" or "exercise_log"' }, { status: 400 })
}
