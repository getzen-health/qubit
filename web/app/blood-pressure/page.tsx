'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, Minus, Plus, Heart } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import {
  classifyBP,
  calculateBPStats,
  dashScore,
  LIFESTYLE_BP_IMPACT,
  type BPStats,
  type DASHIntake,
} from '@/lib/blood-pressure'

interface DBReading {
  id: string
  systolic: number
  diastolic: number
  pulse: number | null
  arm: string
  time_of_day: string
  notes: string | null
  measured_at: string
}

const TIME_OPTIONS = ['morning', 'midday', 'evening', 'night'] as const
const ARM_OPTIONS = ['left', 'right'] as const

const DASH_DEFAULTS: DASHIntake = {
  fruits_servings: 0,
  vegetables_servings: 0,
  whole_grains_servings: 0,
  low_fat_dairy: 0,
  nuts_legumes_week: 0,
  sodium_mg: 2300,
  alcohol_drinks: 0,
}

const PIE_COLORS: Record<string, string> = {
  Normal: '#22c55e',
  Elevated: '#eab308',
  'Stage 1': '#f97316',
  'Stage 2': '#ef4444',
  Crisis: '#b91c1c',
}

export default function BloodPressurePage() {
  const [tab, setTab] = useState<'log' | 'trends' | 'dash'>('log')
  const [readings, setReadings] = useState<DBReading[]>([])
  const [stats, setStats] = useState<BPStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Log form state
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [pulse, setPulse] = useState('')
  const [arm, setArm] = useState<'left' | 'right'>('left')
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'midday' | 'evening' | 'night'>('morning')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [lastClassification, setLastClassification] = useState<ReturnType<typeof classifyBP> | null>(null)

  // DASH state
  const [dashIntake, setDashIntake] = useState<DASHIntake>(DASH_DEFAULTS)

  const fetchReadings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/blood-pressure')
      if (res.ok) {
        const json = await res.json()
        setReadings(json.data ?? [])
        setStats(json.stats ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReadings() }, [fetchReadings])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const sys = Number(systolic)
    const dia = Number(diastolic)
    if (!sys || !dia) { setFormError('Enter systolic and diastolic values'); return }

    setSubmitting(true)
    setFormError('')
    const res = await fetch('/api/blood-pressure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systolic: sys,
        diastolic: dia,
        pulse: pulse ? Number(pulse) : null,
        arm,
        time_of_day: timeOfDay,
        notes: notes || null,
      }),
    })
    if (res.ok) {
      setLastClassification(classifyBP(sys, dia))
      setSystolic('')
      setDiastolic('')
      setPulse('')
      setNotes('')
      await fetchReadings()
    } else {
      const data = await res.json()
      setFormError(data.error || 'Failed to save reading')
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/blood-pressure?id=${id}`, { method: 'DELETE' })
    await fetchReadings()
  }

  // Live classification as user types
  const liveClass =
    systolic && diastolic ? classifyBP(Number(systolic), Number(diastolic)) : null

  // Trend chart data (oldest first)
  const chartData = [...readings]
    .reverse()
    .map((r) => ({
      date: r.measured_at.split('T')[0].slice(5),
      sys: r.systolic,
      dia: r.diastolic,
    }))

  // Distribution for pie chart
  const distribution = readings.reduce<Record<string, number>>((acc, r) => {
    const cat = classifyBP(r.systolic, r.diastolic).category
    acc[cat] = (acc[cat] ?? 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(distribution).map(([name, value]) => ({ name, value }))

  const dashResult = dashScore(dashIntake)

  function dashStep(field: keyof DASHIntake, delta: number, max: number) {
    setDashIntake((prev) => ({
      ...prev,
      [field]: Math.max(0, Math.min(max, (prev[field] as number) + delta)),
    }))
  }

  const trendIcon =
    stats?.trend_7d === 'improving' ? (
      <TrendingDown className="w-4 h-4 text-green-500" />
    ) : stats?.trend_7d === 'worsening' ? (
      <TrendingUp className="w-4 h-4 text-red-500" />
    ) : (
      <Minus className="w-4 h-4 text-text-secondary" />
    )

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Blood Pressure</h1>
              <p className="text-xs text-text-secondary">AHA 2018 classification</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-0 flex gap-1">
          {(['log', 'trends', 'dash'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize ${
                tab === t
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t === 'dash' ? 'DASH Guide' : t === 'log' ? 'Log' : 'Trends'}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-4">
        {/* ── LOG TAB ── */}
        {tab === 'log' && (
          <>
            {/* Stats summary */}
            {stats && stats.overall_avg && (
              <div className={`rounded-2xl border p-4 ${stats.classification.bgColor}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{stats.classification.description}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full border font-medium">
                    {stats.classification.category}
                  </span>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-2xl font-bold">
                      {stats.overall_avg.systolic}/{stats.overall_avg.diastolic}
                    </p>
                    <p className="text-xs opacity-70">30-day avg (mmHg)</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1">
                      {trendIcon} {stats.trend_7d}
                    </p>
                    <p className="text-xs opacity-70">7-day trend</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">MAP {stats.map}</p>
                    <p className="text-xs opacity-70">mmHg</p>
                  </div>
                </div>
                <p className="text-xs mt-2 opacity-80">{stats.classification.action}</p>
              </div>
            )}

            {/* Entry form */}
            <div className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="font-semibold text-text-primary mb-4">Log Reading</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* SYS / DIA inputs */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-text-secondary block mb-1">Systolic (SYS)</label>
                    <input
                      type="number"
                      min={60}
                      max={300}
                      required
                      placeholder="120"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className="w-full text-2xl font-bold text-center py-3 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center pt-5 text-text-secondary font-bold">/</div>
                  <div className="flex-1">
                    <label className="text-xs text-text-secondary block mb-1">Diastolic (DIA)</label>
                    <input
                      type="number"
                      min={40}
                      max={200}
                      required
                      placeholder="80"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      className="w-full text-2xl font-bold text-center py-3 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-text-secondary block mb-1">Pulse (opt)</label>
                    <input
                      type="number"
                      min={30}
                      max={250}
                      placeholder="72"
                      value={pulse}
                      onChange={(e) => setPulse(e.target.value)}
                      className="w-full text-2xl font-bold text-center py-3 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Live classification badge */}
                {liveClass && (
                  <div className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${liveClass.bgColor}`}>
                    <span className="text-sm font-semibold">{liveClass.description}</span>
                    <span className="text-xs opacity-80">— {liveClass.action}</span>
                  </div>
                )}

                {/* Crisis alert */}
                {liveClass?.seek_care && (
                  <div className="rounded-xl bg-red-600/20 border border-red-600/40 p-3 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-red-400">⚠️ Seek emergency care immediately</p>
                      <p className="text-xs text-red-400/80 mt-0.5">
                        BP {systolic}/{diastolic} is in the Hypertensive Crisis range. Call emergency services.
                      </p>
                    </div>
                  </div>
                )}

                {/* Time of day + Arm toggles */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">Time of Day</label>
                    <div className="grid grid-cols-2 gap-1">
                      {TIME_OPTIONS.map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setTimeOfDay(t)}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-colors capitalize border ${
                            timeOfDay === t
                              ? 'bg-primary/20 border-primary/40 text-primary'
                              : 'bg-surface border-border text-text-secondary'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">Arm</label>
                    <div className="grid grid-cols-2 gap-1">
                      {ARM_OPTIONS.map((a) => (
                        <button
                          type="button"
                          key={a}
                          onClick={() => setArm(a)}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-colors capitalize border ${
                            arm === a
                              ? 'bg-primary/20 border-primary/40 text-primary'
                              : 'bg-surface border-border text-text-secondary'
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-text-primary text-sm focus:outline-none focus:border-primary"
                />

                {formError && <p className="text-sm text-red-400">{formError}</p>}
                {lastClassification && !formError && (
                  <p className="text-sm text-green-400">
                    ✓ Saved — {lastClassification.description}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : 'Log Reading'}
                </button>
              </form>
            </div>

            {/* Last 7 readings */}
            {readings.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-4">
                <h3 className="font-semibold text-text-primary mb-3">Recent Readings</h3>
                <div className="space-y-2">
                  {readings.slice(0, 7).map((r) => {
                    const cls = classifyBP(r.systolic, r.diastolic)
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
                      >
                        <div>
                          <p className="font-mono font-bold text-text-primary">
                            {r.systolic}/{r.diastolic}
                            {r.pulse && (
                              <span className="text-text-secondary font-normal ml-1">
                                ♥ {r.pulse}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-text-secondary capitalize">
                            {r.time_of_day} · {r.arm} arm ·{' '}
                            {new Date(r.measured_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls.bgColor}`}
                          >
                            {cls.category}
                          </span>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="text-text-secondary hover:text-red-400 text-xs transition-colors"
                            aria-label="Delete"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {!loading && readings.length === 0 && (
              <div className="rounded-2xl border border-border bg-surface p-8 text-center text-text-secondary">
                <p className="text-3xl mb-2">❤️</p>
                <p className="font-medium text-text-primary">No readings yet</p>
                <p className="text-sm mt-1">Log your first reading above.</p>
              </div>
            )}
          </>
        )}

        {/* ── TRENDS TAB ── */}
        {tab === 'trends' && (
          <>
            {readings.length < 2 ? (
              <div className="rounded-2xl border border-border bg-surface p-8 text-center text-text-secondary">
                <p className="text-3xl mb-2">📈</p>
                <p className="font-medium text-text-primary">Not enough data</p>
                <p className="text-sm mt-1">Log at least 2 readings to see trends.</p>
              </div>
            ) : (
              <>
                {/* 30-day dual line chart */}
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <h3 className="font-semibold text-text-primary mb-4">30-Day Trend</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                      <YAxis domain={[50, 200]} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      {/* AHA reference lines */}
                      <ReferenceLine y={120} stroke="#eab308" strokeDasharray="4 4" label={{ value: '120', position: 'right', fontSize: 9, fill: '#eab308' }} />
                      <ReferenceLine y={80} stroke="#eab308" strokeDasharray="4 4" label={{ value: '80', position: 'right', fontSize: 9, fill: '#eab308' }} />
                      <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '140', position: 'right', fontSize: 9, fill: '#ef4444' }} />
                      <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '90', position: 'right', fontSize: 9, fill: '#ef4444' }} />
                      <Line type="monotone" dataKey="sys" stroke="#ef4444" strokeWidth={2} dot={false} name="Systolic" />
                      <Line type="monotone" dataKey="dia" stroke="#3b82f6" strokeWidth={2} dot={false} name="Diastolic" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2 text-xs text-text-secondary justify-center">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" /> Systolic</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> Diastolic</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-500 inline-block border-dashed" /> 120/80</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block" /> 140/90</span>
                  </div>
                </div>

                {/* Morning vs Evening averages */}
                {stats && (stats.morning_avg || stats.evening_avg) && (
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <h3 className="font-semibold text-text-primary mb-3">Morning vs Evening</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {stats.morning_avg && (
                        <div className="rounded-xl border border-border p-3 text-center">
                          <p className="text-xs text-text-secondary mb-1">🌅 Morning avg</p>
                          <p className="text-xl font-bold text-text-primary">
                            {stats.morning_avg.systolic}/{stats.morning_avg.diastolic}
                          </p>
                          <span className={`text-xs ${classifyBP(stats.morning_avg.systolic, stats.morning_avg.diastolic).color}`}>
                            {classifyBP(stats.morning_avg.systolic, stats.morning_avg.diastolic).category}
                          </span>
                        </div>
                      )}
                      {stats.evening_avg && (
                        <div className="rounded-xl border border-border p-3 text-center">
                          <p className="text-xs text-text-secondary mb-1">🌆 Evening avg</p>
                          <p className="text-xl font-bold text-text-primary">
                            {stats.evening_avg.systolic}/{stats.evening_avg.diastolic}
                          </p>
                          <span className={`text-xs ${classifyBP(stats.evening_avg.systolic, stats.evening_avg.diastolic).color}`}>
                            {classifyBP(stats.evening_avg.systolic, stats.evening_avg.diastolic).category}
                          </span>
                        </div>
                      )}
                    </div>
                    {stats.morning_avg && stats.evening_avg &&
                      stats.morning_avg.systolic - stats.evening_avg.systolic > 10 && (
                        <p className="text-xs text-text-secondary mt-3 p-2 rounded-lg bg-surface border border-border">
                          💡 <strong>Note:</strong> Morning readings are consistently higher. This can indicate white-coat effect or
                          early morning BP surge — discuss with your doctor.
                        </p>
                      )}
                  </div>
                )}

                {/* Distribution pie */}
                {pieData.length > 0 && (
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <h3 className="font-semibold text-text-primary mb-3">Classification Distribution</h3>
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60}>
                            {pieData.map((entry) => (
                              <Cell key={entry.name} fill={PIE_COLORS[entry.name] ?? '#6b7280'} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1.5">
                        {pieData.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-2 text-sm">
                            <span
                              className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                              style={{ background: PIE_COLORS[entry.name] ?? '#6b7280' }}
                            />
                            <span className="text-text-primary">{entry.name}</span>
                            <span className="text-text-secondary ml-auto">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pulse pressure */}
                {stats && (
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <h3 className="font-semibold text-text-primary mb-2">Additional Metrics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border p-3">
                        <p className="text-xs text-text-secondary">Pulse Pressure</p>
                        <p className={`text-xl font-bold ${stats.pulse_pressure > 40 ? 'text-orange-400' : 'text-text-primary'}`}>
                          {stats.pulse_pressure} mmHg
                        </p>
                        <p className="text-xs text-text-secondary">
                          {stats.pulse_pressure > 40 ? '⚠️ Widened (>40)' : 'Normal (<40)'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-3">
                        <p className="text-xs text-text-secondary">Mean Arterial Pressure</p>
                        <p className="text-xl font-bold text-text-primary">{stats.map} mmHg</p>
                        <p className="text-xs text-text-secondary">
                          {stats.map < 70 ? '⚠️ Low (<70)' : stats.map > 100 ? '⚠️ High (>100)' : 'Normal (70–100)'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── DASH GUIDE TAB ── */}
        {tab === 'dash' && (
          <>
            {/* DASH score */}
            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-text-primary">DASH Compliance Score</h2>
                <span
                  className={`text-2xl font-bold ${
                    dashResult.grade === 'A'
                      ? 'text-green-400'
                      : dashResult.grade === 'B'
                      ? 'text-lime-400'
                      : dashResult.grade === 'C'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {dashResult.grade}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 transition-all"
                    style={{ width: `${dashResult.score}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-text-primary">{dashResult.score}/100</span>
              </div>
              <p className="text-xs text-text-secondary">
                DASH diet can reduce systolic BP by 8–14 mmHg (Sacks et al., NEJM 1997)
              </p>
            </div>

            {/* Food group tracker */}
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <h3 className="font-semibold text-text-primary">Today's Food Groups</h3>
              {[
                { key: 'fruits_servings', label: '🍎 Fruits', unit: 'servings', target: '4–5/day', max: 10 },
                { key: 'vegetables_servings', label: '🥦 Vegetables', unit: 'servings', target: '4–5/day', max: 10 },
                { key: 'whole_grains_servings', label: '🌾 Whole Grains', unit: 'servings', target: '6–8/day', max: 15 },
                { key: 'low_fat_dairy', label: '🥛 Low-fat Dairy', unit: 'servings', target: '2–3/day', max: 8 },
                { key: 'nuts_legumes_week', label: '🥜 Nuts/Legumes', unit: '/week', target: '4–5/week', max: 14 },
              ].map(({ key, label, unit, target, max }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-text-primary">{label}</p>
                    <p className="text-xs text-text-secondary">Target: {target}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => dashStep(key as keyof DASHIntake, -1, max)}
                      className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-surface transition-colors"
                    >
                      <Minus className="w-3 h-3 text-text-secondary" />
                    </button>
                    <span className="w-8 text-center font-bold text-text-primary">
                      {dashIntake[key as keyof DASHIntake]}
                    </span>
                    <button
                      onClick={() => dashStep(key as keyof DASHIntake, 1, max)}
                      className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-surface transition-colors"
                    >
                      <Plus className="w-3 h-3 text-text-secondary" />
                    </button>
                    <span className="text-xs text-text-secondary w-12">{unit}</span>
                  </div>
                </div>
              ))}

              {/* Sodium */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm text-text-primary">🧂 Sodium</p>
                  <p className="text-xs text-text-secondary">Target: &lt;2300 mg/day (ideal &lt;1500)</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={6000}
                  value={dashIntake.sodium_mg}
                  onChange={(e) => setDashIntake((p) => ({ ...p, sodium_mg: Number(e.target.value) }))}
                  className="w-24 text-center py-1.5 rounded-lg border border-border bg-background text-text-primary text-sm focus:outline-none focus:border-primary"
                />
                <span className="text-xs text-text-secondary">mg</span>
              </div>

              {/* Alcohol */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm text-text-primary">🍷 Alcohol</p>
                  <p className="text-xs text-text-secondary">Target: ≤1–2 drinks/day</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dashStep('alcohol_drinks', -1, 20)}
                    className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-surface transition-colors"
                  >
                    <Minus className="w-3 h-3 text-text-secondary" />
                  </button>
                  <span className="w-8 text-center font-bold text-text-primary">
                    {dashIntake.alcohol_drinks}
                  </span>
                  <button
                    onClick={() => dashStep('alcohol_drinks', 1, 20)}
                    className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-surface transition-colors"
                  >
                    <Plus className="w-3 h-3 text-text-secondary" />
                  </button>
                  <span className="text-xs text-text-secondary w-12">drinks</span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {dashResult.recommendations.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-4">
                <h3 className="font-semibold text-text-primary mb-2">Recommendations</h3>
                <ul className="space-y-1.5">
                  {dashResult.recommendations.map((rec) => (
                    <li key={rec} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-primary mt-0.5">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lifestyle impact table */}
            <div className="rounded-2xl border border-border bg-surface p-4">
              <h3 className="font-semibold text-text-primary mb-3">Lifestyle Impact on Blood Pressure</h3>
              <div className="space-y-2">
                {LIFESTYLE_BP_IMPACT.map((item) => (
                  <div key={item.factor} className="flex items-start justify-between gap-2 py-1.5 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary">{item.factor}</p>
                      <p className="text-xs text-text-secondary">{item.evidence}</p>
                    </div>
                    <span className="text-sm font-semibold text-green-400 whitespace-nowrap">
                      {item.reduction_mmhg}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Link to DASH guide */}
            <a
              href="https://www.nhlbi.nih.gov/education/dash-eating-plan"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-primary/30 bg-primary/10 p-4 text-center"
            >
              <p className="text-sm font-semibold text-primary">📖 Full DASH Eating Plan Guide →</p>
              <p className="text-xs text-text-secondary mt-0.5">NHLBI — National Heart, Lung, and Blood Institute</p>
            </a>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

