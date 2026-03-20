import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { HRVRecommenderClient } from './recommender-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'HRV Session Recommender' }

export default async function HRVRecommenderPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const since = thirtyDaysAgo.toISOString().slice(0, 10)

  const { data: rows } = await supabase
    .from('daily_summaries')
    .select('date, avg_hrv')
    .eq('user_id', user.id)
    .gte('date', since)
    .not('avg_hrv', 'is', null)
    .gt('avg_hrv', 0)
    .order('date', { ascending: true })

  const summaries = (rows ?? []) as { date: string; avg_hrv: number }[]

  // Compute 30-day rolling baseline (mean of all available days)
  const hrvValues = summaries.map((r) => r.avg_hrv)
  const baseline =
    hrvValues.length > 0
      ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length
      : null

  const todayHrv = summaries.length > 0 ? summaries[summaries.length - 1].avg_hrv : null
  const todayDate = summaries.length > 0 ? summaries[summaries.length - 1].date : null

  const ratio = baseline && todayHrv ? todayHrv / baseline : null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/hrv"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to HRV"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Session Recommender</h1>
            <p className="text-sm text-text-secondary">
              HRV-guided training · 30-day baseline
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HRVRecommenderClient
          summaries={summaries}
          todayHrv={todayHrv}
          todayDate={todayDate}
          baseline={baseline ? Math.round(baseline * 10) / 10 : null}
          ratio={ratio}
        />
      </main>
      <BottomNav />
    </div>
  )
}
