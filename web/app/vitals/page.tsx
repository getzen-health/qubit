import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart, Wind } from 'lucide-react'
import dynamic from 'next/dynamic'
const VitalsClient = dynamic(() => import('./vitals-client').then(m => ({ default: m.VitalsClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Vitals' }

export default async function VitalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const startIso = thirtyDaysAgo.toISOString()

  const { data: records } = await supabase
    .from('health_records')
    .select('type, value, unit, start_time')
    .eq('user_id', user.id)
    .in('type', [
      'oxygen_saturation',
      'respiratory_rate',
      'blood_pressure_systolic',
      'blood_pressure_diastolic',
      'resting_heart_rate',
      'hrv',
      'wrist_temperature',
    ])
    .gte('start_time', startIso)
    .order('start_time', { ascending: true })

  const spO2 = (records ?? [])
    .filter((r) => r.type === 'oxygen_saturation' && r.value > 50)
    .map((r) => ({ time: r.start_time, value: +r.value.toFixed(1) }))

  const respRate = (records ?? [])
    .filter((r) => r.type === 'respiratory_rate' && r.value > 4)
    .map((r) => ({ time: r.start_time, value: +r.value.toFixed(1) }))

  // Pair systolic/diastolic by matching timestamps (within 60 seconds)
  const systolicRaw = (records ?? []).filter((r) => r.type === 'blood_pressure_systolic' && r.value > 40 && r.value < 300)
  const diastolicRaw = (records ?? []).filter((r) => r.type === 'blood_pressure_diastolic' && r.value > 20 && r.value < 200)
  const bloodPressure = systolicRaw.flatMap((s) => {
    const match = diastolicRaw.find(
      (d) => Math.abs(new Date(s.start_time).getTime() - new Date(d.start_time).getTime()) < 60000
    )
    if (!match) return []
    return [{ time: s.start_time, systolic: Math.round(s.value), diastolic: Math.round(match.value) }]
  })

  const restingHR = (records ?? [])
    .filter((r) => r.type === 'resting_heart_rate' && r.value > 20 && r.value < 220)
    .map((r) => ({ time: r.start_time, value: Math.round(r.value) }))

  const hrv = (records ?? [])
    .filter((r) => r.type === 'hrv' && r.value > 0 && r.value < 300)
    .map((r) => ({ time: r.start_time, value: +r.value.toFixed(1) }))

  const bodyTemp = (records ?? [])
    .filter((r) => r.type === 'wrist_temperature' && r.value > 30 && r.value < 42)
    .map((r) => ({ time: r.start_time, value: +r.value.toFixed(2) }))

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
            <h1 className="text-xl font-bold text-text-primary">Vitals</h1>
            <p className="text-sm text-text-secondary">Blood oxygen, breathing, pressure & more</p>
          </div>
          <Link
            href="/oxygen"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Blood oxygen detail"
            title="Blood Oxygen Detail"
          >
            <Wind className="w-5 h-5" />
          </Link>
          <Link
            href="/bloodpressure"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Blood pressure detail"
            title="Blood Pressure Detail"
          >
            <Heart className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <VitalsClient
          spO2={spO2}
          respRate={respRate}
          bloodPressure={bloodPressure}
          restingHR={restingHR}
          hrv={hrv}
          bodyTemp={bodyTemp}
        />
      </main>
      <BottomNav />
    </div>
  )
}
