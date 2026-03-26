import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function getHypertensionStage(systolic: number, diastolic: number): { label: string; color: string } {
  if (systolic >= 180 || diastolic >= 120) return { label: 'Hypertensive Crisis', color: 'text-red-700' }
  if (systolic >= 140 || diastolic >= 90) return { label: 'Stage 2 Hypertension', color: 'text-red-600' }
  if (systolic >= 130 || diastolic >= 80) return { label: 'Stage 1 Hypertension', color: 'text-orange-500' }
  if (systolic >= 120 && diastolic < 80) return { label: 'Elevated', color: 'text-yellow-500' }
  return { label: 'Normal', color: 'text-green-600' }
}

import BPForm from './bp-form'

export default async function BloodPressurePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const d30 = new Date(Date.now() - 30 * 86400000).toISOString()
  const { data: records } = await supabase
    .from('health_records')
    .select('value,metadata,recorded_at')
    .eq('user_id', user.id)
    .eq('metric_type', 'bloodPressure')
    .gte('recorded_at', d30)
    .order('recorded_at', { ascending: true })

  const readings = (records ?? []).map((r: Record<string, any>) => {
    const parts = String(r.value).split('/')
    return {
      date: r.recorded_at.split('T')[0],
      systolic: Number(parts[0]),
      diastolic: Number(parts[1] ?? 80),
    }
  }).filter((r: { systolic: number }) => r.systolic > 0)

  const avgSystolic = readings.length ? Math.round(readings.reduce((s, r) => s + r.systolic, 0) / readings.length) : null
  const avgDiastolic = readings.length ? Math.round(readings.reduce((s, r) => s + r.diastolic, 0) / readings.length) : null
  const stage = avgSystolic && avgDiastolic ? getHypertensionStage(avgSystolic, avgDiastolic) : null

  return (
    <div className="container mx-auto py-8 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Blood Pressure</h1>
      {avgSystolic && avgDiastolic ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Average Systolic</p>
            <p className="text-3xl font-bold mt-1">{avgSystolic}</p>
            <p className="text-xs text-muted-foreground">mmHg</p>
          </div>
          <div className="rounded-xl border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Average Diastolic</p>
            <p className="text-3xl font-bold mt-1">{avgDiastolic}</p>
            <p className="text-xs text-muted-foreground">mmHg</p>
          </div>
          <div className="rounded-xl border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Category</p>
            <p className={`text-lg font-bold mt-1 ${stage?.color}`}>{stage?.label}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
          <p className="text-3xl mb-2">❤️</p>
          <p className="font-medium">No blood pressure data</p>
          <p className="text-sm mt-1">Sync Apple Health data to see your blood pressure trends.</p>
        </div>
      )}
      {readings.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <p className="font-semibold mb-3">Recent Readings</p>
          <div className="space-y-2">
            {readings.slice(-10).reverse().map((r: { systolic: number; diastolic: number; date: string }, i: number) => {
              const s = getHypertensionStage(r.systolic, r.diastolic)
              return (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{r.date}</span>
                  <span className="font-mono font-medium">{r.systolic}/{r.diastolic}</span>
                  <span className={`text-xs ${s.color}`}>{s.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
