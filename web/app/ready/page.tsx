import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ReadyClient, type ReadinessData, type DailyScore } from './ready-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Daily Readiness Score' }

// ─── Mock data ────────────────────────────────────────────────────────────────

function buildMockData(): ReadinessData {
  // 30-day daily readiness scores ending 2026-03-19
  // Mostly 60-80, some dips to 40s, occasional 85+
  const rawScores: Array<{ offset: number; score: number; hrv: number; rhr: number; sleep: number }> = [
    { offset: 29, score: 72, hrv: 48, rhr: 56, sleep: 7.2 },
    { offset: 28, score: 68, hrv: 44, rhr: 58, sleep: 6.8 },
    { offset: 27, score: 75, hrv: 52, rhr: 55, sleep: 7.5 },
    { offset: 26, score: 63, hrv: 41, rhr: 60, sleep: 6.5 },
    { offset: 25, score: 44, hrv: 33, rhr: 64, sleep: 5.9 },
    { offset: 24, score: 41, hrv: 30, rhr: 66, sleep: 5.5 },
    { offset: 23, score: 48, hrv: 36, rhr: 63, sleep: 6.1 },
    { offset: 22, score: 67, hrv: 46, rhr: 57, sleep: 7.0 },
    { offset: 21, score: 74, hrv: 50, rhr: 55, sleep: 7.4 },
    { offset: 20, score: 79, hrv: 55, rhr: 54, sleep: 7.8 },
    { offset: 19, score: 86, hrv: 62, rhr: 52, sleep: 8.1 },
    { offset: 18, score: 81, hrv: 58, rhr: 53, sleep: 7.9 },
    { offset: 17, score: 76, hrv: 51, rhr: 55, sleep: 7.3 },
    { offset: 16, score: 69, hrv: 45, rhr: 57, sleep: 6.9 },
    { offset: 15, score: 62, hrv: 42, rhr: 59, sleep: 6.6 },
    { offset: 14, score: 43, hrv: 31, rhr: 65, sleep: 5.7 },
    { offset: 13, score: 46, hrv: 34, rhr: 64, sleep: 5.8 },
    { offset: 12, score: 58, hrv: 40, rhr: 61, sleep: 6.3 },
    { offset: 11, score: 66, hrv: 44, rhr: 58, sleep: 6.8 },
    { offset: 10, score: 71, hrv: 48, rhr: 56, sleep: 7.1 },
    { offset: 9,  score: 77, hrv: 53, rhr: 54, sleep: 7.6 },
    { offset: 8,  score: 88, hrv: 65, rhr: 51, sleep: 8.3 },
    { offset: 7,  score: 83, hrv: 60, rhr: 52, sleep: 8.0 },
    { offset: 6,  score: 78, hrv: 54, rhr: 54, sleep: 7.7 },
    { offset: 5,  score: 73, hrv: 49, rhr: 56, sleep: 7.2 },
    { offset: 4,  score: 65, hrv: 43, rhr: 59, sleep: 6.7 },
    { offset: 3,  score: 61, hrv: 41, rhr: 60, sleep: 6.4 },
    { offset: 2,  score: 70, hrv: 47, rhr: 57, sleep: 7.0 },
    { offset: 1,  score: 74, hrv: 51, rhr: 55, sleep: 7.4 },
    { offset: 0,  score: 76, hrv: 53, rhr: 55, sleep: 7.5 },
  ]

  const today = new Date('2026-03-19')

  // 30-day HRV baseline average
  const hrvBaseline = Math.round(rawScores.reduce((s, r) => s + r.hrv, 0) / rawScores.length)
  // 30-day RHR baseline average
  const rhrBaseline = Math.round(rawScores.reduce((s, r) => s + r.rhr, 0) / rawScores.length)

  const daily: DailyScore[] = rawScores
    .slice()
    .sort((a, b) => b.offset - a.offset) // descending offset = ascending date
    .map(({ offset, score, hrv, rhr, sleep }) => {
      const d = new Date(today)
      d.setDate(d.getDate() - offset)
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      let zone: 'optimal' | 'good' | 'moderate' | 'low'
      if (score >= 80)      zone = 'optimal'
      else if (score >= 60) zone = 'good'
      else if (score >= 40) zone = 'moderate'
      else                  zone = 'low'
      return { date: label, score, zone, hrv, rhr, sleep }
    })
    .reverse() // oldest → newest for chart left→right

  const todayRaw = rawScores.find((r) => r.offset === 0)!

  // Per-component sub-scores (0-100)
  const todayHrvScore  = Math.round(Math.min(100, (todayRaw.hrv / 70) * 100))
  const todayRhrScore  = Math.round(Math.min(100, Math.max(0, ((80 - todayRaw.rhr) / 35) * 100)))
  const todaySleepScore = Math.round(Math.min(100, (todayRaw.sleep / 9) * 100))

  return {
    todayScore: todayRaw.score,
    todayHrv: todayRaw.hrv,
    todayRhr: todayRaw.rhr,
    todaySleep: todayRaw.sleep,
    todayHrvScore,
    todayRhrScore,
    todaySleepScore,
    hrvBaseline,
    rhrBaseline,
    daily,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReadyPage() {
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
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Daily Readiness Score</h1>
            <p className="text-sm text-text-secondary">
              HRV · Resting HR · Sleep · 30-day trend
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <ReadyClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
