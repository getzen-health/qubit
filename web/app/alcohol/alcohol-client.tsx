'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Wine,
  Activity,
  Heart,
  BookOpen,
  Plus,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Info,
  CalendarDays,
  TrendingDown,
  Droplets,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'
import {
  calcStandardDrinks,
  calcLiverHealthScore,
  liverScoreLabel,
  scoreAuditC,
  checkNIAAALimits,
  calcDrinkFreeStreak,
  estimateREMDisruption,
  AUDIT_C_Q1_OPTIONS,
  AUDIT_C_Q2_OPTIONS,
  AUDIT_C_Q3_OPTIONS,
  NIAAA_LIMITS,
  CANCER_RISK_EDUCATION,
  GUT_HEALTH_IMPACT,
  LIVER_RECOVERY_TIMELINE,
  LOWER_RISK_STRATEGIES,
  type AuditCAnswers,
  type BiologicalSex,
} from '@/lib/alcohol-health'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DrinkEntry {
  type: 'beer' | 'wine' | 'spirits' | 'other'
  quantity: number
  abv: number
  oz: number
  standard_drinks: number
}

interface AlcoholLog {
  id?: string
  date: string
  drinks: DrinkEntry[]
  total_standard_drinks: number
  with_food: boolean
  time_of_last_drink: string | null
  sleep_quality_next_morning: number | null
  notes: string
  audit_c_score: number | null
}

interface Props {
  initialLogs: AlcoholLog[]
}

// ─── Drink type presets ───────────────────────────────────────────────────────

const DRINK_PRESETS = [
  { label: 'Beer', type: 'beer' as const, emoji: '🍺', defaultOz: 12, defaultAbv: 5 },
  { label: 'Wine', type: 'wine' as const, emoji: '🍷', defaultOz: 5, defaultAbv: 12 },
  { label: 'Spirits', type: 'spirits' as const, emoji: '🥃', defaultOz: 1.5, defaultAbv: 40 },
  { label: 'Other', type: 'other' as const, emoji: '🍹', defaultOz: 4, defaultAbv: 8 },
]

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const fill = circ - (score / 100) * circ
  const strokeColor =
    color === 'emerald' ? '#10b981'
    : color === 'green' ? '#22c55e'
    : color === 'yellow' ? '#eab308'
    : color === 'orange' ? '#f97316'
    : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg width="128" height="128" className="-rotate-90 absolute inset-0">
          <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-border" />
          <circle
            cx="64" cy="64" r={r} fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={fill}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="text-center">
          <div className="text-2xl font-bold text-text-primary">{score}</div>
          <div className="text-[10px] text-text-secondary">/100</div>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color: strokeColor }}>{label}</span>
    </div>
  )
}

// ─── NIAAA Limit Bar ──────────────────────────────────────────────────────────

function NIAAABar({
  value,
  max,
  label,
}: {
  value: number
  max: number
  label: string
}) {
  const pct = Math.min(100, (value / max) * 100)
  const over = value > max
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-text-secondary">
        <span>{label}</span>
        <span className={over ? 'text-red-500 font-semibold' : 'text-text-secondary'}>
          {value.toFixed(1)} / {max}
        </span>
      </div>
      <div className="h-2 bg-surface rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', over ? 'bg-red-500' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AlcoholClient({ initialLogs }: Props) {
  const [tab, setTab] = useState<'log' | 'trends' | 'liver'>('log')
  const [logs, setLogs] = useState<AlcoholLog[]>(initialLogs)
  const [saving, setSaving] = useState(false)
  const [sex] = useState<BiologicalSex>('male') // TODO: pull from profile

  const today = new Date().toISOString().slice(0, 10)

  // ── Log tab state ──────────────────────────────────────────────────────────
  const [logDate, setLogDate] = useState(today)
  const [selectedType, setSelectedType] = useState<DrinkEntry['type']>('beer')
  const [quantity, setQuantity] = useState(1)
  const [abv, setAbv] = useState(5)
  const [oz, setOz] = useState(12)
  const [withFood, setWithFood] = useState(false)
  const [timeOfLastDrink, setTimeOfLastDrink] = useState('')
  const [sleepQuality, setSleepQuality] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [drinks, setDrinks] = useState<DrinkEntry[]>([])

  // ── AUDIT-C state ──────────────────────────────────────────────────────────
  const [auditAnswers, setAuditAnswers] = useState<AuditCAnswers>({
    frequency: 0,
    typicalQuantity: 0,
    heavyEpisode: 0,
  })
  const [showAuditResult, setShowAuditResult] = useState(false)

  // ── Derived data ───────────────────────────────────────────────────────────

  const liveStandardDrinks = useMemo(
    () => calcStandardDrinks(oz * quantity, abv),
    [oz, quantity, abv]
  )

  const todayLog = useMemo(
    () => logs.find((l) => l.date === today),
    [logs, today]
  )

  const weeklyDrinks = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 6)
    const weekAgoStr = weekAgo.toISOString().slice(0, 10)
    return logs
      .filter((l) => l.date >= weekAgoStr)
      .reduce((s, l) => s + (l.total_standard_drinks ?? 0), 0)
  }, [logs])

  const niaaa = useMemo(
    () => checkNIAAALimits(todayLog?.total_standard_drinks ?? 0, weeklyDrinks, sex),
    [todayLog, weeklyDrinks, sex]
  )

  const drinkDatesSet = useMemo(
    () => new Set(logs.filter((l) => l.total_standard_drinks > 0).map((l) => l.date)),
    [logs]
  )

  const streak = useMemo(
    () => calcDrinkFreeStreak(drinkDatesSet, today),
    [drinkDatesSet, today]
  )

  const weeklyChartData = useMemo(() => {
    const weeks: { week: string; drinks: number; color: string }[] = []
    for (let w = 12; w >= 0; w--) {
      const end = new Date()
      end.setDate(end.getDate() - w * 7)
      const start = new Date(end)
      start.setDate(end.getDate() - 6)
      const startStr = start.toISOString().slice(0, 10)
      const endStr = end.toISOString().slice(0, 10)
      const total = logs
        .filter((l) => l.date >= startStr && l.date <= endStr)
        .reduce((s, l) => s + l.total_standard_drinks, 0)
      const limit = NIAAA_LIMITS[sex].weeklyMax
      weeks.push({
        week: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        drinks: Math.round(total * 10) / 10,
        color: total <= limit ? '#10b981' : total <= limit * 1.5 ? '#f97316' : '#ef4444',
      })
    }
    return weeks
  }, [logs, sex])

  const sleepCorrelationData = useMemo(() => {
    return logs
      .filter((l) => l.sleep_quality_next_morning !== null)
      .map((l) => ({
        drinks: l.total_standard_drinks,
        sleep: l.sleep_quality_next_morning,
      }))
  }, [logs])

  const liverScore = useMemo(
    () =>
      calcLiverHealthScore({
        weeklyStandardDrinks: weeklyDrinks,
        drinkFreeDaysPerWeek: streak.thisWeekFreeDays,
        eatsFoodWithDrinks: todayLog?.with_food ?? false,
        hydrationScore: 70, // TODO: from water tracker
        yearsOfCurrentPattern: 2,
        sex,
      }),
    [weeklyDrinks, streak.thisWeekFreeDays, todayLog, sex]
  )

  const liverLabel = liverScoreLabel(liverScore)

  const auditResult = useMemo(
    () => scoreAuditC(auditAnswers, sex),
    [auditAnswers, sex]
  )

  const remDisruption = useMemo(() => {
    if (!todayLog?.time_of_last_drink) return null
    const [h, m] = todayLog.time_of_last_drink.split(':').map(Number)
    const lastDrinkHour = h + m / 60
    const bedtimeHour = 23 // assume 11 pm
    const hoursBeforeBed = bedtimeHour - lastDrinkHour
    if (hoursBeforeBed >= 3) return null
    return estimateREMDisruption(todayLog.total_standard_drinks)
  }, [todayLog])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const addDrink = useCallback(() => {
    const entry: DrinkEntry = {
      type: selectedType,
      quantity,
      abv,
      oz,
      standard_drinks: liveStandardDrinks,
    }
    setDrinks((prev) => [...prev, entry])
  }, [selectedType, quantity, abv, oz, liveStandardDrinks])

  const removeDrink = useCallback((index: number) => {
    setDrinks((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const selectPreset = useCallback((preset: (typeof DRINK_PRESETS)[number]) => {
    setSelectedType(preset.type)
    setOz(preset.defaultOz)
    setAbv(preset.defaultAbv)
    setQuantity(1)
  }, [])

  const saveLog = async () => {
    setSaving(true)
    try {
      const totalStandardDrinks = drinks.reduce((s, d) => s + d.standard_drinks, 0)
      const payload: Omit<AlcoholLog, 'id'> = {
        date: logDate,
        drinks,
        total_standard_drinks: Math.round(totalStandardDrinks * 100) / 100,
        with_food: withFood,
        time_of_last_drink: timeOfLastDrink || null,
        sleep_quality_next_morning: sleepQuality,
        notes,
        audit_c_score: null,
      }
      const res = await fetch('/api/alcohol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const { log } = await res.json()
        setLogs((prev) => {
          const filtered = prev.filter((l) => l.date !== logDate)
          return [log, ...filtered].sort((a, b) => b.date.localeCompare(a.date))
        })
        setDrinks([])
        setNotes('')
        setSleepQuality(null)
        setTimeOfLastDrink('')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Calendar heatmap ────────────────────────────────────────────────────────

  const calendarDays = useMemo(() => {
    const days: { date: string; drinks: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const log = logs.find((l) => l.date === iso)
      days.push({ date: iso, drinks: log?.total_standard_drinks ?? 0 })
    }
    return days
  }, [logs])

  const dayColor = (drinks: number) => {
    if (drinks === 0) return 'bg-surface border border-border'
    if (drinks <= 2) return 'bg-emerald-500/40 border border-emerald-500/20'
    if (drinks <= 4) return 'bg-yellow-500/40 border border-yellow-500/20'
    return 'bg-red-500/40 border border-red-500/20'
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl hover:bg-surface transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2">
            <Wine className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-text-primary">Alcohol Tracker</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2">
          {(['log', 'trends', 'liver'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-1.5 rounded-xl text-sm font-medium capitalize transition-colors',
                tab === t
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary hover:text-text-primary'
              )}
            >
              {t === 'liver' ? 'Liver Health' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* ── LOG TAB ────────────────────────────────────────────────────── */}
        {tab === 'log' && (
          <>
            {/* Date picker */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Date
              </label>
              <input
                type="date"
                value={logDate}
                max={today}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
              />
            </div>

            {/* Drink type selector */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <p className="text-sm font-semibold text-text-primary">Drink Type</p>
              <div className="grid grid-cols-4 gap-2">
                {DRINK_PRESETS.map((preset) => (
                  <button
                    key={preset.type}
                    onClick={() => selectPreset(preset)}
                    className={cn(
                      'flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-colors',
                      selectedType === preset.type
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-text-secondary hover:border-primary/50'
                    )}
                  >
                    <span className="text-xl">{preset.emoji}</span>
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom quantity / ABV / oz */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Oz / serving</label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={oz}
                    onChange={(e) => setOz(parseFloat(e.target.value) || 1)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">ABV %</label>
                  <input
                    type="number"
                    min={0.5}
                    max={100}
                    step={0.5}
                    value={abv}
                    onChange={(e) => setAbv(parseFloat(e.target.value) || 5)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
                  />
                </div>
              </div>

              {/* Live standard drinks preview */}
              <div className="flex items-center justify-between bg-background rounded-xl p-3">
                <span className="text-sm text-text-secondary">Standard drinks</span>
                <span className="text-lg font-bold text-primary">
                  {liveStandardDrinks.toFixed(2)}
                </span>
              </div>

              <button
                onClick={addDrink}
                className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/30 rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add drink
              </button>
            </div>

            {/* Drinks added */}
            {drinks.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border p-4 space-y-2">
                <p className="text-sm font-semibold text-text-primary">Today's Drinks</p>
                {drinks.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-sm text-text-primary capitalize">
                      {d.quantity}× {d.type} ({d.oz}oz, {d.abv}%)
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-primary">{d.standard_drinks.toFixed(2)} SD</span>
                      <button
                        onClick={() => removeDrink(i)}
                        className="text-xs text-red-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-1 font-semibold text-sm">
                  <span className="text-text-primary">Total</span>
                  <span className="text-primary">
                    {drinks.reduce((s, d) => s + d.standard_drinks, 0).toFixed(2)} standard drinks
                  </span>
                </div>
              </div>
            )}

            {/* NIAAA limits bar */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                NIAAA 2023 Low-Risk Limits
              </p>
              <NIAAABar
                value={drinks.reduce((s, d) => s + d.standard_drinks, 0)}
                max={NIAAA_LIMITS[sex].dailyMax}
                label="Today (daily)"
              />
              <NIAAABar
                value={weeklyDrinks}
                max={NIAAA_LIMITS[sex].weeklyMax}
                label="This week (weekly)"
              />
              <p className="text-xs text-text-secondary">
                Men: ≤4/day & ≤14/week · Women: ≤3/day & ≤7/week
              </p>
            </div>

            {/* Extra details */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <p className="text-sm font-semibold text-text-primary">Details</p>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-text-secondary">Drinking with food?</span>
                <button
                  onClick={() => setWithFood((v) => !v)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative',
                    withFood ? 'bg-primary' : 'bg-border'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                      withFood ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </label>

              <div className="space-y-1">
                <label className="text-xs text-text-secondary">Time of last drink</label>
                <input
                  type="time"
                  value={timeOfLastDrink}
                  onChange={(e) => setTimeOfLastDrink(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs text-text-secondary">Sleep quality (next morning)</label>
                  <span className="text-xs text-primary font-semibold">
                    {sleepQuality ? `${sleepQuality}/5` : '—'}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={sleepQuality ?? 3}
                  onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-text-secondary">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-text-secondary">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Occasion, how you felt..."
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary resize-none"
                />
              </div>
            </div>

            <button
              onClick={saveLog}
              disabled={saving || drinks.length === 0}
              className="w-full bg-primary text-white rounded-2xl py-3 font-semibold text-sm disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Saving…' : 'Save Log'}
            </button>

            {/* REM disruption warning */}
            {remDisruption && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 space-y-1">
                <p className="text-sm font-semibold text-yellow-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Sleep Impact Detected
                </p>
                <p className="text-xs text-text-secondary">{remDisruption.overallNote}</p>
                <p className="text-xs text-text-secondary">
                  Estimated REM reduction:{' '}
                  <span className="font-semibold text-yellow-400">{remDisruption.remReductionPercent}%</span>
                </p>
                <p className="text-[10px] text-text-secondary italic">Colrain et al. 2014</p>
              </div>
            )}
          </>
        )}

        {/* ── TRENDS TAB ─────────────────────────────────────────────────── */}
        {tab === 'trends' && (
          <>
            {/* Streak card */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface rounded-2xl border border-border p-3 text-center">
                <div className="text-2xl font-bold text-primary">{streak.streak}</div>
                <div className="text-[10px] text-text-secondary mt-0.5">Drink-free streak</div>
              </div>
              <div className="bg-surface rounded-2xl border border-border p-3 text-center">
                <div className="text-2xl font-bold text-primary">{streak.longestStreak}</div>
                <div className="text-[10px] text-text-secondary mt-0.5">Longest streak</div>
              </div>
              <div className="bg-surface rounded-2xl border border-border p-3 text-center">
                <div className="text-2xl font-bold text-primary">{streak.thisWeekFreeDays}</div>
                <div className="text-[10px] text-text-secondary mt-0.5">Free days this week</div>
              </div>
            </div>

            {/* Weekly bar chart */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold text-text-primary mb-3">Weekly Standard Drinks (13 weeks)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyChartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 9, fill: 'var(--text-secondary)' }}
                    tickLine={false}
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`${v} SD`, 'Standard drinks']}
                  />
                  <ReferenceLine
                    y={NIAAA_LIMITS[sex].weeklyMax}
                    stroke="#ef4444"
                    strokeDasharray="4 3"
                    label={{ value: 'NIAAA limit', fontSize: 9, fill: '#ef4444', position: 'insideTopRight' }}
                  />
                  <Bar dataKey="drinks" radius={[4, 4, 0, 0]}>
                    {weeklyChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 30-day calendar heatmap */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold text-text-primary mb-3">30-Day Calendar</p>
              <div className="grid grid-cols-7 gap-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] text-text-secondary pb-1">{d}</div>
                ))}
                {calendarDays.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.drinks} SD`}
                    className={cn('aspect-square rounded-md', dayColor(day.drinks))}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3 text-[10px] text-text-secondary">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-surface border border-border inline-block" /> Free</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500/40 inline-block" /> 1–2 SD</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-500/40 inline-block" /> 3–4 SD</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500/40 inline-block" /> 5+ SD</span>
              </div>
            </div>

            {/* Sleep correlation */}
            {sleepCorrelationData.length > 1 && (
              <div className="bg-surface rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold text-text-primary mb-1">Sleep Quality vs Drinks</p>
                <p className="text-xs text-text-secondary mb-3">Each dot = one logged day</p>
                <ResponsiveContainer width="100%" height={140}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="drinks"
                      name="Standard drinks"
                      tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                      label={{ value: 'Standard drinks', position: 'insideBottom', offset: -2, fontSize: 9, fill: 'var(--text-secondary)' }}
                    />
                    <YAxis
                      dataKey="sleep"
                      name="Sleep quality"
                      domain={[0, 5]}
                      tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                      width={24}
                    />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number, name: string) => [v, name]}
                    />
                    <Scatter data={sleepCorrelationData} fill="var(--primary)" opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {/* ── LIVER HEALTH TAB ──────────────────────────────────────────── */}
        {tab === 'liver' && (
          <>
            {/* Liver score gauge */}
            <div className="bg-surface rounded-2xl border border-border p-6 flex flex-col items-center gap-2">
              <p className="text-sm font-semibold text-text-primary self-start mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Liver Health Score
              </p>
              <ScoreRing score={liverScore} label={liverLabel.label} color={liverLabel.color} />
              <p className="text-xs text-text-secondary text-center max-w-xs mt-2">
                Composite estimate based on weekly intake, drink-free days, food pairing, and hydration. Not a clinical diagnostic.
              </p>
            </div>

            {/* AUDIT-C screener */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-4">
              <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                AUDIT-C Screening (Bush et al. 1998)
              </p>
              <p className="text-xs text-text-secondary">3 questions · Score 0–12 · Men ≥4, Women ≥3 = positive screen</p>

              {/* Q1 */}
              <div className="space-y-2">
                <p className="text-sm text-text-primary">1. How often did you have an alcoholic drink in the past year?</p>
                <div className="space-y-1">
                  {AUDIT_C_Q1_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="auditQ1"
                        checked={auditAnswers.frequency === opt.value}
                        onChange={() => setAuditAnswers((a) => ({ ...a, frequency: opt.value as AuditCAnswers['frequency'] }))}
                        className="accent-primary"
                      />
                      <span className="text-sm text-text-secondary">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Q2 */}
              <div className="space-y-2">
                <p className="text-sm text-text-primary">2. How many drinks did you have on a typical day when you were drinking?</p>
                <div className="space-y-1">
                  {AUDIT_C_Q2_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="auditQ2"
                        checked={auditAnswers.typicalQuantity === opt.value}
                        onChange={() => setAuditAnswers((a) => ({ ...a, typicalQuantity: opt.value as AuditCAnswers['typicalQuantity'] }))}
                        className="accent-primary"
                      />
                      <span className="text-sm text-text-secondary">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Q3 */}
              <div className="space-y-2">
                <p className="text-sm text-text-primary">3. How often did you have 6 or more drinks on one occasion?</p>
                <div className="space-y-1">
                  {AUDIT_C_Q3_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="auditQ3"
                        checked={auditAnswers.heavyEpisode === opt.value}
                        onChange={() => setAuditAnswers((a) => ({ ...a, heavyEpisode: opt.value as AuditCAnswers['heavyEpisode'] }))}
                        className="accent-primary"
                      />
                      <span className="text-sm text-text-secondary">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowAuditResult(true)}
                className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold"
              >
                See Result
              </button>

              {showAuditResult && (
                <div
                  className={cn(
                    'rounded-xl border p-4 space-y-2',
                    auditResult.color === 'green' ? 'bg-emerald-500/10 border-emerald-500/30'
                    : auditResult.color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/30'
                    : auditResult.color === 'orange' ? 'bg-orange-500/10 border-orange-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text-primary">Score: {auditResult.score} / 12</span>
                    {auditResult.positiveScreen
                      ? <span className="text-xs font-semibold text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Positive Screen</span>
                      : <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Below Threshold</span>
                    }
                  </div>
                  <p className="text-xs text-text-secondary">{auditResult.interpretation}</p>
                </div>
              )}
            </div>

            {/* Liver recovery timeline */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-primary" />
                Liver Recovery Timeline
              </p>
              <div className="space-y-3">
                {LIVER_RECOVERY_TIMELINE.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                      </div>
                      {i < LIVER_RECOVERY_TIMELINE.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-semibold text-text-primary">{item.period}</p>
                      <p className="text-xs text-primary font-medium">{item.milestone}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lower-risk strategies */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Droplets className="w-4 h-4 text-primary" />
                Lower-Risk Strategies
              </p>
              <div className="space-y-2">
                {LOWER_RISK_STRATEGIES.map((s, i) => (
                  <div key={i} className="flex gap-3 py-2 border-b border-border last:border-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{s.title}</p>
                      <p className="text-xs text-text-secondary">{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cancer risk education */}
            <div className="bg-red-500/5 rounded-2xl border border-red-500/20 p-4 space-y-3">
              <p className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Cancer Risk — IARC
              </p>
              <p className="text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">Classification: </span>
                {CANCER_RISK_EDUCATION.classification}
              </p>
              <div>
                <p className="text-xs font-semibold text-text-primary mb-1">Associated cancer types:</p>
                <ul className="space-y-0.5">
                  {CANCER_RISK_EDUCATION.cancerTypes.map((c) => (
                    <li key={c} className="text-xs text-text-secondary flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-text-secondary">{CANCER_RISK_EDUCATION.doseResponseNote}</p>
              <p className="text-xs text-text-secondary italic">{CANCER_RISK_EDUCATION.reductionNote}</p>
            </div>

            {/* Gut health impact */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                Gut Health Impact
              </p>
              <p className="text-xs text-text-secondary italic">{GUT_HEALTH_IMPACT.reference}</p>
              <p className="text-xs font-semibold text-text-primary">
                Mechanism: {GUT_HEALTH_IMPACT.mechanism}
              </p>
              <ul className="space-y-1.5">
                {GUT_HEALTH_IMPACT.effects.map((e, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
                    {e}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-emerald-400">{GUT_HEALTH_IMPACT.recoveryNote}</p>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
