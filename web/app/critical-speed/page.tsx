import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CriticalSpeedClient } from './critical-speed-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Critical Speed' }

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RunRecord {
  id: string
  date: string        // ISO date string
  distance_km: number
  duration_min: number
  speed_kmh: number   // distance_km / (duration_min / 60)
}

export interface WeeklySpeedPoint {
  week: string        // "Mon DD" label
  avg_speed: number   // km/h
}

export interface CriticalSpeedData {
  cs_kmh: number            // Critical Speed in km/h
  cs_pace: string           // "4:48/km"
  d_prime_m: number         // D' in metres
  r_squared: number         // goodness of fit
  runs_analyzed: number
  runs: RunRecord[]
  weekly_speed: WeeklySpeedPoint[]
}

// ─── Deterministic pseudo-random helper ──────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ─── Mock data ───────────────────────────────────────────────────────────────

function buildMockData(): CriticalSpeedData {
  const rand = seededRandom(42)

  // CS model parameters
  const CS_MS = 3.47          // m/s  (12.5 km/h)
  const D_PRIME = 280         // metres

  // 34 runs spread over ~6 months (ending today: 2026-03-19)
  const END_DATE = new Date('2026-03-19')
  const START_DATE = new Date('2025-09-20')
  const SPAN_MS = END_DATE.getTime() - START_DATE.getTime()

  // Target distances (km) — realistic training variety
  const TARGET_DISTANCES_KM = [
    3, 3, 4, 4, 5, 5, 5, 6, 6, 7,
    7, 8, 8, 8, 10, 10, 10, 10, 12, 12,
    14, 14, 15, 15, 16, 17, 18, 20, 20, 21,
    21, 22, 24, 25,
  ]

  const runs: RunRecord[] = TARGET_DISTANCES_KM.map((distKm, i) => {
    // Spread dates semi-evenly with some clustering
    const t = (i / (TARGET_DISTANCES_KM.length - 1)) * SPAN_MS
    const jitter = (rand() - 0.5) * 3 * 24 * 60 * 60 * 1000 // ±1.5 days
    const date = new Date(START_DATE.getTime() + t + jitter)

    // CS model: t = D / (v - CS) → rearranged: duration = D_PRIME/(v - CS) + D/CS
    // Pick a speed slightly above CS with realistic noise
    // For shorter runs, runner can sustain higher speed (above CS)
    // For longer runs, speed approaches CS
    const distM = distKm * 1000
    // Effective speed: for short runs higher margin above CS
    const marginFactor = Math.max(0.1, 1.2 - distKm * 0.04) // decreases with distance
    const margin_ms = marginFactor * (0.5 + rand() * 0.4)    // 0.1–0.9 m/s above CS
    const speed_ms = CS_MS + margin_ms

    // Duration from CS model + noise
    const durModel_s = D_PRIME / (speed_ms - CS_MS) + distM / speed_ms
    const noise = 1 + (rand() - 0.5) * 0.04 // ±2% timing noise
    const dur_min = (durModel_s * noise) / 60

    return {
      id: `run-${i}`,
      date: date.toISOString(),
      distance_km: distKm,
      duration_min: Math.round(dur_min * 10) / 10,
      speed_kmh: Math.round((distKm / (dur_min / 60)) * 100) / 100,
    }
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // ── Weekly average speed (12 weeks back from 2026-03-19) ──────────────────
  const weekly_speed: WeeklySpeedPoint[] = []
  for (let w = 11; w >= 0; w--) {
    const weekStart = new Date(END_DATE)
    weekStart.setDate(weekStart.getDate() - w * 7 - weekStart.getDay())

    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    // Pick runs in this week window
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const weekRuns = runs.filter((r) => {
      const d = new Date(r.date)
      return d >= weekStart && d < weekEnd
    })

    // If no runs in week, interpolate a realistic base speed + gentle trend
    const baseSpeed = 12.1 + (11 - w) * 0.03 + (rand() - 0.5) * 0.4
    const avg = weekRuns.length > 0
      ? weekRuns.reduce((s, r) => s + r.speed_kmh, 0) / weekRuns.length
      : Math.round(baseSpeed * 100) / 100

    weekly_speed.push({
      week: label,
      avg_speed: Math.round(avg * 100) / 100,
    })
  }

  return {
    cs_kmh: 12.5,
    cs_pace: '4:48/km',
    d_prime_m: 280,
    r_squared: 0.94,
    runs_analyzed: 34,
    runs,
    weekly_speed,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CriticalSpeedPage() {
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
            href="/running"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to running"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Critical Speed</h1>
            <p className="text-sm text-text-secondary">
              Aerobic–anaerobic threshold · {data.runs_analyzed} runs
            </p>
          </div>
          <span className="text-2xl">⚡</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <CriticalSpeedClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
