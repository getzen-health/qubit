import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateToxinBurden, DEFAULT_TOXIN_LOG } from '@/lib/environmental-toxins'
import type { ToxinLog } from '@/lib/environmental-toxins'
import { EnvironmentalClient } from './environmental-client'

export const metadata: Metadata = {
  title: 'Environmental Toxins | KQuarks',
  description:
    'Track daily exposure to plastics, heavy metals, pesticides, and VOCs. Understand your toxin burden score and personalised detox recommendations.',
}

export default async function EnvironmentalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)

  const [{ data: todayRaw }, { data: logs }] = await Promise.all([
    supabase.from('toxin_logs').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
    supabase
      .from('toxin_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', since30)
      .order('date', { ascending: true }),
  ])

  const initialLog: ToxinLog = (todayRaw as ToxinLog | null) ?? { ...DEFAULT_TOXIN_LOG, date: today }

  const trendData = (logs ?? []).map((l) => {
    const s = calculateToxinBurden(l as ToxinLog)
    return {
      date: (l as ToxinLog).date,
      score: s.total,
      plastics: s.pillars.plastics,
      heavyMetals: s.pillars.heavyMetals,
      pesticides: s.pillars.pesticides,
      vocs: s.pillars.vocs,
    }
  })

  return <EnvironmentalClient initialLog={initialLog} trendData={trendData} />
}
