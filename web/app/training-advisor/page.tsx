import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Brain } from 'lucide-react'
import { TrainingAdvisorClient } from './training-advisor-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Training Advisor' }

export interface AdvisorDay {
  date: string
  hrv: number | null
  sleepHours: number | null
}

export default async function TrainingAdvisorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyFiveDaysAgo = new Date()
  thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35)

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, avg_hrv, sleep_duration_minutes')
    .eq('user_id', user.id)
    .gte('date', thirtyFiveDaysAgo.toISOString().slice(0, 10))
    .order('date', { ascending: true })

  const days: AdvisorDay[] = (summaries ?? []).map((s) => ({
    date: s.date,
    hrv: s.avg_hrv ?? null,
    sleepHours: s.sleep_duration_minutes ? s.sleep_duration_minutes / 60 : null,
  }))

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
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Training Advisor</h1>
              <p className="text-sm text-text-secondary">HRV-guided weekly training plan</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <TrainingAdvisorClient days={days} />
      </main>
      <BottomNav />
    </div>
  )
}
