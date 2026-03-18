import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ReadyClient } from './ready-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: "Today's Readiness" }

export default async function ReadyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const since90 = ninetyDaysAgo.toISOString().slice(0, 10)

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const since14 = fourteenDaysAgo.toISOString()

  const [{ data: summaries }, { data: recentWorkouts }, { data: sleepRecords }, { data: profile }] =
    await Promise.all([
      supabase
        .from('daily_summaries')
        .select('date, avg_hrv, resting_heart_rate, sleep_duration_minutes, active_calories, recovery_score, steps')
        .eq('user_id', user.id)
        .gte('date', since90)
        .order('date', { ascending: true }),
      supabase
        .from('workout_records')
        .select('start_time, workout_type, duration_minutes, active_calories')
        .eq('user_id', user.id)
        .gte('start_time', since14)
        .gt('duration_minutes', 10)
        .order('start_time', { ascending: false }),
      supabase
        .from('sleep_records')
        .select('end_time, duration_minutes')
        .eq('user_id', user.id)
        .gte('start_time', since14)
        .gt('duration_minutes', 60)
        .order('start_time', { ascending: false }),
      supabase
        .from('users')
        .select('sleep_goal_minutes, step_goal')
        .eq('id', user.id)
        .single(),
    ])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Today&apos;s Readiness</h1>
            <p className="text-sm text-text-secondary">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <ReadyClient
          summaries={summaries ?? []}
          recentWorkouts={recentWorkouts ?? []}
          sleepRecords={sleepRecords ?? []}
          sleepGoalMinutes={profile?.sleep_goal_minutes ?? 480}
        />
      </main>
      <BottomNav />
    </div>
  )
}
