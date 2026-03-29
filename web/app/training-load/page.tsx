import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Activity } from 'lucide-react'
import dynamic from 'next/dynamic'
const TrainingLoadClient = dynamic(() => import('./training-load-client').then(m => ({ default: m.TrainingLoadClient })), { ssr: false })

export interface DayPoint {
  date: string
  label: string
  tss: number
  ctl: number
  atl: number
  tsb: number
  tsbPos: number | null
  tsbNeg: number | null
  acwr: number
}

function computeTSS(
  workout: { duration_minutes: number; avg_heart_rate: number | null; active_calories: number | null },
  maxHr: number,
): number {
  if (workout.avg_heart_rate && workout.avg_heart_rate > 0 && maxHr > 0) {
    const hrRatio = workout.avg_heart_rate / maxHr
    return Math.round((workout.duration_minutes / 60) * Math.pow(hrRatio, 2) * 100)
  }
  const calories = workout.active_calories ?? 0
  if (calories > 0) {
    return Math.min(300, Math.round(calories / 5))
  }
  return Math.min(150, Math.round((workout.duration_minutes / 60) * 50))
}

function getFormBadge(tsb: number): { label: string; color: string } {
  if (tsb > 25) return { label: 'Peak Form', color: '#22d3ee' }
  if (tsb >= 10) return { label: 'Optimal', color: '#60a5fa' }
  if (tsb >= 0) return { label: 'Fresh', color: '#4ade80' }
  if (tsb >= -30) return { label: 'Fatigued', color: '#fb923c' }
  return { label: 'Overreaching', color: '#f87171' }
}

export default async function TrainingLoadPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89)
  ninetyDaysAgo.setHours(0, 0, 0, 0)

  const [{ data: workouts }, { data: hrData }] = await Promise.all([
    supabase
      .from('workout_records')
      .select('start_time, duration_minutes, avg_heart_rate, workout_type, active_calories')
      .eq('user_id', user.id)
      .gte('start_time', ninetyDaysAgo.toISOString())
      .order('start_time', { ascending: true }),
    supabase
      .from('workout_records')
      .select('max_heart_rate')
      .eq('user_id', user.id)
      .not('max_heart_rate', 'is', null)
      .order('max_heart_rate', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const maxHr = hrData?.max_heart_rate ?? 190

  // Build daily TSS map from workouts
  const tssMap = new Map<string, number>()
  for (const w of workouts ?? []) {
    const dateStr = (w.start_time as string).slice(0, 10)
    const existing = tssMap.get(dateStr) ?? 0
    tssMap.set(dateStr, existing + computeTSS(w, maxHr))
  }

  // Build 90-day time series with CTL/ATL/TSB/ACWR
  const kCtl = 1 - Math.exp(-1 / 42)
  const kAtl = 1 - Math.exp(-1 / 7)
  let ctl = 0
  let atl = 0
  const days: DayPoint[] = []

  for (let i = 0; i < 90; i++) {
    const d = new Date(ninetyDaysAgo)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const tss = tssMap.get(dateStr) ?? 0

    atl = atl + kAtl * (tss - atl)
    ctl = ctl + kCtl * (tss - ctl)
    const tsb = ctl - atl
    const acwr = ctl > 0 ? atl / ctl : 0

    const ctlR = Math.round(ctl * 10) / 10
    const atlR = Math.round(atl * 10) / 10
    const tsbR = Math.round(tsb * 10) / 10

    days.push({
      date: dateStr,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tss,
      ctl: ctlR,
      atl: atlR,
      tsb: tsbR,
      tsbPos: tsbR >= 0 ? tsbR : null,
      tsbNeg: tsbR < 0 ? tsbR : null,
      acwr: +acwr.toFixed(2),
    })
  }

  const today = days[days.length - 1]
  const badge = getFormBadge(today?.tsb ?? 0)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Explore</span>
          </Link>

          <div className="w-px h-4 bg-border mx-1" />

          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-text-primary leading-tight">
                Performance Management
              </h1>
              <p className="text-xs text-text-secondary leading-none mt-0.5">
                CTL · ATL · TSB · Bannister model
              </p>
            </div>
          </div>

          {today && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
              style={{
                color: badge.color,
                borderColor: `${badge.color}30`,
                background: `${badge.color}12`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: badge.color }}
              />
              {badge.label}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <TrainingLoadClient days={days} />
      </main>
    </div>
  )
}
