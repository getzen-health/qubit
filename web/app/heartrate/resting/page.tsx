import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart, BarChart2 } from 'lucide-react'
import { RHRClient } from './rhr-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Resting Heart Rate' }

export default async function RHRPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneEightyDaysAgo = new Date()
  oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180)

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, resting_heart_rate, avg_hrv, steps, active_calories, sleep_duration_minutes')
    .eq('user_id', user.id)
    .gte('date', oneEightyDaysAgo.toISOString().slice(0, 10))
    .not('resting_heart_rate', 'is', null)
    .gt('resting_heart_rate', 0)
    .order('date', { ascending: true })

  const rows = (summaries ?? []).filter((s) => s.resting_heart_rate && s.resting_heart_rate > 30)

  // 7-day rolling average
  const withRolling = rows.map((row, i) => {
    const slice = rows.slice(Math.max(0, i - 6), i + 1)
    const rolling = Math.round(slice.reduce((s, r) => s + r.resting_heart_rate!, 0) / slice.length)
    return { ...row, rolling }
  })

  // 28-day trend (slope in bpm/day)
  const recent28 = rows.slice(-28)
  let trendSlope: number | null = null
  if (recent28.length >= 7) {
    const xs = recent28.map((_, i) => i)
    const ys = recent28.map((r) => r.resting_heart_rate!)
    const xMean = xs.reduce((a, b) => a + b, 0) / xs.length
    const yMean = ys.reduce((a, b) => a + b, 0) / ys.length
    const num = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0)
    const den = xs.reduce((s, x) => s + (x - xMean) ** 2, 0)
    trendSlope = den > 0 ? num / den : null
  }

  // Day-of-week averages (0=Sun)
  const byDow: (number | null)[] = Array(7).fill(null)
  const dowBuckets = Array.from({ length: 7 }, () => [] as number[])
  for (const r of rows) {
    const dow = new Date(r.date + 'T12:00:00').getDay()
    dowBuckets[dow].push(r.resting_heart_rate!)
  }
  for (let d = 0; d < 7; d++) {
    byDow[d] = dowBuckets[d].length > 0
      ? Math.round(dowBuckets[d].reduce((a, b) => a + b, 0) / dowBuckets[d].length)
      : null
  }

  // Stats
  const rhrs = rows.map((r) => r.resting_heart_rate!)
  const minRhr = rhrs.length ? Math.min(...rhrs) : null
  const maxRhr = rhrs.length ? Math.max(...rhrs) : null
  const avgRhr = rhrs.length ? Math.round(rhrs.reduce((a, b) => a + b, 0) / rhrs.length) : null
  const latestRhr = rhrs.length ? rhrs[rhrs.length - 1] : null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/heartrate"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to heart rate"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Heart className="w-5 h-5 text-red-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Resting Heart Rate</h1>
              <p className="text-sm text-text-secondary">
                {rows.length > 0 ? `${rows.length} days · 6-month trend` : 'RHR trends & analysis'}
              </p>
            </div>
          </div>
          <Link
            href="/heartrate/resting/patterns"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="RHR patterns"
            title="RHR Patterns"
          >
            <BarChart2 className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <RHRClient
          rows={withRolling}
          latestRhr={latestRhr}
          minRhr={minRhr}
          maxRhr={maxRhr}
          avgRhr={avgRhr}
          trendSlope={trendSlope}
          byDow={byDow}
        />
      </main>
      <BottomNav />
    </div>
  )
}
