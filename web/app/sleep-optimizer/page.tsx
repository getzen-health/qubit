import { createClient } from '@/lib/supabase/server'
import { SleepOptimizerClient } from './sleep-optimizer-client'
import { BottomNav } from '@/components/bottom-nav'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Sleep Optimizer | KQuarks',
  description:
    'Chronotype assessment, sleep debt calculator, caffeine model, and personalised sleep schedule — evidence-based sleep optimisation.',
}

export default async function SleepOptimizerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let settings = null
  let sleepLogs: { date: string; durationH: number; quality: number | null }[] = []

  if (user) {
    const { data: s } = await supabase
      .from('sleep_optimizer_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    settings = s ?? null

    const since = new Date()
    since.setDate(since.getDate() - 14)

    const { data: records } = await supabase
      .from('sleep_records')
      .select('start_time, duration_minutes, quality')
      .eq('user_id', user.id)
      .gte('start_time', since.toISOString())
      .order('start_time', { ascending: true })

    sleepLogs = (records ?? []).map((r) => ({
      date: r.start_time ? r.start_time.split('T')[0] : '',
      durationH: r.duration_minutes ? Math.round((r.duration_minutes / 60) * 10) / 10 : 0,
      quality: r.quality ?? null,
    }))
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-1.5 rounded-xl hover:bg-surface-secondary transition-colors"
          aria-label="Back to dashboard"
        >
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="text-base font-semibold text-text-primary">Sleep Optimizer</h1>
          <p className="text-xs text-text-secondary">Chronotype · Schedule · Debt · Caffeine</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4">
        <SleepOptimizerClient
          initialSettings={settings}
          initialSleepLogs={sleepLogs}
          isAuthenticated={!!user}
        />
      </main>

      <BottomNav />
    </div>
  )
}
