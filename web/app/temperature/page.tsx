import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'
const TemperatureClient = dynamic(() => import('./temperature-client').then(m => ({ default: m.TemperatureClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Wrist Temperature' }

export default async function TemperaturePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: records } = await supabase
    .from('health_records')
    .select('start_time, value')
    .eq('user_id', user.id)
    .eq('type', 'wrist_temperature')
    .gte('start_time', ninetyDaysAgo.toISOString())
    .order('start_time', { ascending: true })

  // Deduplicate to one reading per night (keep the earliest of each day)
  const byDay = new Map<string, { date: string; value: number }>()
  for (const r of records ?? []) {
    const day = r.start_time.slice(0, 10)
    if (!byDay.has(day)) {
      byDay.set(day, { date: r.start_time, value: r.value })
    }
  }
  const readings = Array.from(byDay.values())

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
            <h1 className="text-xl font-bold text-text-primary">Wrist Temperature</h1>
            <p className="text-sm text-text-secondary">Nightly temperature during sleep</p>
          </div>
          <Link
            href="/temperature/insights"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Temperature insights"
          >
            <TrendingUp className="w-5 h-5 text-text-secondary" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <TemperatureClient readings={readings} />
      </main>
      <BottomNav />
    </div>
  )
}
