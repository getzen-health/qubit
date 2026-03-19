import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ChronotypeClient } from './chronotype-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Sleep Chronotype' }

// Sleep midpoint in fractional hours since midnight (0–24, wrapping midnight correctly)
function sleepMidpoint(startIso: string, endIso: string): number {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const midMs = (start.getTime() + end.getTime()) / 2
  const mid = new Date(midMs)
  return mid.getHours() + mid.getMinutes() / 60
}

// Convert fractional hour to HH:MM string
function fmtHour(h: number): string {
  const total = ((h % 24) + 24) % 24
  const hh = Math.floor(total)
  const mm = Math.round((total - hh) * 60)
  const period = hh < 12 ? 'am' : 'pm'
  const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh
  return `${h12}:${String(mm).padStart(2, '0')} ${period}`
}

export default async function ChronotypePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: records } = await supabase
    .from('sleep_records')
    .select('start_time, end_time, duration_minutes')
    .eq('user_id', user.id)
    .gte('start_time', ninetyDaysAgo.toISOString())
    .gt('duration_minutes', 180)  // exclude naps
    .order('start_time', { ascending: true })

  interface NightPoint {
    date: string
    midpoint: number      // fractional hours 0-24
    midpointFmt: string   // "2:15 am"
    durationHours: number
    isWeekend: boolean
    weekday: number       // 0=Sun
  }

  const nights: NightPoint[] = (records ?? []).map((r) => {
    const bedtime = new Date(r.start_time)
    const weekday = bedtime.getDay()
    const isWeekend = weekday === 0 || weekday === 6
    const mid = sleepMidpoint(r.start_time, r.end_time)
    return {
      date: bedtime.toISOString().slice(0, 10),
      midpoint: mid,
      midpointFmt: fmtHour(mid),
      durationHours: r.duration_minutes / 60,
      isWeekend,
      weekday,
    }
  })

  const weekdayNights = nights.filter((n) => !n.isWeekend)
  const weekendNights = nights.filter((n) => n.isWeekend)

  const avg = (arr: NightPoint[]) =>
    arr.length > 0 ? arr.reduce((s, n) => s + n.midpoint, 0) / arr.length : null

  const weekdayMid = avg(weekdayNights)
  const weekendMid = avg(weekendNights)
  const overallMid = avg(nights)

  // Social Jet Lag: |weekend midpoint - weekday midpoint| in hours
  const socialJetLag = weekdayMid !== null && weekendMid !== null
    ? Math.abs(weekendMid - weekdayMid)
    : null

  // Chronotype based on weekday corrected midpoint
  // (MSF_sc approximation: just use weekday midpoint for simplicity)
  type Chronotype = 'Early' | 'Intermediate' | 'Late' | 'Unknown'
  function classifyChronotype(midHour: number): Chronotype {
    // Midpoints expressed as fractional hours (0-24)
    // 0-2 am = Early (2am and before)
    // 2-4 am = Intermediate
    // 4+ am = Late
    // For midnight crossover: 22-24 also maps to early
    const h = midHour % 24
    if (h <= 2 || h >= 22) return 'Early'
    if (h <= 4) return 'Intermediate'
    return 'Late'
  }

  const chronotype: Chronotype = weekdayMid !== null
    ? classifyChronotype(weekdayMid)
    : 'Unknown'

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/sleep"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to sleep"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Chronotype</h1>
            <p className="text-sm text-text-secondary">
              {nights.length > 0 ? `${nights.length} nights · last 90 days` : 'Sleep midpoint analysis'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <ChronotypeClient
          nights={nights}
          chronotype={chronotype}
          weekdayMid={weekdayMid}
          weekendMid={weekendMid}
          overallMid={overallMid}
          socialJetLag={socialJetLag}
        />
      </main>
      <BottomNav />
    </div>
  )
}
