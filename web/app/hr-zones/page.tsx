'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Heart, Activity, BarChart2, Settings, Zap, RefreshCw } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  calculateHRZones,
  detectZone,
  analyzePolarizedBalance,
  type HRZoneProfile,
  type HRZone,
  type WorkoutZoneLog,
} from '@/lib/hr-zones'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = 'setup' | 'zones' | 'log' | 'analysis'
type Formula = 'tanaka' | 'fox' | 'manual'

interface WorkoutLog {
  id?: string
  logged_at: string
  workout_type: string | null
  duration_min: number
  avg_hr: number | null
  dominant_zone: number | null
  calories: number | null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const ZONE_COLORS: Record<number, string> = {
  1: '#38bdf8',
  2: '#22c55e',
  3: '#facc15',
  4: '#f97316',
  5: '#ef4444',
}

const ZONE_BG: Record<number, string> = {
  1: 'bg-sky-400/20 border-sky-400/40',
  2: 'bg-green-500/20 border-green-500/40',
  3: 'bg-yellow-400/20 border-yellow-400/40',
  4: 'bg-orange-500/20 border-orange-500/40',
  5: 'bg-red-500/20 border-red-500/40',
}

const ZONE_TEXT: Record<number, string> = {
  1: 'text-sky-400',
  2: 'text-green-500',
  3: 'text-yellow-400',
  4: 'text-orange-500',
  5: 'text-red-500',
}

function ZoneBadge({ zone }: { zone: number | null }) {
  if (!zone) return <span className="text-xs text-text-secondary">—</span>
  return (
    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', ZONE_BG[zone] ?? '', ZONE_TEXT[zone] ?? '')}>
      Z{zone}
    </span>
  )
}

// ─── Setup Tab ───────────────────────────────────────────────────────────────

function SetupTab({
  onSave,
}: {
  onSave: (profile: HRZoneProfile) => void
}) {
  const [age, setAge] = useState('')
  const [restingHR, setRestingHR] = useState('')
  const [formula, setFormula] = useState<Formula>('tanaka')
  const [manualMax, setManualMax] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleCalculate = async () => {
    const ageN = parseInt(age)
    const hrN = parseInt(restingHR)
    if (!ageN || !hrN || ageN < 10 || ageN > 120 || hrN < 30 || hrN > 120) return
    const manN = formula === 'manual' ? parseInt(manualMax) : undefined

    const profile = calculateHRZones(ageN, hrN, formula, manN)
    onSave(profile)

    setSaving(true)
    try {
      await fetch('/api/hr-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_profile',
          age: ageN,
          resting_hr: hrN,
          max_hr: manN ?? profile.max_hr,
          formula_used: formula,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-surface border border-border p-5 space-y-4">
        <h2 className="font-semibold text-text-primary">Your Metrics</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Age</label>
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="35"
              min={10}
              max={120}
              className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Resting HR (bpm)</label>
            <input
              type="number"
              value={restingHR}
              onChange={e => setRestingHR(e.target.value)}
              placeholder="62"
              min={30}
              max={120}
              className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1.5">Max HR Formula</label>
          <div className="grid grid-cols-3 gap-2">
            {(['tanaka', 'fox', 'manual'] as Formula[]).map(f => (
              <button
                key={f}
                onClick={() => setFormula(f)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors',
                  formula === f
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'bg-surface border-border text-text-secondary hover:text-text-primary',
                )}
              >
                {f === 'tanaka' ? 'Tanaka ⭐' : f === 'fox' ? 'Fox (220−age)' : 'Manual'}
              </button>
            ))}
          </div>
          {formula === 'tanaka' && (
            <p className="mt-2 text-[11px] text-text-secondary">
              208 − 0.7 × age (Tanaka et al., J Am Coll Cardiol 2001 — meta-analysis of 351 studies)
            </p>
          )}
          {formula === 'fox' && (
            <p className="mt-2 text-[11px] text-text-secondary">
              220 − age (Fox & Haskell 1971 — classic estimate, less accurate for older adults)
            </p>
          )}
        </div>

        {formula === 'manual' && (
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Max HR from lab/all-out effort (bpm)</label>
            <input
              type="number"
              value={manualMax}
              onChange={e => setManualMax(e.target.value)}
              placeholder="185"
              min={100}
              max={250}
              className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary"
            />
          </div>
        )}

        <button
          onClick={handleCalculate}
          disabled={saving || !age || !restingHR}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Calculate My Zones'}
        </button>
      </div>

      <div className="rounded-2xl bg-surface border border-border p-5 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">About Karvonen Method</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Zones are calculated using <strong className="text-text-primary">Heart Rate Reserve (HRR)</strong>:
          target HR = ((HRmax − HRrest) × intensity%) + HRrest. This accounts for
          your individual fitness level, making zones more accurate than simple % of max HR.
        </p>
        <p className="text-xs text-text-secondary leading-relaxed">
          The <strong className="text-text-primary">Seiler 80/20 polarised model</strong> (Int J Sports Physiol Perform 2010)
          recommends ~80% of training volume below VT1 (zones 1–2) and only ~20% above VT2 (zones 3–5) —
          the distribution used by most elite endurance athletes.
        </p>
      </div>
    </div>
  )
}

// ─── Zones Tab ───────────────────────────────────────────────────────────────

function ZonesTab({ profile }: { profile: HRZoneProfile | null }) {
  if (!profile) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-8 text-center">
        <Heart className="w-10 h-10 text-text-secondary mx-auto mb-3" />
        <p className="font-medium text-text-primary">No profile yet</p>
        <p className="text-sm text-text-secondary mt-1">Go to Setup and calculate your zones first.</p>
      </div>
    )
  }

  const fitnessColors: Record<string, string> = {
    Poor: 'text-red-500',
    Fair: 'text-orange-500',
    Good: 'text-yellow-400',
    Excellent: 'text-green-500',
    Superior: 'text-sky-400',
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-surface border border-border p-3 text-center">
          <p className="text-[10px] text-text-secondary uppercase tracking-wide">Max HR</p>
          <p className="text-2xl font-bold text-text-primary mt-0.5">{profile.max_hr}</p>
          <p className="text-[10px] text-text-secondary">bpm</p>
        </div>
        <div className="rounded-2xl bg-surface border border-border p-3 text-center">
          <p className="text-[10px] text-text-secondary uppercase tracking-wide">HR Reserve</p>
          <p className="text-2xl font-bold text-text-primary mt-0.5">{profile.hr_reserve}</p>
          <p className="text-[10px] text-text-secondary">bpm</p>
        </div>
        <div className="rounded-2xl bg-surface border border-border p-3 text-center">
          <p className="text-[10px] text-text-secondary uppercase tracking-wide">Est. VO₂max</p>
          <p className={cn('text-2xl font-bold mt-0.5', fitnessColors[profile.cardio_fitness] ?? 'text-text-primary')}>
            {profile.vo2max_estimate}
          </p>
          <p className="text-[10px] text-text-secondary">ml/kg/min</p>
        </div>
      </div>

      {/* Fitness category badge */}
      <div className="rounded-2xl bg-surface border border-border p-4 flex items-center gap-3">
        <div className={cn('text-3xl font-black', fitnessColors[profile.cardio_fitness] ?? '')}>
          {profile.cardio_fitness}
        </div>
        <div>
          <p className="text-xs text-text-secondary">Cardio Fitness Category</p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Based on Uth et al. (2004) VO₂max estimate via resting HR ratio · ACSM norms
          </p>
        </div>
      </div>

      {/* Zone cards */}
      {profile.zones.map(zone => (
        <div key={zone.zone} className={cn('rounded-2xl border p-4 space-y-2', ZONE_BG[zone.zone] ?? '')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn('text-lg font-black', ZONE_TEXT[zone.zone] ?? '')}>Z{zone.zone}</span>
              <span className="font-semibold text-text-primary">{zone.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-bold text-text-primary">
                {zone.min_bpm}–{zone.max_bpm}
              </span>
              <span className="text-xs text-text-secondary ml-1">bpm</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary">{zone.description}</p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-secondary">{zone.typical_feel}</span>
            <span className={cn('font-medium', ZONE_TEXT[zone.zone] ?? '')}>
              {zone.min_hrr_pct}–{zone.max_hrr_pct}% HRR
            </span>
          </div>
          <p className="text-[11px] text-text-secondary border-t border-border/40 pt-2 mt-1">
            <strong className="text-text-primary">Benefit:</strong> {zone.benefit}
          </p>
        </div>
      ))}

      {/* 80/20 guide */}
      <div className="rounded-2xl bg-surface border border-border p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Seiler 80/20 Polarised Model</h3>
        <p className="text-xs text-text-secondary">Ideal weekly training distribution for aerobic development:</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-4 rounded-full bg-sky-400/80" style={{ width: '80%' }} />
            <span className="text-xs font-semibold text-text-primary whitespace-nowrap">80% — Zone 1–2</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 rounded-full bg-orange-500/80" style={{ width: '20%' }} />
            <span className="text-xs font-semibold text-text-primary whitespace-nowrap">20% — Zone 3–5</span>
          </div>
        </div>
        <p className="text-[11px] text-text-secondary">
          Elite endurance athletes spend ~80% below ventilatory threshold 1 (VT1) and ~20% above VT2.
          This maximises aerobic adaptations while limiting overtraining stress.
        </p>
      </div>
    </div>
  )
}

// ─── Log Workout Tab ─────────────────────────────────────────────────────────

function LogWorkoutTab({
  profile,
  logs,
  onLogged,
}: {
  profile: HRZoneProfile | null
  logs: WorkoutLog[]
  onLogged: () => void
}) {
  const [workoutType, setWorkoutType] = useState('')
  const [duration, setDuration] = useState('')
  const [avgHR, setAvgHR] = useState('')
  const [calories, setCalories] = useState('')
  const [logging, setLogging] = useState(false)
  const [detectedZone, setDetectedZone] = useState<number | null>(null)

  useEffect(() => {
    if (profile && avgHR) {
      const hr = parseInt(avgHR)
      if (hr > 0) setDetectedZone(detectZone(hr, profile.zones))
    } else {
      setDetectedZone(null)
    }
  }, [avgHR, profile])

  const handleLog = async () => {
    const durN = parseInt(duration)
    if (!durN || durN < 1) return
    setLogging(true)
    try {
      await fetch('/api/hr-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_workout',
          workout_type: workoutType || null,
          duration_min: durN,
          avg_hr: avgHR ? parseInt(avgHR) : null,
          calories: calories ? parseInt(calories) : null,
          zones: profile?.zones ?? null,
        }),
      })
      setWorkoutType('')
      setDuration('')
      setAvgHR('')
      setCalories('')
      setDetectedZone(null)
      onLogged()
    } finally {
      setLogging(false)
    }
  }

  const WORKOUT_TYPES = ['Run', 'Cycle', 'Walk', 'Swim', 'Row', 'Hike', 'HIIT', 'Strength', 'Yoga', 'Other']

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-surface border border-border p-5 space-y-4">
        <h2 className="font-semibold text-text-primary">Log a Workout</h2>

        <div>
          <label className="block text-xs text-text-secondary mb-1.5">Workout Type</label>
          <div className="flex flex-wrap gap-2">
            {WORKOUT_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setWorkoutType(t === workoutType ? '' : t)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  workoutType === t
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'bg-background border-border text-text-secondary hover:text-text-primary',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Duration (min)</label>
            <input
              type="number"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="45"
              min={1}
              max={600}
              className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Avg HR (bpm)</label>
            <input
              type="number"
              value={avgHR}
              onChange={e => setAvgHR(e.target.value)}
              placeholder="142"
              min={40}
              max={250}
              className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Calories</label>
            <input
              type="number"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              placeholder="380"
              min={0}
              className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {detectedZone && profile && (
          <div className={cn('rounded-xl border p-3 flex items-center gap-3', ZONE_BG[detectedZone] ?? '')}>
            <ZoneBadge zone={detectedZone} />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {profile.zones[detectedZone - 1]?.name ?? ''}
              </p>
              <p className="text-xs text-text-secondary">
                {profile.zones[detectedZone - 1]?.typical_feel ?? ''}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLog}
          disabled={logging || !duration}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
        >
          {logging ? 'Logging…' : 'Log Workout'}
        </button>
      </div>

      {/* History */}
      {logs.length > 0 && (
        <div className="rounded-2xl bg-surface border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Recent Workouts</h3>
          </div>
          <div className="divide-y divide-border">
            {logs.slice(0, 14).map((log, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {log.workout_type ?? 'Workout'} · {log.duration_min} min
                  </p>
                  <p className="text-xs text-text-secondary">{log.logged_at}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {log.avg_hr && (
                    <span className="text-xs text-text-secondary">{log.avg_hr} bpm</span>
                  )}
                  <ZoneBadge zone={log.dominant_zone} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Analysis Tab ─────────────────────────────────────────────────────────────

function AnalysisTab({
  logs,
  zoneDist,
}: {
  logs: WorkoutLog[]
  zoneDist: number[]
}) {
  const workoutLogs: WorkoutZoneLog[] = logs.map(l => ({
    date: l.logged_at,
    duration_min: l.duration_min,
    avg_hr: l.avg_hr ?? 0,
    zone: l.dominant_zone ?? 1,
    calories: l.calories ?? undefined,
  }))

  const polarized = analyzePolarizedBalance(workoutLogs)

  const zoneChartData = [1, 2, 3, 4, 5].map(z => ({
    name: `Z${z}`,
    count: zoneDist[z - 1] ?? 0,
    color: ZONE_COLORS[z],
  }))

  const totalWorkouts = zoneDist.reduce((s, v) => s + v, 0)

  if (logs.length === 0) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-8 text-center">
        <BarChart2 className="w-10 h-10 text-text-secondary mx-auto mb-3" />
        <p className="font-medium text-text-primary">No workout data yet</p>
        <p className="text-sm text-text-secondary mt-1">Log some workouts to see your zone analysis.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Zone distribution bar chart */}
      <div className="rounded-2xl bg-surface border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Zone Distribution</h3>
        <p className="text-xs text-text-secondary mb-4">Last 30 workouts ({totalWorkouts} total)</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={zoneChartData} barCategoryGap="30%">
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={20} />
            <Tooltip
              contentStyle={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                fontSize: 12,
              }}
              cursor={{ fill: 'var(--surface)' }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {zoneChartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Polarized balance */}
      <div className="rounded-2xl bg-surface border border-border p-4 space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">Polarised Balance (80/20)</h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-sky-400 font-semibold">Zone 1–2 (Easy)</span>
            <span className="text-text-primary font-bold">{polarized.zone12_pct}%</span>
          </div>
          <div className="h-3 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-400 transition-all duration-500"
              style={{ width: `${polarized.zone12_pct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-orange-500 font-semibold">Zone 3–5 (Hard)</span>
            <span className="text-text-primary font-bold">{polarized.zone345_pct}%</span>
          </div>
          <div className="h-3 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-500"
              style={{ width: `${polarized.zone345_pct}%` }}
            />
          </div>
        </div>

        <div className={cn(
          'rounded-xl border p-3 text-xs leading-relaxed',
          polarized.compliant
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400',
        )}>
          {polarized.compliant ? '✓ ' : '→ '}{polarized.recommendation}
        </div>

        <div className="text-[11px] text-text-secondary border-t border-border pt-3">
          Target: ≥75% zone 1–2 · Seiler (Int J Sports Physiol Perform, 2010)
        </div>
      </div>

      {/* Per-zone breakdown */}
      <div className="rounded-2xl bg-surface border border-border p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Zone Breakdown</h3>
        {[1, 2, 3, 4, 5].map(z => {
          const count = zoneDist[z - 1] ?? 0
          const pct = totalWorkouts ? Math.round((count / totalWorkouts) * 100) : 0
          return (
            <div key={z} className="flex items-center gap-3">
              <ZoneBadge zone={z} />
              <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: ZONE_COLORS[z] }}
                />
              </div>
              <span className="text-xs text-text-secondary w-10 text-right">{count} ({pct}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HRZonesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('setup')
  const [profile, setProfile] = useState<HRZoneProfile | null>(null)
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [zoneDist, setZoneDist] = useState<number[]>([0, 0, 0, 0, 0])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/hr-zones')
      if (!res.ok) return
      const json = await res.json()
      if (json.zones) setProfile(json.zones)
      if (json.logs) setLogs(json.logs)
      if (json.zone_distribution) setZoneDist(json.zone_distribution)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'setup', label: 'Setup', icon: Settings },
    { id: 'zones', label: 'Zones', icon: Heart },
    { id: 'log', label: 'Log', icon: Activity },
    { id: 'analysis', label: 'Analysis', icon: BarChart2 },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <Link href="/dashboard" className="p-1.5 rounded-xl hover:bg-surface transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Heart className="w-5 h-5 text-primary" />
            <h1 className="font-semibold text-text-primary">HR Zone Training</h1>
          </div>
          {loading && <RefreshCw className="w-4 h-4 text-text-secondary animate-spin" />}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-3 max-w-2xl mx-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-w-2xl mx-auto">
        {activeTab === 'setup' && (
          <SetupTab onSave={p => { setProfile(p); setActiveTab('zones') }} />
        )}
        {activeTab === 'zones' && <ZonesTab profile={profile} />}
        {activeTab === 'log' && (
          <LogWorkoutTab profile={profile} logs={logs} onLogged={fetchData} />
        )}
        {activeTab === 'analysis' && (
          <AnalysisTab logs={logs} zoneDist={zoneDist} />
        )}
      </div>
    </div>
  )
}
