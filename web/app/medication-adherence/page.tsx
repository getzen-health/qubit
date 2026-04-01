import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
const MedicationAdherenceClient = dynamic(() => import('./medication-adherence-client').then(m => ({ default: m.MedicationAdherenceClient })))
import type { MedicationEntry } from '@/lib/medication-adherence'

export const metadata = {
  title: 'Medication Adherence — GetZen',
  description: 'Track medication compliance, reminder schedules, and drug-food interactions.',
}

export default async function MedicationAdherencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [medsResult, logsResult, historyResult] = await Promise.all([
    supabase
      .from('user_medications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_time', `${today}T00:00:00`)
      .lte('scheduled_time', `${today}T23:59:59`)
      .order('scheduled_time'),
    supabase
      .from('medication_logs')
      .select('medication_id, scheduled_time, taken_at, skipped')
      .eq('user_id', user.id)
      .gte('scheduled_time', since30)
      .order('scheduled_time'),
  ])

  const medications = (medsResult.data ?? []) as MedicationEntry[]
  const todayLogs = logsResult.data ?? []
  const history = historyResult.data ?? []

  // Per-medication compliance over 30 days
  const medMap = new Map<string, { name: string; taken: number; scheduled: number }>()
  for (const med of medications) {
    medMap.set(med.id, { name: med.name, taken: 0, scheduled: 0 })
  }

  const complianceByDate: Record<string, { taken: number; scheduled: number }> = {}
  for (const log of history) {
    const date = (log.scheduled_time as string).slice(0, 10)
    if (!complianceByDate[date]) complianceByDate[date] = { taken: 0, scheduled: 0 }
    complianceByDate[date].scheduled += 1
    if (log.taken_at && !log.skipped) complianceByDate[date].taken += 1
    const m = medMap.get(log.medication_id)
    if (m) {
      m.scheduled += 1
      if (log.taken_at && !log.skipped) m.taken += 1
    }
  }

  const chartData = Object.entries(complianceByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date: date.slice(5),
      rate: v.scheduled > 0 ? Math.round((v.taken / v.scheduled) * 100) : 0,
      taken: v.taken,
      scheduled: v.scheduled,
    }))

  const perMedStats = Array.from(medMap.entries()).map(([id, v]) => ({
    medication_id: id,
    name: v.name,
    taken: v.taken,
    scheduled: v.scheduled,
    rate: v.scheduled > 0 ? Math.round((v.taken / v.scheduled) * 100) : 100,
  }))

  const totalTaken = perMedStats.reduce((s, m) => s + m.taken, 0)
  const totalScheduled = perMedStats.reduce((s, m) => s + m.scheduled, 0)
  const overallRate = totalScheduled > 0
    ? Math.round((totalTaken / totalScheduled) * 100)
    : 100

  const sortedDates = Object.keys(complianceByDate).sort().reverse()
  let streak = 0
  for (const d of sortedDates) {
    const { taken, scheduled } = complianceByDate[d]
    const rate = scheduled > 0 ? (taken / scheduled) * 100 : 100
    if (rate >= 80) streak++
    else break
  }

  return (
    <MedicationAdherenceClient
      medications={medications}
      todayLogs={todayLogs}
      chartData={chartData}
      perMedStats={perMedStats}
      overallRate={overallRate}
      streak={streak}
    />
  )
}
