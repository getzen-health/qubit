import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const StandingClient = dynamic(() => import('./standing-client').then(m => ({ default: m.StandingClient })))
import type { StandingData, DailyStanding, HourlyRate } from './standing-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Standing Hours Analysis' }

// ─── Mock data ────────────────────────────────────────────────────────────────

function buildMockData(): StandingData {
  const today = new Date()

  // 30 days of stand hour counts (offset 0 = today, 29 = oldest)
  const rawValues: Array<{ offset: number; hours: number }> = [
    { offset: 29, hours: 12 },
    { offset: 28, hours: 13 },
    { offset: 27, hours: 11 },
    { offset: 26, hours: 14 },
    { offset: 25, hours: 10 },
    { offset: 24, hours: 6  },  // low day
    { offset: 23, hours: 8  },
    { offset: 22, hours: 12 },
    { offset: 21, hours: 13 },
    { offset: 20, hours: 14 },
    { offset: 19, hours: 11 },
    { offset: 18, hours: 12 },
    { offset: 17, hours: 7  },  // low day
    { offset: 16, hours: 13 },
    { offset: 15, hours: 14 },
    { offset: 14, hours: 12 },
    { offset: 13, hours: 11 },
    { offset: 12, hours: 13 },
    { offset: 11, hours: 6  },  // low day
    { offset: 10, hours: 10 },
    { offset: 9,  hours: 12 },
    { offset: 8,  hours: 13 },
    { offset: 7,  hours: 8  },
    { offset: 6,  hours: 11 },
    { offset: 5,  hours: 14 },
    { offset: 4,  hours: 12 },
    { offset: 3,  hours: 13 },
    { offset: 2,  hours: 11 },
    { offset: 1,  hours: 10 },
    { offset: 0,  hours: 9  },  // today
  ]

  const daily: DailyStanding[] = rawValues
    .sort((a, b) => b.offset - a.offset)   // oldest first
    .map(({ offset, hours }) => {
      const d = new Date(today)
      d.setDate(d.getDate() - offset)
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return { date: label, hours, metGoal: hours >= 12 }
    })
    .reverse()  // ascending (oldest → newest) for charts

  // Hourly pattern: 6am–10pm = 17 hours
  // Good standing 9am–5pm, tapering in the evenings
  const hourlyRates: HourlyRate[] = [
    { hour: '6am',  rate: 35 },
    { hour: '7am',  rate: 50 },
    { hour: '8am',  rate: 65 },
    { hour: '9am',  rate: 80 },
    { hour: '10am', rate: 85 },
    { hour: '11am', rate: 82 },
    { hour: '12pm', rate: 75 },
    { hour: '1pm',  rate: 70 },
    { hour: '2pm',  rate: 83 },
    { hour: '3pm',  rate: 78 },
    { hour: '4pm',  rate: 76 },
    { hour: '5pm',  rate: 68 },
    { hour: '6pm',  rate: 52 },
    { hour: '7pm',  rate: 45 },
    { hour: '8pm',  rate: 38 },
    { hour: '9pm',  rate: 28 },
    { hour: '10pm', rate: 20 },
  ]

  const allHours = rawValues.map((v) => v.hours)
  const avg30d = +(allHours.reduce((s, h) => s + h, 0) / allHours.length).toFixed(1)
  const daysMetGoal = allHours.filter((h) => h >= 12).length

  // Current streak (from today backwards)
  const sortedAsc = [...rawValues].sort((a, b) => a.offset - b.offset)
  let currentStreak = 0
  for (const { offset, hours } of sortedAsc) {
    if (offset > (sortedAsc[currentStreak]?.offset ?? 0)) break
    if (hours >= 12) currentStreak++
    else break
  }
  // Recompute properly: iterate from offset 0 upward
  currentStreak = 0
  for (let i = 0; i < 30; i++) {
    const entry = rawValues.find((v) => v.offset === i)
    if (entry && entry.hours >= 12) currentStreak++
    else break
  }

  // Longest streak
  let longest = 0
  let run = 0
  for (const { hours } of rawValues.sort((a, b) => b.offset - a.offset)) {
    if (hours >= 12) { run++; longest = Math.max(longest, run) }
    else run = 0
  }

  return {
    todayHours: 9,
    avg30d,
    daysMetGoal,
    currentStreak,
    longestStreak: longest,
    daily,
    hourlyRates,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StandingPage() {
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
            href="/activity"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to activity"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Standing Hours</h1>
            <p className="text-sm text-text-secondary">Daily stand goal · Apple Watch</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <StandingClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
