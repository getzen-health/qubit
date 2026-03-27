import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const since = new Date()
    since.setDate(since.getDate() - 30)

    const [assessmentsResult, logsResult] = await Promise.all([
      supabase
        .from('posture_assessments')
        .select('id, date, deviations, pain_areas, ergonomic_score, notes, created_at')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .limit(5),
      supabase
        .from('posture_exercise_logs')
        .select('id, date, exercise_id, sets_completed, reps_completed, duration_sec, deviation_focus, notes, created_at')
        .eq('user_id', user!.id)
        .gte('date', since.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(30),
    ])

    if (assessmentsResult.error)
      return secureErrorResponse('Failed to fetch assessments', 500)
    if (logsResult.error)
      return secureErrorResponse('Failed to fetch exercise logs', 500)

    const logsByDate: Record<string, number> = {}
    for (const log of logsResult.data ?? []) {
      logsByDate[log.date] = (logsByDate[log.date] ?? 0) + 1
    }

    const exerciseCount: Record<string, number> = {}
    for (const log of logsResult.data ?? []) {
      exerciseCount[log.exercise_id] = (exerciseCount[log.exercise_id] ?? 0) + 1
    }
    const topExercises = Object.entries(exerciseCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({ id, count }))

    return secureJsonResponse({
      assessments: assessmentsResult.data ?? [],
      exerciseLogs: logsResult.data ?? [],
      logsByDate,
      topExercises,
    })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const { type } = body

    if (type === 'assessment') {
      const { date, deviations, pain_areas, ergonomic_score, notes } = body

      if (!date) return secureErrorResponse('date is required', 400)
      if (typeof ergonomic_score !== 'number' || ergonomic_score < 0 || ergonomic_score > 8) {
        return secureErrorResponse('ergonomic_score must be 0–8', 400)
      }

      const { data, error } = await supabase
        .from('posture_assessments')
        .upsert(
          {
            user_id: user!.id,
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

      if (error) return secureErrorResponse('Failed to save assessment', 500)
      return secureJsonResponse({ data })
    }

    if (type === 'exercise_log') {
      const { date, exercise_id, sets_completed, reps_completed, duration_sec, deviation_focus, notes } = body

      if (!date || !exercise_id) {
        return secureErrorResponse('date and exercise_id are required', 400)
      }
      if (typeof sets_completed !== 'number' || sets_completed < 1) {
        return secureErrorResponse('sets_completed must be ≥ 1', 400)
      }

      const { data, error } = await supabase
        .from('posture_exercise_logs')
        .insert({
          user_id: user!.id,
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

      if (error) return secureErrorResponse('Failed to save exercise log', 500)
      return secureJsonResponse({ data })
    }

    return secureErrorResponse('type must be "assessment" or "exercise_log"', 400)
  }
)
