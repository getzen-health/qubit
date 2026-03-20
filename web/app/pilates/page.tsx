import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PilatesClient, type PilatesData, type MonthlyBucket, type Session } from './pilates-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Pilates & Barre Analytics' }

// ─── Mock data ────────────────────────────────────────────────────────────────

type SessionType = 'Pilates' | 'Barre' | 'Flexibility' | 'Core Training'

interface RawSession {
  type: SessionType
  duration: number  // minutes
  calories: number
  month: string    // 'YYYY-MM'
}

function buildMockData(): PilatesData {
  // 6 months: Oct 2025 – Mar 2026
  // ~3-4 sessions/week, mostly 45–60 min, realistic calorie range
  const months = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03']

  // Per-month raw sessions (hand-crafted for realism)
  const rawByMonth: Record<string, RawSession[]> = {
    '2025-10': [
      { type: 'Pilates', duration: 50, calories: 195, month: '2025-10' },
      { type: 'Flexibility', duration: 40, calories: 130, month: '2025-10' },
      { type: 'Barre', duration: 55, calories: 230, month: '2025-10' },
      { type: 'Pilates', duration: 45, calories: 180, month: '2025-10' },
      { type: 'Core Training', duration: 35, calories: 165, month: '2025-10' },
      { type: 'Pilates', duration: 60, calories: 220, month: '2025-10' },
      { type: 'Barre', duration: 50, calories: 215, month: '2025-10' },
      { type: 'Flexibility', duration: 30, calories: 110, month: '2025-10' },
      { type: 'Pilates', duration: 55, calories: 200, month: '2025-10' },
      { type: 'Core Training', duration: 40, calories: 175, month: '2025-10' },
      { type: 'Barre', duration: 60, calories: 245, month: '2025-10' },
      { type: 'Pilates', duration: 45, calories: 185, month: '2025-10' },
      { type: 'Flexibility', duration: 50, calories: 145, month: '2025-10' },
      { type: 'Pilates', duration: 30, calories: 140, month: '2025-10' },
    ],
    '2025-11': [
      { type: 'Pilates', duration: 55, calories: 205, month: '2025-11' },
      { type: 'Barre', duration: 60, calories: 250, month: '2025-11' },
      { type: 'Core Training', duration: 45, calories: 190, month: '2025-11' },
      { type: 'Pilates', duration: 50, calories: 195, month: '2025-11' },
      { type: 'Flexibility', duration: 45, calories: 140, month: '2025-11' },
      { type: 'Barre', duration: 55, calories: 225, month: '2025-11' },
      { type: 'Pilates', duration: 60, calories: 215, month: '2025-11' },
      { type: 'Core Training', duration: 35, calories: 160, month: '2025-11' },
      { type: 'Flexibility', duration: 30, calories: 105, month: '2025-11' },
      { type: 'Pilates', duration: 45, calories: 180, month: '2025-11' },
      { type: 'Barre', duration: 50, calories: 210, month: '2025-11' },
      { type: 'Pilates', duration: 55, calories: 200, month: '2025-11' },
      { type: 'Core Training', duration: 40, calories: 170, month: '2025-11' },
    ],
    '2025-12': [
      { type: 'Pilates', duration: 50, calories: 190, month: '2025-12' },
      { type: 'Flexibility', duration: 40, calories: 125, month: '2025-12' },
      { type: 'Barre', duration: 55, calories: 228, month: '2025-12' },
      { type: 'Pilates', duration: 45, calories: 178, month: '2025-12' },
      { type: 'Core Training', duration: 40, calories: 172, month: '2025-12' },
      { type: 'Flexibility', duration: 50, calories: 148, month: '2025-12' },
      { type: 'Pilates', duration: 60, calories: 218, month: '2025-12' },
      { type: 'Barre', duration: 45, calories: 198, month: '2025-12' },
      { type: 'Pilates', duration: 55, calories: 202, month: '2025-12' },
      { type: 'Core Training', duration: 35, calories: 158, month: '2025-12' },
      { type: 'Barre', duration: 60, calories: 248, month: '2025-12' },
    ],
    '2026-01': [
      { type: 'Pilates', duration: 55, calories: 208, month: '2026-01' },
      { type: 'Barre', duration: 60, calories: 252, month: '2026-01' },
      { type: 'Core Training', duration: 45, calories: 188, month: '2026-01' },
      { type: 'Flexibility', duration: 50, calories: 150, month: '2026-01' },
      { type: 'Pilates', duration: 50, calories: 195, month: '2026-01' },
      { type: 'Barre', duration: 55, calories: 228, month: '2026-01' },
      { type: 'Pilates', duration: 60, calories: 220, month: '2026-01' },
      { type: 'Core Training', duration: 40, calories: 175, month: '2026-01' },
      { type: 'Flexibility', duration: 35, calories: 118, month: '2026-01' },
      { type: 'Pilates', duration: 45, calories: 182, month: '2026-01' },
      { type: 'Barre', duration: 50, calories: 212, month: '2026-01' },
      { type: 'Pilates', duration: 55, calories: 205, month: '2026-01' },
      { type: 'Core Training', duration: 45, calories: 180, month: '2026-01' },
      { type: 'Flexibility', duration: 40, calories: 130, month: '2026-01' },
      { type: 'Pilates', duration: 60, calories: 222, month: '2026-01' },
    ],
    '2026-02': [
      { type: 'Pilates', duration: 50, calories: 198, month: '2026-02' },
      { type: 'Barre', duration: 55, calories: 232, month: '2026-02' },
      { type: 'Core Training', duration: 40, calories: 168, month: '2026-02' },
      { type: 'Flexibility', duration: 45, calories: 140, month: '2026-02' },
      { type: 'Pilates', duration: 60, calories: 225, month: '2026-02' },
      { type: 'Barre', duration: 60, calories: 252, month: '2026-02' },
      { type: 'Pilates', duration: 45, calories: 185, month: '2026-02' },
      { type: 'Core Training', duration: 35, calories: 162, month: '2026-02' },
      { type: 'Pilates', duration: 55, calories: 210, month: '2026-02' },
      { type: 'Flexibility', duration: 30, calories: 108, month: '2026-02' },
      { type: 'Barre', duration: 50, calories: 215, month: '2026-02' },
      { type: 'Pilates', duration: 60, calories: 228, month: '2026-02' },
      { type: 'Core Training', duration: 45, calories: 185, month: '2026-02' },
    ],
    '2026-03': [
      { type: 'Pilates', duration: 55, calories: 212, month: '2026-03' },
      { type: 'Barre', duration: 60, calories: 250, month: '2026-03' },
      { type: 'Core Training', duration: 45, calories: 185, month: '2026-03' },
      { type: 'Flexibility', duration: 50, calories: 148, month: '2026-03' },
      { type: 'Pilates', duration: 50, calories: 195, month: '2026-03' },
      { type: 'Barre', duration: 55, calories: 230, month: '2026-03' },
      { type: 'Pilates', duration: 60, calories: 222, month: '2026-03' },
      { type: 'Flexibility', duration: 40, calories: 130, month: '2026-03' },
      { type: 'Core Training', duration: 40, calories: 172, month: '2026-03' },
      { type: 'Pilates', duration: 45, calories: 180, month: '2026-03' },
      { type: 'Barre', duration: 50, calories: 218, month: '2026-03' },
    ],
  }

  const allRaw: RawSession[] = months.flatMap((m) => rawByMonth[m] ?? [])
  const totalSessions = allRaw.length
  const totalMinutes = allRaw.reduce((s, r) => s + r.duration, 0)
  const avgDuration = Math.round(totalMinutes / totalSessions)
  const avgCalories = Math.round(allRaw.reduce((s, r) => s + r.calories, 0) / totalSessions)
  const totalWeeks = 26 // ~6 months
  const sessionsPerWeek = +(totalSessions / totalWeeks).toFixed(1)

  // Monthly stacked bar data
  const monthly: MonthlyBucket[] = months.map((m) => {
    const bucket = rawByMonth[m] ?? []
    return {
      month: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      Pilates: bucket.filter((r) => r.type === 'Pilates').length,
      Barre: bucket.filter((r) => r.type === 'Barre').length,
      Flexibility: bucket.filter((r) => r.type === 'Flexibility').length,
      'Core Training': bucket.filter((r) => r.type === 'Core Training').length,
    }
  })

  // Session type breakdown
  const typeCounts: Record<SessionType, number> = {
    Pilates: 0,
    Barre: 0,
    Flexibility: 0,
    'Core Training': 0,
  }
  allRaw.forEach((r) => { typeCounts[r.type]++ })

  // Duration distribution
  const dur = { lt30: 0, d30to45: 0, d45to60: 0, gt60: 0 }
  allRaw.forEach(({ duration }) => {
    if (duration < 30) dur.lt30++
    else if (duration <= 45) dur.d30to45++
    else if (duration <= 60) dur.d45to60++
    else dur.gt60++
  })

  // Flatten all sessions for display
  let dayOffset = 0
  const today = new Date('2026-03-19')
  const sessions: Session[] = [...allRaw].reverse().map((r, i) => {
    dayOffset += Math.floor(Math.random() * 2) + 1
    const d = new Date(today)
    d.setDate(today.getDate() - dayOffset)
    return {
      id: String(i),
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      type: r.type,
      duration: r.duration,
      calories: r.calories,
    }
  })

  return {
    totalSessions,
    avgDuration,
    avgCalories,
    sessionsPerWeek,
    monthly,
    typeCounts,
    durationDist: dur,
    sessions: sessions.slice(0, 20),
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PilatesPage() {
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
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Pilates &amp; Barre</h1>
            <p className="text-sm text-text-secondary">6-month analysis · 4 modalities</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <PilatesClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
