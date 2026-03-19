import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { WellnessInsightsClient } from './wellness-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Wellness Insights' }

export default async function WellnessInsightsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startDate = ninetyDaysAgo.toISOString().slice(0, 10)

  const [{ data: checkins }, { data: summaries }] = await Promise.all([
    supabase
      .from('daily_checkins')
      .select('date, energy, mood, stress, notes')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .order('date', { ascending: true }),
    supabase
      .from('daily_summaries')
      .select('date, steps, avg_hrv, resting_heart_rate, sleep_duration_minutes, active_calories')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .order('date', { ascending: true }),
  ])

  // Join checkin and summary data by date
  const summaryMap = new Map((summaries ?? []).map((s) => [s.date, s]))

  const joined = (checkins ?? [])
    .map((c) => {
      const s = summaryMap.get(c.date)
      return {
        date: c.date,
        energy: c.energy,
        mood: c.mood,
        stress: c.stress,
        notes: c.notes,
        hrv: s?.avg_hrv ?? null,
        rhr: s?.resting_heart_rate ?? null,
        sleep: s?.sleep_duration_minutes ?? null,
        steps: s?.steps ?? null,
        calories: s?.active_calories ?? null,
      }
    })
    .filter((r) => r.energy !== null || r.mood !== null || r.stress !== null)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/checkin"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to check-in"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Wellness Insights</h1>
            <p className="text-sm text-text-secondary">
              {joined.length > 0 ? `${joined.length} days analyzed` : 'Mood & energy correlations'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <WellnessInsightsClient records={joined} />
      </main>
      <BottomNav />
    </div>
  )
}
