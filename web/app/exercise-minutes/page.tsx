import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ExerciseMinutesClient, type ExerciseMinutesData, type WeekData, type DayPattern } from './exercise-minutes-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Exercise Minutes' }

// ─── Mock data ────────────────────────────────────────────────────────────────

function buildMockData(): ExerciseMinutesData {
  // 52 weeks of exercise minutes, ending with "this week" = 87 min (in progress)
  // Pattern: mostly 120–180, several at 60–90, one or two at 200+
  const weekMinutes: number[] = [
    // weeks 1–13 (oldest quarter)
    145, 162, 130, 175, 88,  155, 140, 168, 72,  158, 135, 180, 162,
    // weeks 14–26
    110, 155, 90,  170, 148, 60,  165, 138, 155, 175, 120, 145, 210,
    // weeks 27–39
    158, 135, 172, 85,  160, 145, 130, 165, 155, 178, 70,  152, 140,
    // weeks 40–51 (last 12 complete weeks)
    168, 155, 130, 80,  162, 145, 175, 155, 140, 220, 168, 155,
    // week 52 = this week (in progress)
    87,
  ]

  // Build week labels — week 52 ends on the current Thursday (2026-03-19)
  // Week starts on Monday; current week started 2026-03-16
  const thisWeekStart = new Date()

  const weeks52: WeekData[] = weekMinutes.map((minutes, i) => {
    const offset = 51 - i          // weeks back from current week
    const d = new Date(thisWeekStart)
    d.setDate(d.getDate() - offset * 7)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { weekLabel: label, minutes }
  })

  const weeks26 = weeks52.slice(26)

  // Goal streak — count consecutive weeks ≥150 from the most recent complete weeks
  // (week 52 at index 51 is this week = 87 min, so start from index 50)
  let streak = 0
  for (let i = 50; i >= 0; i--) {
    if (weekMinutes[i] >= 150) streak++
    else break
  }
  // streak = 2 (weeks 50 and 51 = 155 and 168 min)

  const completeWeeks = weekMinutes.slice(0, 51)
  const bestWeekMinutes = Math.max(...completeWeeks)                                          // 220
  const avg12WeekMinutes = Math.round(
    completeWeeks.slice(-12).reduce((s, v) => s + v, 0) / 12
  )

  // Day-of-week pattern — plausible distribution summing to ~150 min/week
  const dayPattern: DayPattern[] = [
    { day: 'Mon', avgMinutes: 18 },
    { day: 'Tue', avgMinutes: 32 },
    { day: 'Wed', avgMinutes: 14 },
    { day: 'Thu', avgMinutes: 28 },
    { day: 'Fri', avgMinutes: 12 },
    { day: 'Sat', avgMinutes: 42 },
    { day: 'Sun', avgMinutes: 22 },
  ]

  return {
    thisWeekMinutes: 87,
    goalStreak: streak,
    bestWeekMinutes,
    avg12WeekMinutes,
    weeks52,
    weeks26,
    dayPattern,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ExerciseMinutesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = buildMockData()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/rings"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Exercise Minutes</h1>
            <p className="text-sm text-text-secondary">
              WHO 150-min/week physical activity goal
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <ExerciseMinutesClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
