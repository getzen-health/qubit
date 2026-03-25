import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { BiologicalAgeClient } from './biological-age-client'

export const metadata = { title: 'Wellness Age' }

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export default async function BiologicalAgePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDayCutoff = thirtyDaysAgo.toISOString().slice(0, 10)

  const { data: allSummaries } = await supabase
    .from('daily_summaries')
    .select('date, avg_hrv, resting_heart_rate, sleep_duration_minutes')
    .eq('user_id', user.id)
    .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))
    .order('date', { ascending: false })

  const summaries = allSummaries ?? []

  // No date_of_birth in schema — default to 30
  const chronologicalAge = 30

  const hrvValues = summaries
    .map((s) => s.avg_hrv)
    .filter((v): v is number => v != null && v > 0)
  const rhrValues = summaries
    .map((s) => s.resting_heart_rate)
    .filter((v): v is number => v != null && v > 0)
  const sleepValues = summaries
    .map((s) => s.sleep_duration_minutes)
    .filter((v): v is number => v != null && v > 0)

  const hrvBaseline = computeMedian(hrvValues)
  const rhrBaseline = computeMedian(rhrValues)
  const sleepBaseline = computeMedian(sleepValues) / 60

  const latestHrv =
    summaries.find((s) => s.avg_hrv != null && s.avg_hrv > 0)?.avg_hrv ?? null
  const latestRhr =
    summaries.find((s) => s.resting_heart_rate != null && s.resting_heart_rate > 0)
      ?.resting_heart_rate ?? null
  const latestSleepMins =
    summaries.find((s) => s.sleep_duration_minutes != null && s.sleep_duration_minutes > 0)
      ?.sleep_duration_minutes ?? null
  const latestSleep = latestSleepMins != null ? latestSleepMins / 60 : null

  const hasData = latestHrv !== null || latestRhr !== null || latestSleep !== null

  const recentSummaries = summaries
    .filter((s) => s.date >= thirtyDayCutoff)
    .map((s) => ({
      date: s.date,
      avg_hrv: s.avg_hrv ?? null,
      resting_heart_rate: s.resting_heart_rate ?? null,
      sleep_duration_minutes: s.sleep_duration_minutes ?? null,
    }))

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Wellness Age</h1>
            <p className="text-sm text-text-secondary">Wearable Biomarker Assessment</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <BiologicalAgeClient
          chronologicalAge={chronologicalAge}
          hrvBaseline={hrvBaseline}
          rhrBaseline={rhrBaseline}
          sleepBaseline={sleepBaseline}
          latestHrv={latestHrv}
          latestRhr={latestRhr}
          latestSleep={latestSleep}
          recentSummaries={recentSummaries}
          hasData={hasData}
        />
      </main>
      <BottomNav />
    </div>
  )
}
