import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DentalClient } from './dental-client'
import { calculateDentalScore, defaultDentalLog } from '@/lib/dental-health'
import type { DentalLog } from '@/lib/dental-health'

export const metadata = { title: 'Dental Health Tracker | KQuarks' }

export default async function DentalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const since30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const { data: logs } = await supabase
    .from('dental_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', since30)
    .order('date', { ascending: false })
    .limit(30)

  const dentalLogs: DentalLog[] = (logs ?? []).map((l) => ({
    id: l.id as string,
    user_id: l.user_id as string,
    date: l.date as string,
    brushing_count: (l.brushing_count as number) ?? 0,
    brushing_duration_sec: (l.brushing_duration_sec as number) ?? 0,
    flossed: (l.flossed as boolean) ?? false,
    mouthwash: (l.mouthwash as boolean) ?? false,
    tongue_scraper: (l.tongue_scraper as boolean) ?? false,
    oil_pulling: (l.oil_pulling as boolean) ?? false,
    water_flosser: (l.water_flosser as boolean) ?? false,
    sugar_exposures: (l.sugar_exposures as number) ?? 0,
    fluoride_used: (l.fluoride_used as boolean) ?? false,
    dry_mouth: (l.dry_mouth as boolean) ?? false,
    acidic_beverages: (l.acidic_beverages as number) ?? 0,
    snacking_count: (l.snacking_count as number) ?? 0,
    sensitivity_areas: (l.sensitivity_areas as string[]) ?? [],
    bleeding_gums: (l.bleeding_gums as boolean) ?? false,
    notes: (l.notes as string) ?? '',
    last_dentist_visit: (l.last_dentist_visit as string) ?? undefined,
    created_at: l.created_at as string,
  }))

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = dentalLogs.find((l) => l.date === today) ?? defaultDentalLog(today)
  const score = calculateDentalScore(todayLog)

  return <DentalClient initialLogs={dentalLogs} initialTodayLog={todayLog} initialScore={score} />
}
