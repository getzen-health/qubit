import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Flame } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
const ActiveEnergyClient = dynamic(() => import('./active-energy-client').then(m => ({ default: m.ActiveEnergyClient })))
import type { DayRecord } from './active-energy-client'

export const metadata = { title: 'Active Energy' }

// ─── Mock data (30 days ending today) ────────────────────────────────────────
// Realistic Apple Health Move ring data:
//   - 30 days, averaging ~480 kcal/day with natural variation (300–750 range)
//   - Higher on weekends, lower on Mondays
//   - 22 days meeting the 500 kcal goal

function buildMockDays(): DayRecord[] {
  // Anchor to the page's "today" (2026-03-19)
  const today = new Date()

  // Pre-defined realistic values: index 0 = 29 days ago, index 29 = today
  const rawKcal = [
    342, // Mon -29 — post-weekend dip
    524,
    611,
    570,
    498,
    703, // Sat
    688, // Sun
    318, // Mon
    541,
    587,
    620,
    502,
    741, // Sat
    714, // Sun
    305, // Mon
    488,
    553,
    596,
    510,
    682, // Sat
    665, // Sun
    381, // Mon
    519,
    544,
    607,
    531,
    728, // Sat
    695, // Sun
    412, // Mon
    487, // Today (Tue) — 487 kcal, slightly under goal
  ]

  return rawKcal.map((kcal, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (29 - i))
    return { date: d.toISOString().slice(0, 10), kcal }
  })
}

function computeStreak(days: DayRecord[], goal: number): number {
  // Walk backwards from today
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].kcal >= goal) {
      streak++
    } else {
      break
    }
  }
  return streak
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ActiveEnergyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // In production this would query `daily_summaries` for active_calories.
  // We use deterministic mock data so the page is always richly populated.
  const days = buildMockDays()
  const goal = 500
  const todayKcal = days[days.length - 1].kcal   // 487
  const streak = computeStreak(days, goal)          // today is under goal → streak resets to 0

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Active Energy</h1>
            <p className="text-sm text-text-secondary">Move ring · Apple Health</p>
          </div>
          <Flame className="w-5 h-5 text-red-400" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <ActiveEnergyClient
          days={days}
          todayKcal={todayKcal}
          goalKcal={goal}
          streak={streak}
        />
      </main>

      <BottomNav />
    </div>
  )
}
