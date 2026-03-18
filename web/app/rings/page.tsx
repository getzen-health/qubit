import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RingsClient } from './rings-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Activity Rings' }

export default async function RingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const startDate = thirtyDaysAgo.toISOString().slice(0, 10)

  const [{ data: summaries }, { data: profile }, { data: standRecords }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, steps, active_calories, active_minutes')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .order('date', { ascending: true }),
    supabase
      .from('users')
      .select('step_goal, calorie_goal')
      .eq('id', user.id)
      .single(),
    supabase
      .from('health_records')
      .select('start_time, value, type')
      .eq('user_id', user.id)
      .in('type', ['stand_hours', 'stand_hours_goal'])
      .gte('start_time', thirtyDaysAgo.toISOString())
      .order('start_time', { ascending: true }),
  ])

  const calGoal = profile?.calorie_goal ?? 500
  const standGoal = 12 // Apple default is 12 hours

  // Get stand data by day
  const standByDay = new Map<string, { hours: number; goal: number }>()
  for (const r of standRecords ?? []) {
    const day = r.start_time.slice(0, 10)
    const existing = standByDay.get(day) ?? { hours: 0, goal: standGoal }
    if (r.type === 'stand_hours') existing.hours = r.value
    if (r.type === 'stand_hours_goal') existing.goal = r.value
    standByDay.set(day, existing)
  }

  const days = (summaries ?? []).map((s) => {
    const stand = standByDay.get(s.date)
    return {
      date: s.date,
      moveCalories: s.active_calories ?? 0,
      moveGoal: calGoal,
      exerciseMinutes: s.active_minutes ?? 0,
      exerciseGoal: 30,
      standHours: stand?.hours ?? null,
      standGoal: stand?.goal ?? standGoal,
    }
  })

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
            <h1 className="text-xl font-bold text-text-primary">Activity Rings</h1>
            <p className="text-sm text-text-secondary">Move · Exercise · Stand</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <RingsClient days={days} />
      </main>
      <BottomNav />
    </div>
  )
}
