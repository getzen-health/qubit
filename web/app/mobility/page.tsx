import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MobilityClient } from './mobility-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Mobility' }

export default async function MobilityPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()

  const { data: records } = await supabase
    .from('health_records')
    .select('type, value, start_time')
    .eq('user_id', user.id)
    .in('type', ['walking_speed', 'walking_step_length', 'walking_asymmetry', 'walking_double_support'])
    .gte('start_time', startIso)
    .order('start_time', { ascending: true })

  // Aggregate to weekly average per metric
  function weeklyAvg(type: string): { week: string; value: number }[] {
    const filtered = (records ?? []).filter((r) => r.type === type)
    const byWeek = new Map<string, { sum: number; count: number }>()
    for (const r of filtered) {
      const d = new Date(r.start_time)
      // ISO week start (Monday)
      const day = d.getDay()
      const diff = (day === 0 ? -6 : 1) - day
      const monday = new Date(d)
      monday.setDate(d.getDate() + diff)
      const week = monday.toISOString().slice(0, 10)
      const existing = byWeek.get(week)
      if (existing) {
        existing.sum += r.value
        existing.count += 1
      } else {
        byWeek.set(week, { sum: r.value, count: 1 })
      }
    }
    return Array.from(byWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, { sum, count }]) => ({ week, value: +(sum / count).toFixed(3) }))
  }

  const speedData = weeklyAvg('walking_speed')
  const stepLengthData = weeklyAvg('walking_step_length')
  const asymmetryData = weeklyAvg('walking_asymmetry')
  const doubleSupportData = weeklyAvg('walking_double_support')

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
            <h1 className="text-xl font-bold text-text-primary">Mobility</h1>
            <p className="text-sm text-text-secondary">Walking health metrics</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <MobilityClient
          speedData={speedData}
          stepLengthData={stepLengthData}
          asymmetryData={asymmetryData}
          doubleSupportData={doubleSupportData}
        />
      </main>
      <BottomNav />
    </div>
  )
}
