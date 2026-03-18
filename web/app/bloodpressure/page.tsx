import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BloodPressureClient } from './bloodpressure-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Blood Pressure' }

export default async function BloodPressurePage() {
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
    .in('type', ['blood_pressure_systolic', 'blood_pressure_diastolic'])
    .gte('start_time', startIso)
    .gt('value', 0)
    .order('start_time', { ascending: true })

  // Pair systolic/diastolic by timestamp proximity (within 90 seconds)
  const systolicRaw = (records ?? []).filter((r) => r.type === 'blood_pressure_systolic' && r.value > 60 && r.value < 250)
  const diastolicRaw = (records ?? []).filter((r) => r.type === 'blood_pressure_diastolic' && r.value > 30 && r.value < 150)

  const readings = systolicRaw.flatMap((s) => {
    const match = diastolicRaw.find(
      (d) => Math.abs(new Date(s.start_time).getTime() - new Date(d.start_time).getTime()) < 90000
    )
    if (!match) return []
    return [{
      timestamp: s.start_time,
      systolic: Math.round(s.value),
      diastolic: Math.round(match.value),
      pulse: Math.round(s.value) - Math.round(match.value),
      hour: new Date(s.start_time).getHours(),
    }]
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/vitals"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to vitals"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Blood Pressure</h1>
            <p className="text-sm text-text-secondary">Last 90 days · {readings.length} readings</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <BloodPressureClient readings={readings} />
      </main>
      <BottomNav />
    </div>
  )
}
