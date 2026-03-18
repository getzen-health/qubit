import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Activity, Flame, Moon, Heart, Route, Layers, Scale, Zap, Dumbbell, Timer } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { CopySummaryButton } from './copy-summary-button'

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  return { title: `Day — ${date}` }
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function fmtDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function fmtSleep(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

function StatCard({ icon, label, value, unit, color }: {
  icon: React.ReactNode
  label: string
  value: string
  unit?: string
  color: string
}) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-text-primary">{value}</span>
        {unit && <span className="text-sm text-text-secondary">{unit}</span>}
      </div>
    </div>
  )
}

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Compute adjacent dates
  const dateObj = new Date(date + 'T12:00:00')
  const prevDate = new Date(dateObj); prevDate.setDate(dateObj.getDate() - 1)
  const nextDate = new Date(dateObj); nextDate.setDate(dateObj.getDate() + 1)
  const prevDateStr = prevDate.toISOString().slice(0, 10)
  const nextDateStr = nextDate.toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: summary }, { data: workouts }, { data: sleepRecords }, { data: prevDay }, { data: nextDay }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, steps, active_calories, distance_meters, floors_climbed, active_minutes, sleep_duration_minutes, resting_heart_rate, avg_hrv, recovery_score, strain_score, weight_kg')
      .eq('user_id', user.id)
      .eq('date', date)
      .single(),
    supabase
      .from('workout_records')
      .select('id, workout_type, start_time, duration_minutes, active_calories, distance_meters, avg_heart_rate')
      .eq('user_id', user.id)
      .gte('start_time', `${date}T00:00:00`)
      .lt('start_time', `${date}T23:59:59`)
      .order('start_time', { ascending: true }),
    supabase
      .from('sleep_records')
      .select('id, start_time, end_time, duration_minutes, deep_minutes, rem_minutes, core_minutes, awake_minutes')
      .eq('user_id', user.id)
      .gte('start_time', `${date}T00:00:00`)
      .lt('end_time', `${date}T23:59:59`)
      .order('start_time', { ascending: true }),
    supabase.from('daily_summaries').select('date').eq('user_id', user.id).eq('date', prevDateStr).maybeSingle(),
    supabase.from('daily_summaries').select('date').eq('user_id', user.id).eq('date', nextDateStr).maybeSingle(),
  ])

  if (!summary) notFound()

  const distanceKm = summary.distance_meters ? (summary.distance_meters / 1000).toFixed(2) : null

  const shareLines: string[] = [fmtDate(date)]
  shareLines.push(`Steps: ${summary.steps.toLocaleString()}`)
  if (summary.active_minutes) shareLines.push(`Active Minutes: ${summary.active_minutes} min`)
  if (summary.active_calories) shareLines.push(`Active Calories: ${Math.round(summary.active_calories)} kcal`)
  if (distanceKm) shareLines.push(`Distance: ${distanceKm} km`)
  if (summary.sleep_duration_minutes) shareLines.push(`Sleep: ${fmtSleep(summary.sleep_duration_minutes)}`)
  if (summary.resting_heart_rate) shareLines.push(`Resting HR: ${summary.resting_heart_rate} bpm`)
  if (summary.avg_hrv) shareLines.push(`HRV: ${Math.round(summary.avg_hrv)} ms`)
  if (summary.recovery_score != null) shareLines.push(`Recovery: ${summary.recovery_score}%`)
  if (summary.strain_score != null) shareLines.push(`Strain: ${summary.strain_score.toFixed(1)}/21`)
  if (workouts && workouts.length > 0) shareLines.push(`Workouts: ${workouts.length}`)
  const shareText = shareLines.join('\n')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-text-primary truncate">{fmtDate(date)}</h1>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <CopySummaryButton text={shareText} />
            {prevDay ? (
              <Link
                href={`/day/${prevDateStr}`}
                className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-5 h-5 text-text-secondary" />
              </Link>
            ) : (
              <span className="p-2 opacity-30"><ChevronLeft className="w-5 h-5 text-text-secondary" /></span>
            )}
            {nextDay && nextDateStr <= today ? (
              <Link
                href={`/day/${nextDateStr}`}
                className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
                aria-label="Next day"
              >
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              </Link>
            ) : (
              <span className="p-2 opacity-30"><ChevronRight className="w-5 h-5 text-text-secondary" /></span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Activity */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Activity</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Activity className="w-5 h-5 text-green-400" />}
              label="Steps"
              value={summary.steps.toLocaleString()}
              color="bg-green-500/10"
            />
            <StatCard
              icon={<Flame className="w-5 h-5 text-orange-400" />}
              label="Active Calories"
              value={summary.active_calories ? Math.round(summary.active_calories).toLocaleString() : '—'}
              unit={summary.active_calories ? 'kcal' : undefined}
              color="bg-orange-500/10"
            />
            {distanceKm && (
              <StatCard
                icon={<Route className="w-5 h-5 text-blue-400" />}
                label="Distance"
                value={distanceKm}
                unit="km"
                color="bg-blue-500/10"
              />
            )}
            {summary.active_minutes != null && summary.active_minutes > 0 && (
              <StatCard
                icon={<Timer className="w-5 h-5 text-cyan-400" />}
                label="Active Minutes"
                value={summary.active_minutes.toString()}
                unit="min"
                color="bg-cyan-500/10"
              />
            )}
            {summary.floors_climbed != null && summary.floors_climbed > 0 && (
              <StatCard
                icon={<Layers className="w-5 h-5 text-purple-400" />}
                label="Floors Climbed"
                value={summary.floors_climbed.toString()}
                color="bg-purple-500/10"
              />
            )}
          </div>
        </section>

        {/* Health */}
        {(summary.sleep_duration_minutes || summary.resting_heart_rate || summary.avg_hrv || summary.recovery_score || summary.strain_score) && (
          <section>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Health</h2>
            <div className="grid grid-cols-2 gap-3">
              {summary.sleep_duration_minutes != null && summary.sleep_duration_minutes > 0 && (
                <StatCard
                  icon={<Moon className="w-5 h-5 text-indigo-400" />}
                  label="Sleep"
                  value={fmtSleep(summary.sleep_duration_minutes)}
                  color="bg-indigo-500/10"
                />
              )}
              {summary.resting_heart_rate != null && (
                <StatCard
                  icon={<Heart className="w-5 h-5 text-red-400" />}
                  label="Resting HR"
                  value={summary.resting_heart_rate.toString()}
                  unit="bpm"
                  color="bg-red-500/10"
                />
              )}
              {summary.avg_hrv != null && (
                <StatCard
                  icon={<Zap className="w-5 h-5 text-yellow-400" />}
                  label="HRV"
                  value={Math.round(summary.avg_hrv).toString()}
                  unit="ms"
                  color="bg-yellow-500/10"
                />
              )}
              {summary.recovery_score != null && (
                <StatCard
                  icon={<Activity className="w-5 h-5 text-emerald-400" />}
                  label="Recovery"
                  value={summary.recovery_score.toString()}
                  unit="%"
                  color="bg-emerald-500/10"
                />
              )}
              {summary.strain_score != null && (
                <StatCard
                  icon={<Flame className="w-5 h-5 text-rose-400" />}
                  label="Strain"
                  value={summary.strain_score.toFixed(1)}
                  unit="/21"
                  color="bg-rose-500/10"
                />
              )}
              {summary.weight_kg != null && (
                <StatCard
                  icon={<Scale className="w-5 h-5 text-slate-400" />}
                  label="Weight"
                  value={summary.weight_kg.toFixed(1)}
                  unit="kg"
                  color="bg-slate-500/10"
                />
              )}
            </div>
          </section>
        )}

        {/* Workouts */}
        {workouts && workouts.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
              Workouts ({workouts.length})
            </h2>
            <div className="space-y-3">
              {workouts.map((w) => (
                <Link
                  key={w.id}
                  href={`/workouts/${w.id}`}
                  className="flex items-center gap-4 bg-surface border border-border rounded-xl p-4 hover:bg-surface-secondary transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary capitalize">{w.workout_type?.replace(/_/g, ' ') ?? 'Workout'}</p>
                    <p className="text-sm text-text-secondary">
                      {new Date(w.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {w.duration_minutes ? ` · ${fmtDuration(w.duration_minutes)}` : ''}
                      {w.active_calories ? ` · ${Math.round(w.active_calories)} kcal` : ''}
                    </p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-text-secondary rotate-180 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sleep stages detail */}
        {sleepRecords && sleepRecords.length > 0 && sleepRecords.some((r) => (r.deep_minutes ?? 0) + (r.rem_minutes ?? 0) + (r.core_minutes ?? 0) > 0) && (
          <section>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Sleep Stages</h2>
            {sleepRecords.map((r) => {
              const hasStages = (r.deep_minutes ?? 0) + (r.rem_minutes ?? 0) + (r.core_minutes ?? 0) > 0
              if (!hasStages) return null
              const total = r.duration_minutes + (r.awake_minutes ?? 0)
              const pct = (min: number) => `${Math.round((min / Math.max(total, 1)) * 100)}%`
              const fmtMin = (m: number) => { const h = Math.floor(m / 60); const mn = m % 60; return h > 0 ? `${h}h ${mn}m` : `${mn}m` }
              return (
                <div key={r.id} className="bg-surface rounded-xl border border-border p-4 space-y-3">
                  <p className="text-xs text-text-secondary">
                    {new Date(r.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {' – '}
                    {new Date(r.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                    {(r.deep_minutes ?? 0) > 0 && <div className="bg-blue-500" style={{ width: pct(r.deep_minutes!) }} />}
                    {(r.rem_minutes ?? 0) > 0 && <div className="bg-purple-500" style={{ width: pct(r.rem_minutes!) }} />}
                    {(r.core_minutes ?? 0) > 0 && <div className="bg-blue-300" style={{ width: pct(r.core_minutes!) }} />}
                    {(r.awake_minutes ?? 0) > 0 && <div className="bg-orange-400 rounded-r-full" style={{ width: pct(r.awake_minutes!) }} />}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                    {(r.deep_minutes ?? 0) > 0 && <span><span className="text-blue-400">●</span> Deep {fmtMin(r.deep_minutes!)}</span>}
                    {(r.rem_minutes ?? 0) > 0 && <span><span className="text-purple-400">●</span> REM {fmtMin(r.rem_minutes!)}</span>}
                    {(r.core_minutes ?? 0) > 0 && <span><span className="text-blue-300">●</span> Light {fmtMin(r.core_minutes!)}</span>}
                    {(r.awake_minutes ?? 0) > 0 && <span><span className="text-orange-400">●</span> Awake {fmtMin(r.awake_minutes!)}</span>}
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* No data fallback */}
        {summary.steps === 0 && !workouts?.length && (
          <div className="text-center py-12 text-text-secondary">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No activity recorded for this day.</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
