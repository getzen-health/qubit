import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Moon } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { WorkoutShareButton } from './workout-share-button'

const WORKOUT_ICONS: Record<string, string> = {
  Running: '🏃',
  Walking: '🚶',
  Hiking: '🥾',
  Cycling: '🚴',
  Swimming: '🏊',
  'Strength Training': '💪',
  Yoga: '🧘',
  HIIT: '⚡',
  Rowing: '🚣',
  Pilates: '🤸',
  Dance: '💃',
}

function workoutIcon(type: string) {
  return WORKOUT_ICONS[type] ?? '⚡'
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatPace(secsPerKm: number) {
  const min = Math.floor(secsPerKm / 60)
  const sec = Math.round(secsPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')} /km`
}

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: workout } = await supabase
    .from('workout_records')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!workout) notFound()

  // Fetch user profile for personalized max HR; fall back to age-based formula (220 - age)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('max_heart_rate, age, date_of_birth')
    .eq('user_id', user.id)
    .single()

  const profileMaxHR = profile?.max_heart_rate
  const ageBasedMaxHR = (() => {
    if (profile?.date_of_birth) {
      const age = new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
      return Math.round(220 - age)
    }
    if (profile?.age) return Math.round(220 - profile.age)
    return null
  })()

  // Fetch heart rate samples within workout window for zone analysis
  const workoutEnd = workout.end_time
    ?? new Date(new Date(workout.start_time).getTime() + workout.duration_minutes * 60000).toISOString()
  const { data: hrRecords } = await supabase
    .from('health_records')
    .select('start_time, end_time, value')
    .eq('user_id', user.id)
    .eq('type', 'heart_rate')
    .gte('start_time', workout.start_time)
    .lte('start_time', workoutEnd)
    .order('start_time', { ascending: true })

  // Compute HR zones (5-zone model based on % of max HR)
  // Priority: workout's own max HR → user profile max HR → age-based 220-age → 190 generic
  const maxHR = workout.max_heart_rate ?? profileMaxHR ?? ageBasedMaxHR ?? 190
  const zones = [
    { label: 'Zone 1', desc: 'Easy', pctMin: 50, pctMax: 60, color: '#6366f1' },
    { label: 'Zone 2', desc: 'Aerobic', pctMin: 60, pctMax: 70, color: '#22c55e' },
    { label: 'Zone 3', desc: 'Tempo', pctMin: 70, pctMax: 80, color: '#eab308' },
    { label: 'Zone 4', desc: 'Threshold', pctMin: 80, pctMax: 90, color: '#f97316' },
    { label: 'Zone 5', desc: 'Max', pctMin: 90, pctMax: 200, color: '#ef4444' },
  ]

  // Compute seconds in each zone from HR samples (each sample represents interval to next)
  const zoneSeconds = zones.map(() => 0)
  let totalZoneSeconds = 0
  if (hrRecords && hrRecords.length > 0) {
    for (let i = 0; i < hrRecords.length; i++) {
      const bpm = hrRecords[i].value
      const nextTime = hrRecords[i + 1]?.start_time ?? workoutEnd
      const duration = (new Date(nextTime).getTime() - new Date(hrRecords[i].start_time).getTime()) / 1000
      const clampedDuration = Math.min(duration, 120) // cap at 2 min to avoid gaps inflating zone
      const pct = (bpm / maxHR) * 100
      const zoneIdx = zones.findIndex((z) => pct >= z.pctMin && pct < z.pctMax)
      if (zoneIdx >= 0 && clampedDuration > 0) {
        zoneSeconds[zoneIdx] += clampedDuration
        totalZoneSeconds += clampedDuration
      }
    }
  }
  const hasZoneData = totalZoneSeconds > 60 // at least 1 minute of data

  // Recovery estimate (research-backed, similar to Garmin recovery advisor)
  const z45pct = (zoneSeconds[3] + zoneSeconds[4]) / Math.max(totalZoneSeconds, 1)
  const intensityMult = 1.0 + z45pct * 2.5
  const baseHours = (workout.duration_minutes / 60) * 8
  const rawHours = baseHours * intensityMult
  const recoveryMin = Math.min(72, Math.max(4, Math.round(rawHours * 0.8)))
  const recoveryMax = Math.min(96, Math.max(6, Math.round(rawHours * 1.2)))
  const intensityLabel: 'Easy' | 'Moderate' | 'Hard' | 'Very Hard' =
    z45pct < 0.15 ? 'Easy' : z45pct < 0.30 ? 'Moderate' : z45pct < 0.50 ? 'Hard' : 'Very Hard'

  // Fetch last 7 days of workouts for next-workout recommendation
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentWorkouts } = await supabase
    .from('workout_records')
    .select('workout_type, duration_minutes')
    .eq('user_id', user.id)
    .gte('start_time', sevenDaysAgo)
    .order('start_time', { ascending: false })
    .limit(10)

  const typeCounts = (recentWorkouts ?? []).reduce<Record<string, number>>((acc, w) => {
    acc[w.workout_type] = (acc[w.workout_type] ?? 0) + 1
    return acc
  }, {})

  const coreTypes = ['Running', 'Cycling', 'Strength Training', 'Yoga', 'HIIT'] as const

  // Determine suggested next workout based on recovery and recent variety
  let suggestionType: string
  let suggestionReason: string
  let suggestionIsRest: boolean

  if (recoveryMin > 36) {
    suggestionType = 'Rest'
    suggestionReason = `You need ~${recoveryMin}h of recovery. Take a full rest day to rebuild.`
    suggestionIsRest = true
  } else if (recoveryMin > 24) {
    suggestionType = 'Yoga'
    suggestionReason = 'Light active recovery like yoga helps flush lactic acid and reduce soreness.'
    suggestionIsRest = false
  } else if (workout.workout_type === 'Running' && !typeCounts['Strength Training']) {
    suggestionType = 'Strength Training'
    suggestionReason = "You haven't done strength work this week — it improves running economy."
    suggestionIsRest = false
  } else if (workout.workout_type === 'Strength Training' && !typeCounts['Running'] && !typeCounts['Cycling']) {
    suggestionType = 'Running'
    suggestionReason = 'Balance strength work with cardio for well-rounded fitness.'
    suggestionIsRest = false
  } else {
    const typeReasons: Record<string, string> = {
      Running: 'Running builds cardiovascular endurance and is great for calorie burn.',
      Cycling: 'Cycling offers low-impact cardio — ideal cross-training.',
      'Strength Training': 'Strength work improves overall fitness and metabolism.',
      Yoga: 'Yoga improves flexibility, balance, and mental recovery.',
      HIIT: 'HIIT is time-efficient and boosts your metabolism effectively.',
    }
    const leastDone = coreTypes.reduce<string>(
      (min, t) => ((typeCounts[t] ?? 0) < (typeCounts[min] ?? 0) ? t : min),
      'Running',
    )
    suggestionType = leastDone
    suggestionReason = typeReasons[leastDone] ?? 'A balanced routine leads to better long-term results.'
    suggestionIsRest = false
  }

  function fmtZoneTime(secs: number) {
    const m = Math.floor(secs / 60)
    const s = Math.round(secs % 60)
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  // Find personal bests for this workout type
  const { data: sameType } = await supabase
    .from('workout_records')
    .select('id, duration_minutes, distance_meters, active_calories, avg_pace_per_km')
    .eq('user_id', user.id)
    .eq('workout_type', workout.workout_type)
    .lt('start_time', workout.start_time) // only prior workouts

  const pbs: string[] = []
  if (sameType && sameType.length > 0) {
    const maxDuration = Math.max(...sameType.map((w) => w.duration_minutes ?? 0))
    const maxDistance = Math.max(...sameType.map((w) => w.distance_meters ?? 0))
    const maxCalories = Math.max(...sameType.map((w) => w.active_calories ?? 0))
    const bestPace = Math.min(...sameType.filter((w) => (w.avg_pace_per_km ?? 0) > 0).map((w) => w.avg_pace_per_km!))
    if (workout.duration_minutes > maxDuration) pbs.push('Longest session')
    if (workout.distance_meters > 0 && workout.distance_meters > maxDistance) pbs.push('Furthest distance')
    if (workout.active_calories > 0 && workout.active_calories > maxCalories) pbs.push('Most calories')
    if (workout.avg_pace_per_km > 0 && isFinite(bestPace) && workout.avg_pace_per_km < bestPace) pbs.push('Fastest pace')
  }

  const startDate = new Date(workout.start_time)

  const stats: Array<{ label: string; value: string }> = [
    { label: 'Duration', value: formatDuration(workout.duration_minutes) },
  ]
  if (workout.active_calories > 0) {
    stats.push({ label: 'Active Calories', value: `${Math.round(workout.active_calories)} kcal` })
  }
  if (workout.total_calories > 0) {
    stats.push({ label: 'Total Calories', value: `${Math.round(workout.total_calories)} kcal` })
  }
  if (workout.distance_meters > 0) {
    stats.push({ label: 'Distance', value: `${(workout.distance_meters / 1000).toFixed(2)} km` })
  }
  if (workout.avg_pace_per_km > 0) {
    stats.push({ label: 'Avg Pace', value: formatPace(workout.avg_pace_per_km) })
  }
  if (workout.avg_heart_rate > 0) {
    stats.push({ label: 'Avg Heart Rate', value: `${workout.avg_heart_rate} bpm` })
  }
  if (workout.max_heart_rate > 0) {
    stats.push({ label: 'Max Heart Rate', value: `${workout.max_heart_rate} bpm` })
  }
  if (workout.elevation_gain_meters > 0) {
    stats.push({ label: 'Elevation Gain', value: `${Math.round(workout.elevation_gain_meters)} m` })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <h1 className="text-xl font-bold text-text-primary flex-1">{workout.workout_type}</h1>
          <WorkoutShareButton
            date={startDate.toISOString().slice(0, 10)}
            calories={workout.active_calories > 0 ? Math.round(workout.active_calories) : undefined}
            avgHeartRate={workout.avg_heart_rate > 0 ? workout.avg_heart_rate : undefined}
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-4">
        {/* Hero */}
        <div className="flex items-center gap-4 p-6 bg-surface rounded-xl border border-border">
          <span className="text-5xl">{workoutIcon(workout.workout_type)}</span>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{workout.workout_type}</h2>
            <p className="text-text-secondary">
              {startDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="text-sm text-text-secondary">
              {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
            {pbs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {pbs.map((pb) => (
                  <span key={pb} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-semibold border border-yellow-500/20">
                    🏆 {pb}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-surface rounded-xl border border-border divide-y divide-border">
          {stats.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-4 py-3">
              <span className="text-text-secondary text-sm">{label}</span>
              <span className="text-text-primary font-semibold">{value}</span>
            </div>
          ))}
        </div>

        {/* Heart Rate Zones */}
        {hasZoneData && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-1">Heart Rate Zones</h2>
            <p className="text-xs text-text-secondary mb-3">
              Based on {maxHR} bpm max HR
              {!workout.max_heart_rate && !profileMaxHR && ageBasedMaxHR && ' (age-based estimate)'}
              {!workout.max_heart_rate && !profileMaxHR && !ageBasedMaxHR && ' (generic fallback — set age in profile for accuracy)'}
            </p>
            {/* Zone stacked bar */}
            <div className="flex h-4 rounded-full overflow-hidden mb-4">
              {zones.map((zone, i) => {
                const pct = totalZoneSeconds > 0 ? (zoneSeconds[i] / totalZoneSeconds) * 100 : 0
                return pct > 0 ? (
                  <div key={zone.label} style={{ width: `${pct}%`, backgroundColor: zone.color }} title={`${zone.label}: ${fmtZoneTime(zoneSeconds[i])}`} />
                ) : null
              })}
            </div>
            {/* Zone breakdown rows */}
            <div className="space-y-2">
              {zones.map((zone, i) => {
                const secs = zoneSeconds[i]
                const pct = totalZoneSeconds > 0 ? (secs / totalZoneSeconds) * 100 : 0
                if (secs === 0) return null
                return (
                  <div key={zone.label} className="flex items-center gap-3">
                    <span style={{ color: zone.color }} className="text-xs font-semibold w-14 shrink-0">{zone.label}</span>
                    <div className="flex-1 bg-surface-secondary rounded-full h-2 overflow-hidden">
                      <div style={{ width: `${pct}%`, backgroundColor: zone.color }} className="h-full rounded-full" />
                    </div>
                    <span className="text-xs text-text-secondary w-16 text-right shrink-0">{fmtZoneTime(secs)}</span>
                    <span className="text-xs text-text-secondary w-10 text-right shrink-0">{Math.round(pct)}%</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
              {zones.map((zone) => (
                <span key={zone.label}><span style={{ color: zone.color }}>●</span> {zone.label} {zone.desc} ({zone.pctMin}–{zone.pctMax === 200 ? '100' : zone.pctMax}%)</span>
              ))}
            </div>
          </div>
        )}

        {/* Recovery Estimate */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Moon className="w-4 h-4 text-blue-400" />
            Recovery Estimate
          </h3>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-text-primary">{recoveryMin}–{recoveryMax}</span>
            <span className="text-text-secondary text-sm">hours</span>
            <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${
              intensityLabel === 'Easy'
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : intensityLabel === 'Moderate'
                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                : intensityLabel === 'Hard'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>{intensityLabel}</span>
          </div>
          <p className="text-xs text-text-secondary">
            Based on {hasZoneData ? 'time in Z4/Z5 and total duration' : 'total duration'}
          </p>
        </div>

        {/* Suggested Next Workout */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="text-base">🎯</span>
            Suggested Next Workout
          </h3>
          {suggestionIsRest ? (
            <div className="flex items-start gap-3">
              <span className="text-3xl">😴</span>
              <div>
                <p className="font-semibold text-text-primary">Rest Day</p>
                <p className="text-sm text-text-secondary mt-0.5">{suggestionReason}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <span className="text-3xl">{workoutIcon(suggestionType)}</span>
              <div>
                <p className="font-semibold text-text-primary">{suggestionType}</p>
                <p className="text-sm text-text-secondary mt-0.5">{suggestionReason}</p>
              </div>
            </div>
          )}
          <p className="text-xs text-text-secondary mt-3 pt-3 border-t border-border">
            Based on workout intensity &amp; last 7 days of variety
          </p>
        </div>

        {/* Source */}
        {workout.source && (
          <p className="text-xs text-text-secondary text-center">
            Recorded by {workout.source}
          </p>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
