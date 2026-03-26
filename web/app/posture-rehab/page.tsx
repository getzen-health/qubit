import { createClient } from '@/lib/supabase/server'
import { PostureClient } from './posture-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = {
  title: 'Posture Rehabilitation | KQuarks',
  description: 'Janda-based posture assessment, corrective exercises, and ergonomic guidance',
}

export default async function PostureRehabPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialData = null

  if (user) {
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

    initialData = {
      assessments: assessmentsResult.data ?? [],
      exerciseLogs: logsResult.data ?? [],
      logsByDate,
      topExercises,
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PostureClient initialData={initialData} />
      <BottomNav />
    </div>
  )
}
