import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart } from 'lucide-react'
import { RestingHRDeepDiveClient } from './resting-hr-deep-dive-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Resting HR Deep Dive' }

// ─── AHA fitness classification (used in server to colour bars) ───────────────
function ahaClass(rhr: number): { label: string; color: string } {
  if (rhr < 50) return { label: 'Athletic', color: '#3b82f6' }
  if (rhr < 60) return { label: 'Excellent', color: '#22c55e' }
  if (rhr < 68) return { label: 'Good', color: '#14b8a6' }
  if (rhr < 76) return { label: 'Average', color: '#eab308' }
  if (rhr < 85) return { label: 'Below Average', color: '#f97316' }
  return { label: 'Poor', color: '#ef4444' }
}

// ─── Generate 365 days of realistic mock RHR data ─────────────────────────────
function generateMockData() {
  const today = new Date()
  const points: { date: string; rhr: number }[] = []

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dow = d.getDay() // 0=Sun

    // Base ~57 bpm
    let base = 57

    // Seasonal: summer (Jun–Aug) slightly higher fatigue, winter lower
    const month = d.getMonth() // 0-based
    if (month >= 5 && month <= 7) base += 2.5   // summer
    if (month >= 11 || month <= 1) base -= 1.5  // winter

    // Weekly pattern: Mon high (post-weekend), Wed–Thu low, Sat moderate
    const dowOffset = [1.5, 2.5, 0.5, -1.5, -2, 0.5, 1][dow]
    base += dowOffset

    // Gradual improvement arc over the year (fitness improving ~5 bpm)
    base -= (364 - i) / 364 * 5

    // Random noise ±3 bpm
    const noise = (Math.random() - 0.5) * 6

    const rhr = Math.round(Math.max(44, Math.min(80, base + noise)))
    points.push({ date: dateStr, rhr })
  }

  return points
}

// ─── 14-day rolling average ───────────────────────────────────────────────────
function withRolling(points: { date: string; rhr: number }[]) {
  return points.map((p, i) => {
    const window = points.slice(Math.max(0, i - 13), i + 1)
    const avg = Math.round(window.reduce((s, x) => s + x.rhr, 0) / window.length)
    return { ...p, rolling: avg }
  })
}

export default async function RestingHRDeepDivePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Mock data (no real DB query for this page)
  const raw = generateMockData()
  const trendData = withRolling(raw)

  // Summary stats
  const allRhr = raw.map((p) => p.rhr)
  const latestRhr = 54
  const avg90 = 57
  const lowest12mo = Math.min(...allRhr)
  const highest12mo = Math.max(...allRhr)
  const trend30 = -3

  // Monthly averages (12 months)
  const monthMap = new Map<string, number[]>()
  for (const p of raw) {
    const key = p.date.slice(0, 7)
    if (!monthMap.has(key)) monthMap.set(key, [])
    monthMap.get(key)!.push(p.rhr)
  }
  const monthlyData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => {
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
      const monthNum = parseInt(key.slice(5, 7)) - 1
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return {
        month: monthNames[monthNum],
        avg,
        color: ahaClass(avg).color,
        classLabel: ahaClass(avg).label,
      }
    })

  // Day-of-week averages (Mon=1 … Sun=0)
  const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0]
  const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dowBuckets: number[][] = Array.from({ length: 7 }, () => [])
  for (const p of raw) {
    const dow = new Date(p.date + 'T12:00:00').getDay()
    dowBuckets[dow].push(p.rhr)
  }
  const dowData = DOW_ORDER.map((dow, idx) => ({
    label: DOW_LABELS[idx],
    avg: Math.round(dowBuckets[dow].reduce((a, b) => a + b, 0) / (dowBuckets[dow].length || 1)),
  }))

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/heartrate/resting"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to Resting Heart Rate"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Heart className="w-5 h-5 text-red-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">RHR Deep Dive</h1>
              <p className="text-sm text-text-secondary">12-month analysis · AHA classification</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <RestingHRDeepDiveClient
          trendData={trendData}
          monthlyData={monthlyData}
          dowData={dowData}
          latestRhr={latestRhr}
          avg90={avg90}
          lowest12mo={lowest12mo}
          highest12mo={highest12mo}
          trend30={trend30}
        />
      </main>
      <BottomNav />
    </div>
  )
}
