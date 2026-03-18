import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SleepScheduleClient } from './schedule-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Sleep Schedule' }

export default async function SleepSchedulePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const [{ data: records }, { data: profile }] = await Promise.all([
    supabase
      .from('sleep_records')
      .select('start_time, end_time, duration_minutes')
      .eq('user_id', user.id)
      .gte('start_time', sixtyDaysAgo.toISOString())
      .gt('duration_minutes', 60) // filter out naps / false starts
      .order('start_time', { ascending: true }),
    supabase
      .from('users')
      .select('sleep_goal_minutes')
      .eq('id', user.id)
      .single(),
  ])

  const sleepGoalMinutes = profile?.sleep_goal_minutes ?? 480

  // Compute per-night stats: bedtime hour (fractional, 0–24 relative to noon for overnight math),
  // wake time, and sleep debt
  const nights = (records ?? []).map((r) => {
    const bedtime = new Date(r.start_time)
    const waketime = new Date(r.end_time)
    // Represent bedtime as hours since noon (so 10pm = 10, 11pm = 11, midnight = 12, 1am = 13, etc.)
    let bedHour = bedtime.getHours() + bedtime.getMinutes() / 60
    if (bedHour < 12) bedHour += 24 // before noon = next day in hours-since-noon frame
    bedHour -= 12 // hours since noon

    let wakeHour = waketime.getHours() + waketime.getMinutes() / 60

    const weekday = bedtime.getDay() // 0=Sun, 6=Sat
    const isWeekend = weekday === 0 || weekday === 5 || weekday === 6

    return {
      date: bedtime.toISOString().slice(0, 10),
      bedtimeIso: r.start_time,
      waketimeIso: r.end_time,
      bedHour,          // hours since noon (8 = 8pm, 12 = midnight, 13 = 1am)
      wakeHour,         // 0-24
      durationMinutes: r.duration_minutes,
      isWeekend,
      weekday,
      debt: r.duration_minutes - sleepGoalMinutes, // negative = deficit
    }
  })

  // Cumulative sleep debt (rolling, reset on positive nights)
  let cumDebt = 0
  const nightsWithDebt = nights.map((n) => {
    cumDebt += n.debt
    if (cumDebt > 0) cumDebt = 0 // cap at zero (can't bank sleep ahead)
    return { ...n, cumDebtMinutes: cumDebt }
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/sleep"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to sleep"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Sleep Schedule</h1>
            <p className="text-sm text-text-secondary">Consistency · Debt · Rhythm</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <SleepScheduleClient nights={nightsWithDebt} sleepGoalMinutes={sleepGoalMinutes} />
      </main>
      <BottomNav />
    </div>
  )
}
