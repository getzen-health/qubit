import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const RunningStreaksClient = dynamic(() => import('./running-streaks-client').then(m => ({ default: m.RunningStreaksClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Running Streaks' }

// ── Mock data (90-day window ending today: 2026-03-19) ────────────────────────
// ~64% run rate over 90 days = 58 run days. Current streak 14, longest 31.
// Distances vary: most runs 5–15 km, some short 2–4 km, occasional long 18–25 km.

function buildMockData() {
  // Anchor: today = 2026-03-19
  const TODAY = new Date()

  // Seed for deterministic-looking mock data
  // Pattern: run on most days with realistic gaps (rest days, travel)
  // We'll hand-craft a realistic 90-day pattern:
  // Days from 0 (today) to 89 (oldest). 1 = run, 0 = rest.
  const runPattern: (0 | 1)[] = [
    1, 1, 0, 1, 1, 1, 1, 0, 1, 1, // days 0-9   (streak: 14 with next block)
    1, 1, 1, 1, 0, 1, 1, 0, 1, 1, // days 10-19
    1, 0, 1, 1, 1, 0, 1, 0, 1, 1, // days 20-29
    1, 0, 0, 1, 1, 1, 1, 1, 1, 1, // days 30-39
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // days 40-49 (longest streak 31 sits here)
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // days 50-59
    1, 0, 0, 1, 0, 1, 1, 0, 1, 0, // days 60-69
    1, 1, 0, 1, 0, 0, 1, 1, 0, 1, // days 70-79
    0, 1, 1, 0, 0, 1, 0, 1, 0, 1, // days 80-89
  ]

  // Distances (km) for each run day, cycled pseudo-randomly
  const distancePool = [
    6.2, 10.5, 8.0, 12.3, 5.1, 15.0, 7.8, 9.4, 21.1, 6.5,
    11.2, 4.8, 13.7, 8.3, 18.5, 6.0, 10.0, 7.2, 5.5, 14.1,
    9.0, 22.3, 6.8, 11.5, 8.7, 16.0, 5.3, 12.0, 7.5, 4.5,
  ]

  const grid: { date: string; distanceKm: number | null }[] = []
  let distIdx = 0

  for (let i = 89; i >= 0; i--) {
    const d = new Date(TODAY)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const ran = runPattern[i] === 1
    grid.push({
      date: dateStr,
      distanceKm: ran ? distancePool[distIdx % distancePool.length] : null,
    })
    if (ran) distIdx++
  }

  return grid
}

const mockGrid = buildMockData()

// Weekly frequency: group grid into 13 calendar weeks (Mon–Sun)
function buildWeeklyFrequency(grid: { date: string; distanceKm: number | null }[]) {
  const weeks: { week: string; runDays: number }[] = []
  // Chunk the 91-day grid into 13 weeks of 7 days each (oldest first)
  for (let w = 0; w < 13; w++) {
    const slice = grid.slice(w * 7, w * 7 + 7)
    const runDays = slice.filter((d) => d.distanceKm !== null).length
    const startDate = new Date(slice[0].date)
    const label = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    weeks.push({ week: label, runDays })
  }
  return weeks
}

const weeklyFrequency = buildWeeklyFrequency(mockGrid)

export default async function RunningStreaksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const totalRunDays = mockGrid.filter((d) => d.distanceKm !== null).length // 58
  const runRate = Math.round((totalRunDays / 90) * 100) // 64
  const avgRunsPerWeek = Math.round((totalRunDays / 13) * 10) / 10 // ~4.5

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/running"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to running"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Running Streaks</h1>
            <p className="text-sm text-text-secondary">
              {totalRunDays} run days · last 90 days
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <RunningStreaksClient
          grid={mockGrid}
          weeklyFrequency={weeklyFrequency}
          currentStreak={14}
          longestStreak={31}
          totalRunDays={totalRunDays}
          runRate={runRate}
          avgRunsPerWeek={avgRunsPerWeek}
        />
      </main>
      <BottomNav />
    </div>
  )
}
