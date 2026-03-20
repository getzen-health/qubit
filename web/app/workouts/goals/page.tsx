import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { WorkoutGoalsClient } from './workout-goals-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Workout Goals' }

// ─── Mock data ───────────────────────────────────────────────────────────────

// 13 weeks ending this week (week 13 = current, in progress)
const WEEKLY_DATA = [
  { week: 'Dec 23', sessions: 3, goalMet: false },
  { week: 'Dec 30', sessions: 4, goalMet: true },
  { week: 'Jan 6',  sessions: 2, goalMet: false },
  { week: 'Jan 13', sessions: 5, goalMet: true },
  { week: 'Jan 20', sessions: 4, goalMet: true },
  { week: 'Jan 27', sessions: 1, goalMet: false },
  { week: 'Feb 3',  sessions: 4, goalMet: true },
  { week: 'Feb 10', sessions: 3, goalMet: false },
  { week: 'Feb 17', sessions: 4, goalMet: true },
  { week: 'Feb 24', sessions: 5, goalMet: true },
  { week: 'Mar 3',  sessions: 4, goalMet: true },
  { week: 'Mar 10', sessions: 4, goalMet: true },
  { week: 'Mar 17', sessions: 3, goalMet: false }, // current week, in progress
]

const SPORT_BREAKDOWN = [
  { sport: 'Running',   sessions: 24, color: '#22c55e' },
  { sport: 'Cycling',   sessions: 18, color: '#3b82f6' },
  { sport: 'Strength',  sessions: 12, color: '#a855f7' },
  { sport: 'HIIT',      sessions: 8,  color: '#f97316' },
  { sport: 'Yoga',      sessions: 6,  color: '#06b6d4' },
  { sport: 'Hiking',    sessions: 5,  color: '#eab308' },
]

const MOCK_DATA = {
  weeklyData: WEEKLY_DATA,
  sportBreakdown: SPORT_BREAKDOWN,
  weeklyGoal: 4,
  currentWeekSessions: 3,
  currentStreak: 4,
  weeksHit: 10,
  totalWeeks: 13,
  totalSessionsQuarter: 52,
}

export default async function WorkoutGoalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Workout Goals 🏆</h1>
            <p className="text-sm text-text-secondary">
              {MOCK_DATA.weeksHit}/{MOCK_DATA.totalWeeks} weeks hit · last 13 weeks
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <WorkoutGoalsClient data={MOCK_DATA} />
      </main>
      <BottomNav />
    </div>
  )
}
