'use client'

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import {
  SPORTS,
  RPE_LABELS,
  MESOCYCLE_TEMPLATES,
  PERIODIZATION_PHASES,
  calculateSessionLoad,
  getRacePredictions,
  getSwimPredictions,
  detectDeloadNeed,
  type TrainingSession,
  type TrainingMetrics,
} from '@/lib/athletic-performance'

interface Props {
  initialSessions: TrainingSession[]
  initialMetrics: TrainingMetrics
}

const TABS = ['Dashboard', 'Log', 'Predictor', 'Planner'] as const
type Tab = (typeof TABS)[number]

const WORKOUT_TYPES = [
  { id: 'recovery', label: 'Recovery', color: 'text-blue-400' },
  { id: 'easy', label: 'Easy', color: 'text-green-400' },
  { id: 'moderate', label: 'Moderate', color: 'text-yellow-400' },
  { id: 'hard', label: 'Hard', color: 'text-orange-400' },
  { id: 'race', label: 'Race', color: 'text-red-400' },
] as const

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

const STATUS_CONFIG = {
  fresh: { label: 'Fresh', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', desc: 'TSB > 25 — Rested and ready to perform.' },
  optimal: { label: 'Optimal', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', desc: 'TSB 0–25 — Good balance of fitness and fatigue.' },
  tired: { label: 'Tired', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', desc: 'TSB –25–0 — Accumulated fatigue; ease off.' },
  overreached: { label: 'Overreached', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', desc: 'TSB < –25 — High fatigue; deload recommended.' },
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
        active ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface'
      }`}
    >
      {children}
    </button>
  )
}

function MetricCard({ label, value, sub, color = 'text-primary' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
      <p className="text-xs text-text-secondary mt-1">{label}</p>
    </div>
  )
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab({ sessions, metrics }: { sessions: TrainingSession[]; metrics: TrainingMetrics }) {
  const status = STATUS_CONFIG[metrics.trainingStatus]
  const deload = detectDeloadNeed(sessions)

  // Weekly load for bar chart
  const weeklyLoad = useMemo(() => {
    const weeks: Record<string, number> = {}
    for (const s of sessions) {
      const d = new Date(s.date)
      const monday = new Date(d)
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      const key = monday.toISOString().slice(0, 10)
      weeks[key] = (weeks[key] ?? 0) + (s.sessionLoad ?? calculateSessionLoad(s.durationMin, s.rpe))
    }
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, load]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        load,
      }))
  }, [sessions])

  return (
    <div className="space-y-6">
      {/* Status badge */}
      <div className={`rounded-2xl border p-5 ${status.bg} ${status.border}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-secondary mb-1 uppercase tracking-wide">Training Status</p>
            <p className={`text-2xl font-bold ${status.text}`}>{status.label}</p>
            <p className="text-sm text-text-secondary mt-1">{status.desc}</p>
          </div>
          <div className="text-4xl">🏆</div>
        </div>
      </div>

      {/* Deload alert */}
      {deload.needed && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex gap-3 items-start">
          <span className="text-xl mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold text-yellow-400 text-sm">Deload Recommended</p>
            <p className="text-xs text-text-secondary mt-0.5">{deload.reason}</p>
          </div>
        </div>
      )}

      {/* ATL / CTL / TSB metrics */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="ATL (Fatigue)" value={metrics.atl} sub="7-day" color="text-red-400" />
        <MetricCard label="CTL (Fitness)" value={metrics.ctl} sub="42-day" color="text-green-400" />
        <MetricCard
          label="TSB (Form)"
          value={metrics.tsb}
          sub={metrics.tsb >= 0 ? 'Positive' : 'Negative'}
          color={metrics.tsb >= 0 ? 'text-blue-400' : 'text-orange-400'}
        />
      </div>

      {/* ATL/CTL/TSB 30-day line chart */}
      {metrics.atlHistory.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">30-Day ATL / CTL / TSB</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics.atlHistory} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                interval={5}
              />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => new Date(v as string).toLocaleDateString()} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="atl" stroke="#f87171" strokeWidth={1.5} dot={false} name="ATL" />
              <Line type="monotone" dataKey="ctl" stroke="#4ade80" strokeWidth={1.5} dot={false} name="CTL" />
              <Line type="monotone" dataKey="tsb" stroke="#60a5fa" strokeWidth={1.5} dot={false} name="TSB" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekly load bar chart */}
      {weeklyLoad.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">Weekly Training Load (sRPE)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyLoad} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="load" fill="var(--color-primary, #6366f1)" radius={[4, 4, 0, 0]} name="Load" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">Recent Sessions</p>
          <div className="space-y-2">
            {sessions.slice(0, 6).map((s, i) => {
              const sport = SPORTS.find((sp) => sp.id === s.sport)
              return (
                <div key={s.id ?? i} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{sport?.icon ?? '🏃'}</span>
                    <div>
                      <p className="font-medium text-text-primary">{sport?.name ?? s.sport}</p>
                      <p className="text-xs text-text-secondary">{s.date} · {s.durationMin} min · RPE {s.rpe}</p>
                    </div>
                  </div>
                  <span className="text-text-secondary font-mono text-xs">{s.sessionLoad ?? calculateSessionLoad(s.durationMin, s.rpe)} au</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="bg-surface rounded-2xl border border-border p-8 text-center text-text-secondary text-sm">
          No sessions yet. Head to the <strong>Log</strong> tab to record your first workout.
        </div>
      )}
    </div>
  )
}

// ── Log Tab ───────────────────────────────────────────────────────────────────
function LogTab({ onSessionLogged }: { onSessionLogged: () => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [sport, setSport] = useState('running')
  const [durationMin, setDurationMin] = useState(45)
  const [rpe, setRpe] = useState(6)
  const [workoutType, setWorkoutType] = useState<'easy' | 'moderate' | 'hard' | 'race' | 'recovery'>('moderate')
  const [hrAvg, setHrAvg] = useState('')
  const [hrMax, setHrMax] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [elevationM, setElevationM] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const previewLoad = calculateSessionLoad(durationMin, rpe)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/athletic-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          sport,
          durationMin,
          rpe,
          workoutType,
          heartRateAvg: hrAvg ? Number(hrAvg) : undefined,
          heartRateMax: hrMax ? Number(hrMax) : undefined,
          distanceKm: distanceKm ? Number(distanceKm) : undefined,
          elevationM: elevationM ? Number(elevationM) : undefined,
          notes: notes || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to save')
      }
      setSuccess(true)
      setNotes('')
      onSessionLogged()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save session')
    } finally {
      setSaving(false)
    }
  }

  const selectedSport = SPORTS.find((s) => s.id === sport)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {success && (
        <div className="rounded-2xl bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-400">
          ✓ Session logged! Load: {previewLoad} au
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">{error}</div>
      )}

      {/* Preview load */}
      <div className="bg-surface rounded-2xl border border-border p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary">Predicted Session Load (sRPE)</p>
          <p className="text-3xl font-bold text-primary">{previewLoad} <span className="text-base font-normal text-text-secondary">au</span></p>
        </div>
        <div className="text-right text-xs text-text-secondary">
          <p>{durationMin} min × RPE {rpe}</p>
          <p className="mt-1">{RPE_LABELS[rpe]}</p>
        </div>
      </div>

      {/* Sport grid */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-3">Sport</p>
        <div className="grid grid-cols-4 gap-2">
          {SPORTS.map((sp) => (
            <button
              key={sp.id}
              type="button"
              onClick={() => setSport(sp.id)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs transition-colors ${
                sport === sp.id
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-background border-border text-text-secondary hover:text-text-primary hover:border-border/80'
              }`}
            >
              <span className="text-xl">{sp.icon}</span>
              <span className="leading-tight text-center">{sp.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date & duration */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-2xl border border-border p-4">
          <label className="text-xs text-text-secondary block mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            className="w-full bg-transparent text-text-primary text-sm focus:outline-none"
            required
          />
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4">
          <label className="text-xs text-text-secondary block mb-1.5">Duration (min)</label>
          <input
            type="number"
            value={durationMin}
            onChange={(e) => setDurationMin(Math.max(1, Number(e.target.value)))}
            min={1}
            max={600}
            className="w-full bg-transparent text-text-primary text-sm focus:outline-none"
            required
          />
        </div>
      </div>

      {/* RPE slider */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-semibold text-text-primary">RPE (Borg CR10)</p>
          <span className="text-sm font-bold text-primary">{rpe} — {RPE_LABELS[rpe]}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={rpe}
          onChange={(e) => setRpe(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-text-secondary mt-1">
          <span>1 Easy</span>
          <span>5 Hard</span>
          <span>10 Max</span>
        </div>
      </div>

      {/* Workout type */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-3">Workout Type</p>
        <div className="flex gap-2 flex-wrap">
          {WORKOUT_TYPES.map((wt) => (
            <button
              key={wt.id}
              type="button"
              onClick={() => setWorkoutType(wt.id as typeof workoutType)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                workoutType === wt.id
                  ? `bg-primary/10 border-primary/40 ${wt.color}`
                  : 'bg-background border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {wt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Optional fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-2xl border border-border p-4">
          <label className="text-xs text-text-secondary block mb-1.5">Avg HR (bpm)</label>
          <input
            type="number"
            value={hrAvg}
            onChange={(e) => setHrAvg(e.target.value)}
            placeholder="—"
            min={40}
            max={220}
            className="w-full bg-transparent text-text-primary text-sm focus:outline-none placeholder:text-text-secondary"
          />
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4">
          <label className="text-xs text-text-secondary block mb-1.5">Max HR (bpm)</label>
          <input
            type="number"
            value={hrMax}
            onChange={(e) => setHrMax(e.target.value)}
            placeholder="—"
            min={40}
            max={220}
            className="w-full bg-transparent text-text-primary text-sm focus:outline-none placeholder:text-text-secondary"
          />
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4">
          <label className="text-xs text-text-secondary block mb-1.5">Distance (km)</label>
          <input
            type="number"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            placeholder="—"
            step="0.01"
            min={0}
            className="w-full bg-transparent text-text-primary text-sm focus:outline-none placeholder:text-text-secondary"
          />
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4">
          <label className="text-xs text-text-secondary block mb-1.5">Elevation (m)</label>
          <input
            type="number"
            value={elevationM}
            onChange={(e) => setElevationM(e.target.value)}
            placeholder="—"
            min={0}
            className="w-full bg-transparent text-text-primary text-sm focus:outline-none placeholder:text-text-secondary"
          />
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-4">
        <label className="text-xs text-text-secondary block mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel? Any niggles?"
          rows={3}
          className="w-full bg-transparent text-text-primary text-sm focus:outline-none resize-none placeholder:text-text-secondary"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-2xl bg-primary text-white font-semibold text-sm transition-opacity disabled:opacity-50"
      >
        {saving ? 'Saving…' : `Log ${selectedSport?.name ?? 'Session'} · ${previewLoad} au`}
      </button>
    </form>
  )
}

// ── Predictor Tab ─────────────────────────────────────────────────────────────
const DISTANCE_OPTIONS = [
  { label: '1 mile', km: 1.60934 },
  { label: '5K', km: 5 },
  { label: '10K', km: 10 },
  { label: 'Half Marathon', km: 21.0975 },
  { label: 'Marathon', km: 42.195 },
]

function parseTimeInput(input: string): number | null {
  // Accept mm:ss or h:mm:ss
  const parts = input.split(':').map(Number)
  if (parts.some(isNaN)) return null
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return null
}

function PredictorTab() {
  const [mode, setMode] = useState<'run' | 'swim'>('run')
  const [knownDistKm, setKnownDistKm] = useState(5)
  const [knownTimeStr, setKnownTimeStr] = useState('25:00')
  const [swimDistM, setSwimDistM] = useState(400)
  const [swimTimeStr, setSwimTimeStr] = useState('8:00')

  const knownTimeSec = parseTimeInput(knownTimeStr)
  const swimTimeSec = parseTimeInput(swimTimeStr)

  const runPredictions = knownTimeSec != null && knownDistKm > 0
    ? getRacePredictions(knownDistKm, knownTimeSec)
    : null

  const swimPredictions = swimTimeSec != null && swimDistM > 0
    ? getSwimPredictions(swimDistM, swimTimeSec)
    : null

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex gap-2 bg-surface rounded-2xl border border-border p-1">
        {(['run', 'swim'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              mode === m ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {m === 'run' ? '🏃 Running' : '🏊 Swimming'}
          </button>
        ))}
      </div>

      {/* Formula explanation */}
      <div className="bg-surface rounded-2xl border border-border p-4 text-xs text-text-secondary">
        <p className="font-semibold text-text-primary text-sm mb-1">Riegel Formula (1977)</p>
        <p>t₂ = t₁ × (d₂ / d₁)^1.06 — Predicts performance at a new distance based on a known effort. Most accurate within 2–3× distance range.</p>
      </div>

      {mode === 'run' ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-2xl border border-border p-4">
              <label className="text-xs text-text-secondary block mb-1.5">Known Distance</label>
              <select
                value={knownDistKm}
                onChange={(e) => setKnownDistKm(Number(e.target.value))}
                className="w-full bg-transparent text-text-primary text-sm focus:outline-none"
              >
                {DISTANCE_OPTIONS.map((d) => (
                  <option key={d.label} value={d.km}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="bg-surface rounded-2xl border border-border p-4">
              <label className="text-xs text-text-secondary block mb-1.5">Known Time (mm:ss or h:mm:ss)</label>
              <input
                type="text"
                value={knownTimeStr}
                onChange={(e) => setKnownTimeStr(e.target.value)}
                placeholder="25:00"
                className="w-full bg-transparent text-text-primary text-sm focus:outline-none placeholder:text-text-secondary"
              />
            </div>
          </div>

          {runPredictions && (
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-text-secondary text-xs font-medium">Distance</th>
                    <th className="text-right p-3 text-text-secondary text-xs font-medium">Predicted Time</th>
                    <th className="text-right p-3 text-text-secondary text-xs font-medium">Pace</th>
                  </tr>
                </thead>
                <tbody>
                  {runPredictions.map((p) => (
                    <tr key={p.distance} className="border-b border-border last:border-0 hover:bg-surface/80">
                      <td className="p-3 font-medium text-text-primary">{p.distance}</td>
                      <td className="p-3 text-right font-mono text-primary">{p.predictedFormatted}</td>
                      <td className="p-3 text-right text-text-secondary text-xs">{p.pace}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!runPredictions && (
            <p className="text-text-secondary text-sm text-center py-4">Enter a valid time (e.g. 25:00) to see predictions</p>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-2xl border border-border p-4">
              <label className="text-xs text-text-secondary block mb-1.5">Known Distance (m)</label>
              <select
                value={swimDistM}
                onChange={(e) => setSwimDistM(Number(e.target.value))}
                className="w-full bg-transparent text-text-primary text-sm focus:outline-none"
              >
                <option value={100}>100m</option>
                <option value={200}>200m</option>
                <option value={400}>400m</option>
                <option value={800}>800m</option>
                <option value={1500}>1500m</option>
              </select>
            </div>
            <div className="bg-surface rounded-2xl border border-border p-4">
              <label className="text-xs text-text-secondary block mb-1.5">Known Time (mm:ss)</label>
              <input
                type="text"
                value={swimTimeStr}
                onChange={(e) => setSwimTimeStr(e.target.value)}
                placeholder="8:00"
                className="w-full bg-transparent text-text-primary text-sm focus:outline-none placeholder:text-text-secondary"
              />
            </div>
          </div>

          {swimPredictions && (
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-text-secondary text-xs font-medium">Distance</th>
                    <th className="text-right p-3 text-text-secondary text-xs font-medium">Predicted Time</th>
                    <th className="text-right p-3 text-text-secondary text-xs font-medium">Pace</th>
                  </tr>
                </thead>
                <tbody>
                  {swimPredictions.map((p) => (
                    <tr key={p.distance} className="border-b border-border last:border-0 hover:bg-surface/80">
                      <td className="p-3 font-medium text-text-primary">{p.distance}</td>
                      <td className="p-3 text-right font-mono text-primary">{p.predictedFormatted}</td>
                      <td className="p-3 text-right text-text-secondary text-xs">{p.pacePer100m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!swimPredictions && (
            <p className="text-text-secondary text-sm text-center py-4">Enter a valid time (e.g. 8:00) to see predictions</p>
          )}
        </>
      )}
    </div>
  )
}

// ── Planner Tab ───────────────────────────────────────────────────────────────
function PlannerTab() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [openPhase, setOpenPhase] = useState<string | null>(null)

  const template = MESOCYCLE_TEMPLATES.find((t) => t.id === selectedTemplate)

  return (
    <div className="space-y-5">
      {/* Template cards */}
      <div>
        <p className="text-sm font-semibold text-text-primary mb-3">Mesocycle Templates</p>
        <div className="grid grid-cols-2 gap-3">
          {MESOCYCLE_TEMPLATES.map((t) => {
            const sport = SPORTS.find((s) => s.id === t.sport)
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id === selectedTemplate ? null : t.id)}
                className={`text-left p-4 rounded-2xl border transition-colors ${
                  selectedTemplate === t.id
                    ? 'bg-primary/10 border-primary/40'
                    : 'bg-surface border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{sport?.icon ?? '🏅'}</span>
                  <p className="font-semibold text-text-primary text-sm">{t.name}</p>
                </div>
                <p className="text-xs text-text-secondary">{t.weeks} weeks · {sport?.name ?? t.sport}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Week-by-week plan */}
      {template && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <p className="font-semibold text-text-primary">{template.name} — Week-by-Week Plan</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-text-secondary text-xs font-medium">Week</th>
                <th className="text-left p-3 text-text-secondary text-xs font-medium">Focus</th>
                <th className="text-right p-3 text-text-secondary text-xs font-medium">Intensity</th>
                <th className="text-right p-3 text-text-secondary text-xs font-medium">Volume</th>
              </tr>
            </thead>
            <tbody>
              {template.phases.map((phase) => (
                <tr key={phase.week} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium text-text-primary">W{phase.week}</td>
                  <td className="p-3 text-text-secondary">{phase.focus}</td>
                  <td className="p-3 text-right">
                    <span className={`font-mono text-xs ${phase.intensityPct >= 85 ? 'text-red-400' : phase.intensityPct >= 70 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {phase.intensityPct}%
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className={`font-mono text-xs ${phase.volumePct >= 85 ? 'text-orange-400' : phase.volumePct >= 65 ? 'text-yellow-400' : 'text-blue-400'}`}>
                      {phase.volumePct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Periodization phases accordion */}
      <div>
        <p className="text-sm font-semibold text-text-primary mb-3">Periodization Phases</p>
        <div className="space-y-2">
          {PERIODIZATION_PHASES.map((phase) => (
            <div key={phase.id} className="bg-surface rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => setOpenPhase(openPhase === phase.id ? null : phase.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div>
                  <p className="font-medium text-text-primary text-sm">{phase.name}</p>
                  <p className="text-xs text-text-secondary">{phase.typicalDurationWeeks}</p>
                </div>
                <span className="text-text-secondary text-sm">{openPhase === phase.id ? '▲' : '▼'}</span>
              </button>
              {openPhase === phase.id && (
                <div className="px-4 pb-4 space-y-2">
                  <p className="text-sm text-text-secondary">{phase.description}</p>
                  <ul className="space-y-1">
                    {phase.keyCharacteristics.map((c) => (
                      <li key={c} className="text-xs text-text-secondary flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function AthleticPerformanceClient({ initialSessions, initialMetrics }: Props) {
  const [tab, setTab] = useState<Tab>('Dashboard')
  const [sessions, setSessions] = useState(initialSessions)
  const [metrics] = useState(initialMetrics)

  async function refreshSessions() {
    try {
      const res = await fetch('/api/athletic-performance')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions ?? [])
      }
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 bg-surface rounded-2xl border border-border p-1">
        {TABS.map((t) => (
          <TabButton key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </TabButton>
        ))}
      </div>

      {tab === 'Dashboard' && <DashboardTab sessions={sessions} metrics={metrics} />}
      {tab === 'Log' && <LogTab onSessionLogged={refreshSessions} />}
      {tab === 'Predictor' && <PredictorTab />}
      {tab === 'Planner' && <PlannerTab />}
    </div>
  )
}
