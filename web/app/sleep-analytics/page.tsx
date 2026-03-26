'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, BedDouble, Brain, Coffee, Moon, Clock, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'
import {
  calculatePSQI,
  caffeineClearanceTime,
  sleepPressure,
  buildWindDownRoutine,
  PSQI_COMPONENT_LABELS,
  type PSQIAnswers,
  type PSQIResult,
  type WindDownStep,
  type SleepDebtResult,
} from '@/lib/sleep-analytics'

// ─── Types ─────────────────────────────────────────────────────────────────

interface SleepLog {
  date: string
  hours: number
}

interface Assessment {
  id: string
  assessed_at: string
  psqi_global_score: number
  psqi_components: Record<string, number> | null
  sleep_efficiency_pct: number | null
}

interface ApiData {
  sleep_logs: SleepLog[]
  debt: SleepDebtResult
  assessments: Assessment[]
  target_hours: number
}

// ─── Tooltip style ─────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Caffeine sources ──────────────────────────────────────────────────────

const CAFFEINE_SOURCES = [
  { label: 'Espresso (1 shot)', mg: 75 },
  { label: 'Drip coffee (8 oz)', mg: 150 },
  { label: 'Cold brew (8 oz)', mg: 200 },
  { label: 'Black tea (8 oz)', mg: 50 },
  { label: 'Green tea (8 oz)', mg: 30 },
  { label: 'Energy drink (16 oz)', mg: 160 },
  { label: 'Pre-workout (1 scoop)', mg: 200 },
  { label: 'Diet cola (12 oz)', mg: 45 },
]

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function nowHHMM(): string {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

function hoursAwakeSince(wakeTime: string): number {
  const [wh, wm] = wakeTime.split(':').map(Number)
  const now = new Date()
  const wakeMs = new Date().setHours(wh, wm || 0, 0, 0)
  return Math.max(0, (now.getTime() - wakeMs) / 3_600_000)
}

// ─── Gauge ring ────────────────────────────────────────────────────────────

function DebtGauge({ debt }: { debt: number }) {
  const maxDebt = 10
  const pct = Math.min(1, debt / maxDebt)
  const color = debt < 2 ? '#22c55e' : debt < 4 ? '#eab308' : '#ef4444'
  const r = 54
  const circ = 2 * Math.PI * r
  const dash = circ * pct

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--color-border,#333)" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor">
          {debt.toFixed(1)}h
        </text>
        <text x="70" y="82" textAnchor="middle" fontSize="11" fill="var(--color-text-secondary,#888)">
          owed
        </text>
      </svg>
    </div>
  )
}

// ─── PSQI form default state ───────────────────────────────────────────────

const DEFAULT_PSQI: PSQIAnswers = {
  usual_bedtime: '23:00',
  sleep_latency_min: 15,
  usual_wake_time: '07:00',
  actual_sleep_hours: 7,
  disturbances: {
    cannot_sleep_30min: 0,
    wake_night_bathroom: 0,
    bad_dreams: 0,
    pain_discomfort: 0,
    other: 0,
  },
  sleep_medication: 0,
  daytime_dysfunction: {
    trouble_staying_awake: 0,
    enthusiasm_problems: 0,
  },
  subjective_quality: 1,
}

const FREQ_LABELS = ['Never', '< 1×/wk', '1–2×/wk', '≥ 3×/wk']
const QUALITY_LABELS = ['Very good', 'Fairly good', 'Fairly bad', 'Very bad']

// ─── Main component ────────────────────────────────────────────────────────

export default function SleepAnalyticsPage() {
  const [tab, setTab] = useState<'overview' | 'psqi' | 'caffeine' | 'winddown'>('overview')
  const [apiData, setApiData] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)

  // PSQI form
  const [psqiForm, setPsqiForm] = useState<PSQIAnswers>(DEFAULT_PSQI)
  const [psqiResult, setPsqiResult] = useState<PSQIResult | null>(null)
  const [psqiSaving, setPsqiSaving] = useState(false)
  const [psqiSaved, setPsqiSaved] = useState(false)

  // Caffeine
  const [caffEntries, setCaffEntries] = useState<{ mg: number; time: string; label: string }[]>([])
  const [newCaffMg, setNewCaffMg] = useState(75)
  const [newCaffTime, setNewCaffTime] = useState(nowHHMM)
  const [newCaffLabel, setNewCaffLabel] = useState('Espresso (1 shot)')

  // Wind-down
  const [targetBedtime, setTargetBedtime] = useState('23:00')
  const [chronotype, setChronotype] = useState('bear')
  const [windDownSteps, setWindDownSteps] = useState<WindDownStep[]>([])
  const [wakeTime, setWakeTime] = useState('07:00')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/sleep-analytics')
      if (res.ok) {
        const json = await res.json()
        setApiData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setWindDownSteps(buildWindDownRoutine(chronotype, targetBedtime))
  }, [chronotype, targetBedtime])

  // ── PSQI submit ────────────────────────────────────────────────────────

  function computePSQI() {
    const result = calculatePSQI(psqiForm)
    setPsqiResult(result)
  }

  async function savePSQI() {
    if (!psqiResult) return
    setPsqiSaving(true)
    try {
      await fetch('/api/sleep-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psqi_global_score: psqiResult.global_score,
          psqi_answers: psqiForm,
          psqi_components: psqiResult.component_scores,
          sleep_efficiency_pct: psqiResult.sleep_efficiency_pct,
        }),
      })
      setPsqiSaved(true)
      fetchData()
      setTimeout(() => setPsqiSaved(false), 3000)
    } finally {
      setPsqiSaving(false)
    }
  }

  // ── Caffeine summary ───────────────────────────────────────────────────

  const totalCaffeine = caffEntries.reduce((s, e) => s + e.mg, 0)
  const latestEntry = caffEntries.at(-1)
  const caffeineInfo =
    latestEntry && totalCaffeine > 0
      ? caffeineClearanceTime(totalCaffeine, latestEntry.time)
      : null

  // Build caffeine curve (next 12 h from latest entry or now)
  const caffeineChartData = (() => {
    const HALF_LIFE = 5.5
    const startH = latestEntry ? parseInt(latestEntry.time.split(':')[0]) : new Date().getHours()
    return Array.from({ length: 13 }, (_, i) => ({
      hour: `${(startH + i) % 24}:00`,
      mg: Math.round(totalCaffeine * Math.pow(0.5, i / HALF_LIFE)),
    }))
  })()

  // ── Sleep pressure from wake time ──────────────────────────────────────

  const hoursAwake = hoursAwakeSince(wakeTime)
  const pressure = sleepPressure(hoursAwake)

  // ── Overview chart data ────────────────────────────────────────────────

  const chartLogs = apiData
    ? apiData.sleep_logs.slice(-14).map((l) => ({
        date: fmtDate(l.date),
        hours: parseFloat(l.hours.toFixed(1)),
        target: apiData.target_hours,
      }))
    : []

  const psqiTrend = apiData
    ? apiData.assessments.slice().reverse().map((a) => ({
        date: fmtDate(a.assessed_at),
        score: a.psqi_global_score,
      }))
    : []

  const impairmentColor = {
    None: 'text-green-400',
    Mild: 'text-yellow-400',
    Moderate: 'text-orange-400',
    Severe: 'text-red-400',
  }

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/sleep" className="p-2 rounded-lg hover:bg-surface transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <BedDouble className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-text-primary">Sleep Analytics+</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-surface rounded-xl p-1 overflow-x-auto">
          {(
            [
              { key: 'overview', label: 'Overview', icon: Moon },
              { key: 'psqi', label: 'PSQI', icon: Brain },
              { key: 'caffeine', label: 'Caffeine', icon: Coffee },
              { key: 'winddown', label: 'Wind-Down', icon: Clock },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex-1 min-w-max flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                tab === key
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        {/* ── OVERVIEW TAB ──────────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Debt gauge */}
                <div className="bg-surface border border-border rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wide">
                    7-Day Sleep Debt
                  </h2>
                  <div className="flex items-center justify-between gap-6">
                    <DebtGauge debt={apiData?.debt.rolling_7day_debt ?? 0} />
                    <div className="flex-1 space-y-2 text-sm">
                      <p className="text-text-primary">
                        {apiData?.debt.recovery_plan ?? 'No data yet'}
                      </p>
                      <p className="text-text-secondary">
                        Cognitive:{' '}
                        <span
                          className={cn(
                            'font-semibold',
                            impairmentColor[
                              apiData?.debt.cognitive_impairment_level ?? 'None'
                            ]
                          )}
                        >
                          {apiData?.debt.cognitive_impairment_level ?? '–'}
                        </span>
                      </p>
                      <p className="text-xs text-text-secondary">
                        Cumulative:{' '}
                        <span className="text-text-primary">
                          {apiData?.debt.cumulative_debt.toFixed(1) ?? '0'}h
                        </span>{' '}
                        (capped at 50 h)
                      </p>
                      <p className="text-xs text-text-secondary italic">
                        Van Dongen et al.: 6 h/night for 14 nights = 24 h total deprivation
                      </p>
                    </div>
                  </div>
                </div>

                {/* 14-day chart */}
                {chartLogs.length > 0 && (
                  <div className="bg-surface border border-border rounded-2xl p-5">
                    <h2 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wide">
                      14-Day Sleep (vs {apiData?.target_hours}h target)
                    </h2>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={chartLogs} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border,#333)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)' }}
                          interval={1}
                        />
                        <YAxis
                          domain={[0, 10]}
                          tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)' }}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(v: number) => [`${v}h`, 'Sleep']}
                        />
                        <ReferenceLine
                          y={apiData?.target_hours ?? 8}
                          stroke="#6366f1"
                          strokeDasharray="4 4"
                          label={{ value: 'Target', fill: '#6366f1', fontSize: 10 }}
                        />
                        <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                          {chartLogs.map((entry) => (
                            <Cell
                              key={entry.date}
                              fill={
                                entry.hours >= (apiData?.target_hours ?? 8)
                                  ? '#22c55e'
                                  : entry.hours >= 6
                                  ? '#eab308'
                                  : '#ef4444'
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* PSQI score trend */}
                {psqiTrend.length > 0 && (
                  <div className="bg-surface border border-border rounded-2xl p-5">
                    <h2 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wide">
                      PSQI Score Trend
                    </h2>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={psqiTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border,#333)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)' }} />
                        <YAxis domain={[0, 21]} tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)' }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <ReferenceLine y={5} stroke="#eab308" strokeDasharray="4 4" label={{ value: '>5=Poor', fill: '#eab308', fontSize: 10 }} />
                        <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Shortcut links */}
                {!apiData?.sleep_logs.length && (
                  <div className="bg-surface border border-border rounded-2xl p-5 text-center text-text-secondary text-sm">
                    No sleep logs yet.{' '}
                    <Link href="/sleep" className="text-primary underline">
                      Log sleep
                    </Link>{' '}
                    to see your analytics.
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── PSQI TAB ──────────────────────────────────────────────── */}
        {tab === 'psqi' && (
          <>
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-text-secondary">
                  Pittsburgh Sleep Quality Index (Buysse et al. 1989) — 7 components, global score 0–21.{' '}
                  <strong className="text-text-primary">Score ≤ 5 = Good</strong>,{' '}
                  <strong className="text-text-primary">&gt; 5 = Poor</strong>. Recommended monthly.
                </p>
              </div>

              {/* Bedtime / wake */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs text-text-secondary">
                  Usual bedtime
                  <input
                    type="time"
                    value={psqiForm.usual_bedtime}
                    onChange={(e) => setPsqiForm((f) => ({ ...f, usual_bedtime: e.target.value }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-text-secondary">
                  Usual wake time
                  <input
                    type="time"
                    value={psqiForm.usual_wake_time}
                    onChange={(e) => setPsqiForm((f) => ({ ...f, usual_wake_time: e.target.value }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  />
                </label>
              </div>

              {/* Latency + actual hours */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs text-text-secondary">
                  Minutes to fall asleep
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={psqiForm.sleep_latency_min}
                    onChange={(e) =>
                      setPsqiForm((f) => ({ ...f, sleep_latency_min: Number(e.target.value) }))
                    }
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-text-secondary">
                  Actual sleep hours
                  <input
                    type="number"
                    min={0}
                    max={16}
                    step={0.5}
                    value={psqiForm.actual_sleep_hours}
                    onChange={(e) =>
                      setPsqiForm((f) => ({ ...f, actual_sleep_hours: Number(e.target.value) }))
                    }
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  />
                </label>
              </div>

              {/* Subjective quality */}
              <div className="flex flex-col gap-1 text-xs text-text-secondary">
                <span>Overall sleep quality last month</span>
                <div className="flex gap-2 flex-wrap">
                  {QUALITY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => setPsqiForm((f) => ({ ...f, subjective_quality: i }))}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs border transition-colors',
                        psqiForm.subjective_quality === i
                          ? 'bg-primary border-primary text-white'
                          : 'border-border text-text-secondary hover:border-primary'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disturbances */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-secondary">
                  Disturbances (last month frequency)
                </p>
                {(
                  [
                    ['cannot_sleep_30min', 'Cannot fall asleep within 30 min'],
                    ['wake_night_bathroom', 'Wake up to use bathroom'],
                    ['bad_dreams', 'Bad dreams'],
                    ['pain_discomfort', 'Pain or discomfort'],
                    ['other', 'Other reasons'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-text-primary flex-1">{label}</span>
                    <div className="flex gap-1">
                      {FREQ_LABELS.map((fl, i) => (
                        <button
                          key={i}
                          onClick={() =>
                            setPsqiForm((f) => ({
                              ...f,
                              disturbances: { ...f.disturbances, [key]: i },
                            }))
                          }
                          className={cn(
                            'px-2 py-1 rounded text-xs border transition-colors',
                            psqiForm.disturbances[key] === i
                              ? 'bg-primary border-primary text-white'
                              : 'border-border text-text-secondary hover:border-primary'
                          )}
                        >
                          {fl}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Medication */}
              <div className="flex flex-col gap-1 text-xs text-text-secondary">
                <span>Sleep medication use</span>
                <div className="flex gap-2">
                  {FREQ_LABELS.map((fl, i) => (
                    <button
                      key={i}
                      onClick={() => setPsqiForm((f) => ({ ...f, sleep_medication: i }))}
                      className={cn(
                        'flex-1 px-2 py-1.5 rounded-lg text-xs border transition-colors',
                        psqiForm.sleep_medication === i
                          ? 'bg-primary border-primary text-white'
                          : 'border-border text-text-secondary hover:border-primary'
                      )}
                    >
                      {fl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daytime dysfunction */}
              {(
                [
                  ['trouble_staying_awake', 'Trouble staying awake (meetings, driving…)'],
                  ['enthusiasm_problems', 'Lack of enthusiasm to get things done'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex flex-col gap-1 text-xs text-text-secondary">
                  <span>{label}</span>
                  <div className="flex gap-2">
                    {FREQ_LABELS.map((fl, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setPsqiForm((f) => ({
                            ...f,
                            daytime_dysfunction: { ...f.daytime_dysfunction, [key]: i },
                          }))
                        }
                        className={cn(
                          'flex-1 px-2 py-1.5 rounded-lg text-xs border transition-colors',
                          psqiForm.daytime_dysfunction[key] === i
                            ? 'bg-primary border-primary text-white'
                            : 'border-border text-text-secondary hover:border-primary'
                        )}
                      >
                        {fl}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={computePSQI}
                className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Calculate PSQI Score
              </button>
            </div>

            {/* Results */}
            {psqiResult && (
              <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-text-primary">
                      {psqiResult.global_score}
                      <span className="text-base font-normal text-text-secondary">/21</span>
                    </p>
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        psqiResult.interpretation === 'Good' ? 'text-green-400' : 'text-red-400'
                      )}
                    >
                      {psqiResult.interpretation} Sleep Quality
                    </p>
                  </div>
                  <div className="text-right text-xs text-text-secondary space-y-0.5">
                    <p>Time in bed: {psqiResult.time_in_bed_hours.toFixed(1)}h</p>
                    <p>
                      Efficiency:{' '}
                      <span
                        className={cn(
                          'font-semibold',
                          psqiResult.sleep_efficiency_pct >= 85
                            ? 'text-green-400'
                            : psqiResult.sleep_efficiency_pct >= 75
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        )}
                      >
                        {psqiResult.sleep_efficiency_pct}%
                      </span>
                    </p>
                  </div>
                </div>

                {/* Component breakdown */}
                <div className="space-y-2">
                  {Object.entries(psqiResult.component_scores).map(([key, score]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-text-secondary w-32 flex-shrink-0">
                        {PSQI_COMPONENT_LABELS[key]}
                      </span>
                      <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all',
                            score === 0 ? 'bg-green-500' : score === 1 ? 'bg-yellow-500' : 'bg-red-500'
                          )}
                          style={{ width: `${(score / 3) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-text-primary w-4 text-right">
                        {score}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                {psqiResult.recommendations.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Recommendations
                    </p>
                    {psqiResult.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-text-primary bg-background rounded-lg px-3 py-2"
                      >
                        <span className="text-primary mt-0.5">•</span>
                        {rec}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={savePSQI}
                  disabled={psqiSaving || psqiSaved}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    psqiSaved
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-primary/20 text-primary hover:bg-primary/30'
                  )}
                >
                  {psqiSaved ? '✓ Saved' : psqiSaving ? 'Saving…' : 'Save Assessment'}
                </button>
              </div>
            )}

            {/* History */}
            {apiData && apiData.assessments.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">
                  History
                </h3>
                <div className="space-y-2">
                  {apiData.assessments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-text-secondary">{fmtDate(a.assessed_at)}</span>
                      <div className="flex items-center gap-3">
                        {a.sleep_efficiency_pct && (
                          <span className="text-xs text-text-secondary">
                            {a.sleep_efficiency_pct}% eff.
                          </span>
                        )}
                        <span
                          className={cn(
                            'font-semibold',
                            a.psqi_global_score <= 5 ? 'text-green-400' : 'text-red-400'
                          )}
                        >
                          {a.psqi_global_score}/21
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── CAFFEINE TAB ──────────────────────────────────────────── */}
        {tab === 'caffeine' && (
          <>
            {/* Sleep pressure card */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                Sleep Pressure (Adenosine)
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-text-secondary">Wake time</label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-text-primary">
                    {pressure.score}
                    <span className="text-sm font-normal text-text-secondary">/100</span>
                  </p>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      pressure.level === 'Very High'
                        ? 'text-red-400'
                        : pressure.level === 'High'
                        ? 'text-orange-400'
                        : pressure.level === 'Moderate'
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    )}
                  >
                    {pressure.level}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Ideal bed: {pressure.ideal_bedtime}
                  </p>
                </div>
              </div>
            </div>

            {/* Caffeine log */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                Today's Caffeine Log
              </h2>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-xs text-text-secondary mb-1 block">Source</label>
                  <select
                    value={newCaffLabel}
                    onChange={(e) => {
                      const src = CAFFEINE_SOURCES.find((s) => s.label === e.target.value)
                      setNewCaffLabel(e.target.value)
                      if (src) setNewCaffMg(src.mg)
                    }}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  >
                    {CAFFEINE_SOURCES.map((s) => (
                      <option key={s.label} value={s.label}>
                        {s.label}
                      </option>
                    ))}
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">mg</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={newCaffMg}
                    onChange={(e) => setNewCaffMg(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Time</label>
                  <input
                    type="time"
                    value={newCaffTime}
                    onChange={(e) => setNewCaffTime(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  />
                </div>
                <button
                  onClick={() => {
                    setCaffEntries((prev) => [
                      ...prev,
                      { mg: newCaffMg, time: newCaffTime, label: newCaffLabel },
                    ])
                  }}
                  className="col-span-2 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  + Add
                </button>
              </div>

              {caffEntries.length > 0 && (
                <div className="space-y-1">
                  {caffEntries.map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-background rounded-lg px-3 py-2">
                      <span className="text-text-primary">{e.label}</span>
                      <span className="text-text-secondary">{e.time}</span>
                      <span className="text-primary font-semibold">{e.mg} mg</span>
                      <button
                        onClick={() => setCaffEntries((prev) => prev.filter((_, j) => j !== i))}
                        className="text-text-secondary hover:text-red-400 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-xs px-3 py-1 font-semibold text-text-primary border-t border-border mt-1 pt-2">
                    <span>Total</span>
                    <span className="text-primary">{totalCaffeine} mg</span>
                  </div>
                </div>
              )}
            </div>

            {/* Clearance info */}
            {caffeineInfo && (
              <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                  Clearance Timeline
                </h2>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-background rounded-xl p-3">
                    <p className="text-xs text-text-secondary">Half cleared</p>
                    <p className="text-lg font-bold text-text-primary">{caffeineInfo.half_life}</p>
                  </div>
                  <div className="bg-background rounded-xl p-3">
                    <p className="text-xs text-text-secondary">75% cleared</p>
                    <p className="text-lg font-bold text-text-primary">{caffeineInfo.quarter_life}</p>
                  </div>
                  <div className="bg-background rounded-xl p-3">
                    <p className="text-xs text-text-secondary">Safe for sleep</p>
                    <p className="text-lg font-bold text-green-400">{caffeineInfo.safe_sleep_time}</p>
                  </div>
                </div>
                <p className="text-xs text-text-secondary">{caffeineInfo.recommendation}</p>

                {/* Curve */}
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={caffeineChartData}>
                    <defs>
                      <linearGradient id="caffGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border,#333)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'var(--color-text-secondary,#888)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)' }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} mg`, 'Caffeine']} />
                    <ReferenceLine y={25} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Safe', fill: '#22c55e', fontSize: 10 }} />
                    <Area type="monotone" dataKey="mg" stroke="#f59e0b" fill="url(#caffGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Reference table */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">
                Common Sources
              </h3>
              <div className="space-y-1.5">
                {CAFFEINE_SOURCES.map((s) => (
                  <div key={s.label} className="flex justify-between text-xs">
                    <span className="text-text-primary">{s.label}</span>
                    <span className="text-primary font-semibold">{s.mg} mg</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-text-secondary italic">
                Half-life: 5.5 h (Richardson 2007). Quarter-life ≈ 11 h.
              </p>
            </div>
          </>
        )}

        {/* ── WIND-DOWN TAB ──────────────────────────────────────────── */}
        {tab === 'winddown' && (
          <>
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                Your Settings
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs text-text-secondary">
                  Target bedtime
                  <input
                    type="time"
                    value={targetBedtime}
                    onChange={(e) => setTargetBedtime(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-text-secondary">
                  Chronotype
                  <select
                    value={chronotype}
                    onChange={(e) => setChronotype(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  >
                    <option value="lion">🦁 Lion (Early Bird)</option>
                    <option value="bear">🐻 Bear (Middle)</option>
                    <option value="wolf">🐺 Wolf (Night Owl)</option>
                    <option value="dolphin">🐬 Dolphin (Light Sleeper)</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                90-Min Wind-Down Schedule
              </h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4 pl-10">
                  {windDownSteps.map((step, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[26px] w-3 h-3 rounded-full bg-primary border-2 border-background" />
                      <div className="bg-background rounded-xl p-3">
                        <p className="text-sm font-medium text-text-primary">{step.activity}</p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {step.duration_min} min · {step.time_before_bed} min before bed
                        </p>
                        <p className="text-xs text-primary/80 mt-1 italic">{step.research_benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Research callout */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                The Science
              </h3>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li>
                  <span className="text-text-primary font-medium">Circadian timing</span> — Czeisler et al.
                  (1999): <em>when</em> you sleep matters as much as <em>how long</em>.
                </li>
                <li>
                  <span className="text-text-primary font-medium">Temperature drop</span> — A 1–2 °C core body
                  temp fall initiates sleep (Walker 2017).
                </li>
                <li>
                  <span className="text-text-primary font-medium">Light exposure</span> — Even dim room light
                  (200 lux) suppresses melatonin by 50%.
                </li>
                <li>
                  <span className="text-text-primary font-medium">Consistency</span> — Irregular sleep timing
                  raises resting HR, HRV drops.
                </li>
              </ul>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
