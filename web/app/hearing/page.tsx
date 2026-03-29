import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const HearingClient = dynamic(() => import('./hearing-client').then(m => ({ default: m.HearingClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Hearing Health' }

export default async function HearingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: records } = await supabase
    .from('health_records')
    .select('start_time, end_time, type, value')
    .eq('user_id', user.id)
    .in('type', ['headphone_audio_exposure', 'environmental_audio_exposure'])
    .gte('start_time', thirtyDaysAgo.toISOString())
    .order('start_time', { ascending: true })

  // Aggregate to one reading per day per type
  const headphoneByDay = new Map<string, { date: string; value: number; count: number }>()
  const environmentalByDay = new Map<string, { date: string; value: number; count: number }>()

  for (const r of records ?? []) {
    const day = r.start_time.slice(0, 10)
    const map = r.type === 'headphone_audio_exposure' ? headphoneByDay : environmentalByDay
    const existing = map.get(day)
    if (existing) {
      existing.value += r.value
      existing.count += 1
    } else {
      map.set(day, { date: day, value: r.value, count: 1 })
    }
  }

  const headphoneReadings = Array.from(headphoneByDay.values()).map((r) => ({
    date: r.date,
    value: r.value / r.count,
  }))
  const environmentalReadings = Array.from(environmentalByDay.values()).map((r) => ({
    date: r.date,
    value: r.value / r.count,
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
          <div>
            <h1 className="text-xl font-bold text-text-primary">Hearing Health</h1>
            <p className="text-sm text-text-secondary">Last 30 days</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HearingClient
          headphoneReadings={headphoneReadings}
          environmentalReadings={environmentalReadings}
        />
      </main>
      <BottomNav />
    </div>
  )
}
