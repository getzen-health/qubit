'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import {
  Scale, TrendingDown, TrendingUp, Minus, AlertTriangle, Target, ChevronRight,
  CheckCircle2, Info, Activity, Ruler,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BiometricLog, BiometricSettings } from '@/lib/biometrics'
import {
  calculateBMI,
  navyBodyFat,
  bmiBodyFat,
  calculateFatMassLeanMass,
  smoothWeightTrend,
  calculateWeeklyRate,
  getIdealWeightRange,
  waistRisk,
  whrRisk,
  whtRisk,
  projectWeightGoal,
  bodyFatCategory,
} from '@/lib/biometrics'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  initialLogs: BiometricLog[]
  initialSettings: BiometricSettings
}

type Tab = 'weight' | 'bodycomp' | 'measurements' | 'goals'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function today() {
  return new Date().toISOString().split('T')[0]
}

const RISK_COLORS: Record<string, string> = {
  low: 'text-green-400',
  moderate: 'text-yellow-400',
  high: 'text-orange-400',
  very_high: 'text-red-400',
}

const RISK_BG: Record<string, string> = {
  low: 'bg-green-400/10 border-green-400/30',
  moderate: 'bg-yellow-400/10 border-yellow-400/30',
  high: 'bg-orange-400/10 border-orange-400/30',
  very_high: 'bg-red-400/10 border-red-400/30',
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-text-secondary mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── BMI Gauge ───────────────────────────────────────────────────────────────

function BMIGauge({ bmi }: { bmi: number }) {
  const min = 15, max = 40
  const pct = Math.min(100, Math.max(0, ((bmi - min) / (max - min)) * 100))
  const result = calculateBMI(bmi * (1.75 * 1.75), 175) // dummy; we already have the value
  // Use color based on value directly
  const color = bmi < 18.5 ? '#60a5fa' : bmi < 25 ? '#4ade80' : bmi < 30 ? '#facc15' : '#f87171'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-full h-4 bg-surface-secondary rounded-full overflow-hidden">
        {/* gradient track */}
        <div className="absolute inset-0 rounded-full" style={{
          background: 'linear-gradient(to right, #60a5fa 0%, #4ade80 30%, #facc15 60%, #f87171 100%)'
        }} />
        {/* needle */}
        <div
          className="absolute top-0 w-1 h-full bg-white rounded-full shadow-md transition-all duration-500"
          style={{ left: `calc(${pct}% - 2px)` }}
        />
      </div>
      <div className="flex justify-between w-full text-[10px] text-text-secondary">
        <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40+</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>{bmi}</div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BiometricsClient({ initialLogs, initialSettings }: Props) {
  const [logs, setLogs] = useState<BiometricLog[]>(initialLogs)
  const [settings, setSettings] = useState<BiometricSettings>(initialSettings)
  const [activeTab, setActiveTab] = useState<Tab>('weight')
  const [saving, setSaving] = useState(false)

  // Weight quick-log form
  const [weightInput, setWeightInput] = useState('')
  const [weightDate, setWeightDate] = useState(today())
  const [weightNotes, setWeightNotes] = useState('')

  // Navy BF form
  const [navyNeck, setNavyNeck] = useState('')
  const [navyWaist, setNavyWaist] = useState('')
  const [navyHip, setNavyHip] = useState('')
  const [navyResult, setNavyResult] = useState<number | null>(null)

  // Measurements form
  const [mDate, setMDate] = useState(today())
  const [mWaist, setMWaist] = useState('')
  const [mHip, setMHip] = useState('')
  const [mChest, setMChest] = useState('')
  const [mArm, setMArm] = useState('')
  const [mThigh, setMThigh] = useState('')
  const [mCalf, setMCalf] = useState('')

  // Settings form
  const [sHeight, setSHeight] = useState(String(settings.height_cm ?? ''))
  const [sSex, setSSex] = useState<'male' | 'female' | 'other' | ''>(settings.sex ?? '')
  const [sEthnicity, setSEthnicity] = useState(settings.ethnicity ?? 'european')
  const [sTarget, setSTarget] = useState(String(settings.target_weight_kg ?? ''))
  const [sTargetDate, setSTargetDate] = useState(settings.target_date ?? '')
  const [sGoalType, setSGoalType] = useState(settings.goal_type ?? 'maintain')

  // ── Derived data ──────────────────────────────────────────────────────────

  const weightLogs = useMemo(() => logs.filter(l => l.weight_kg != null), [logs])
  const smoothed = useMemo(() => smoothWeightTrend(weightLogs), [weightLogs])
  const weeklyRate = useMemo(() => calculateWeeklyRate(weightLogs), [weightLogs])

  const weightChartData = useMemo(() => {
    const smoothMap: Record<string, number | null> = {}
    smoothed.forEach(s => { smoothMap[s.date] = s.smoothed })
    return weightLogs.map(l => ({
      date: fmtDate(l.date),
      rawDate: l.date,
      weight: l.weight_kg,
      trend: smoothMap[l.date] ?? null,
    }))
  }, [weightLogs, smoothed])

  const latestLog = useMemo(() => logs.length > 0 ? logs[logs.length - 1] : null, [logs])
  const latestWeight = latestLog?.weight_kg ?? null
  const heightCm = settings.height_cm ?? null
  const sex = (settings.sex === 'other' ? 'male' : settings.sex) as 'male' | 'female' | undefined

  const bmiResult = useMemo(() => {
    if (!latestWeight || !heightCm) return null
    return calculateBMI(latestWeight, heightCm)
  }, [latestWeight, heightCm])

  const fatMassData = useMemo(() => {
    return logs
      .filter(l => l.weight_kg != null && l.body_fat_pct != null)
      .map(l => {
        const { fatMass, leanMass } = calculateFatMassLeanMass(l.weight_kg!, l.body_fat_pct!)
        return { date: fmtDate(l.date), fatMass, leanMass }
      })
  }, [logs])

  const measurementLogs = useMemo(() =>
    logs.filter(l => l.waist_cm || l.hip_cm || l.chest_cm || l.arm_cm || l.thigh_cm || l.calf_cm),
    [logs]
  )

  const latestMeasurements = useMemo(() => {
    if (measurementLogs.length === 0) return null
    const last = measurementLogs[measurementLogs.length - 1]
    return last
  }, [measurementLogs])

  const radarData = useMemo(() => {
    if (!latestMeasurements) return []
    return [
      { label: 'Waist', value: latestMeasurements.waist_cm ?? 0 },
      { label: 'Hip', value: latestMeasurements.hip_cm ?? 0 },
      { label: 'Chest', value: latestMeasurements.chest_cm ?? 0 },
      { label: 'Arm', value: latestMeasurements.arm_cm ?? 0 },
      { label: 'Thigh', value: latestMeasurements.thigh_cm ?? 0 },
      { label: 'Calf', value: latestMeasurements.calf_cm ?? 0 },
    ]
  }, [latestMeasurements])

  const waistRiskResult = useMemo(() => {
    if (!latestMeasurements?.waist_cm || !sex) return null
    return waistRisk(latestMeasurements.waist_cm, sex, (settings.ethnicity ?? 'european') as any)
  }, [latestMeasurements, sex, settings.ethnicity])

  const whrResult = useMemo(() => {
    if (!latestMeasurements?.waist_cm || !latestMeasurements?.hip_cm || !sex) return null
    return whrRisk(latestMeasurements.waist_cm, latestMeasurements.hip_cm, sex)
  }, [latestMeasurements, sex])

  const whtResult = useMemo(() => {
    if (!latestMeasurements?.waist_cm || !heightCm) return null
    return whtRisk(latestMeasurements.waist_cm, heightCm)
  }, [latestMeasurements, heightCm])

  const idealRange = useMemo(() => {
    if (!heightCm || !sex) return null
    return getIdealWeightRange(heightCm, sex)
  }, [heightCm, sex])

  const projection = useMemo(() => {
    if (!latestWeight || !settings.target_weight_kg) return null
    const rate = weeklyRate?.kgPerWeek
      ? Math.abs(weeklyRate.kgPerWeek)
      : settings.goal_type === 'lose' ? 0.5 : settings.goal_type === 'gain' ? 0.3 : 0
    if (rate === 0) return null
    return projectWeightGoal(latestWeight, settings.target_weight_kg, rate)
  }, [latestWeight, settings.target_weight_kg, settings.goal_type, weeklyRate])

  const goalProgress = useMemo(() => {
    if (!latestWeight || !settings.target_weight_kg || !weightLogs.length) return null
    const startWeight = weightLogs[0].weight_kg!
    const total = settings.target_weight_kg - startWeight
    const current = latestWeight - startWeight
    if (total === 0) return 100
    return Math.min(100, Math.max(0, (current / total) * 100))
  }, [latestWeight, settings.target_weight_kg, weightLogs])

  // ── Projection chart ──────────────────────────────────────────────────────

  const projectionChartData = useMemo(() => {
    if (!latestWeight || !settings.target_weight_kg) return []
    const rate = weeklyRate?.kgPerWeek
      ? Math.abs(weeklyRate.kgPerWeek)
      : settings.goal_type === 'lose' ? 0.5 : 0.3
    const direction = settings.goal_type === 'gain' ? 1 : -1
    const pts = []
    for (let w = 0; w <= Math.min(52, Math.ceil(Math.abs(latestWeight - settings.target_weight_kg) / rate) + 2); w++) {
      const projected = latestWeight + direction * rate * w
      const d = new Date()
      d.setDate(d.getDate() + w * 7)
      pts.push({
        week: `W${w}`,
        projected: +projected.toFixed(1),
        target: settings.target_weight_kg,
      })
    }
    return pts
  }, [latestWeight, settings.target_weight_kg, settings.goal_type, weeklyRate])

  // ── API actions ───────────────────────────────────────────────────────────

  const saveLog = useCallback(async (payload: Partial<BiometricLog> & { date: string }) => {
    setSaving(true)
    try {
      const res = await fetch('/api/biometrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'log', ...payload }),
      })
      const json = await res.json()
      if (json.log) {
        setLogs(prev => {
          const filtered = prev.filter(l => l.date !== json.log.date)
          return [...filtered, json.log].sort((a, b) => a.date.localeCompare(b.date))
        })
      }
    } finally {
      setSaving(false)
    }
  }, [])

  const saveSettings = useCallback(async (patch: Partial<BiometricSettings>) => {
    setSaving(true)
    try {
      const merged = { ...settings, ...patch }
      const res = await fetch('/api/biometrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'settings', ...merged }),
      })
      const json = await res.json()
      if (json.settings) setSettings(json.settings)
    } finally {
      setSaving(false)
    }
  }, [settings])

  const handleWeightLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!weightInput) return
    await saveLog({ date: weightDate, weight_kg: parseFloat(weightInput), notes: weightNotes || null })
    setWeightInput('')
    setWeightNotes('')
    setWeightDate(today())
  }

  const handleNavyCalc = (e: React.FormEvent) => {
    e.preventDefault()
    if (!navyNeck || !navyWaist || !heightCm || !sex) return
    const bf = navyBodyFat(
      parseFloat(navyNeck),
      parseFloat(navyWaist),
      parseFloat(navyHip || '0'),
      heightCm,
      sex
    )
    setNavyResult(bf)
  }

  const handleMeasurementsLog = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveLog({
      date: mDate,
      waist_cm: mWaist ? parseFloat(mWaist) : undefined,
      hip_cm: mHip ? parseFloat(mHip) : undefined,
      chest_cm: mChest ? parseFloat(mChest) : undefined,
      arm_cm: mArm ? parseFloat(mArm) : undefined,
      thigh_cm: mThigh ? parseFloat(mThigh) : undefined,
      calf_cm: mCalf ? parseFloat(mCalf) : undefined,
    })
    setMWaist(''); setMHip(''); setMChest(''); setMArm(''); setMThigh(''); setMCalf('')
  }

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveSettings({
      height_cm: sHeight ? parseFloat(sHeight) : null,
      sex: sSex || null,
      ethnicity: sEthnicity as any,
      target_weight_kg: sTarget ? parseFloat(sTarget) : null,
      target_date: sTargetDate || null,
      goal_type: sGoalType as any,
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string }[] = [
    { id: 'weight', label: 'Weight' },
    { id: 'bodycomp', label: 'Body Comp' },
    { id: 'measurements', label: 'Measurements' },
    { id: 'goals', label: 'Goals' },
  ]

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-surface rounded-2xl p-1 border border-border">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex-1 py-2 text-xs font-semibold rounded-xl transition-colors',
              activeTab === t.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Weight Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'weight' && (
        <div className="space-y-4">
          {/* Quick-log form */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" /> Log Weight
            </h2>
            <form onSubmit={handleWeightLog} className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-text-secondary mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="20"
                    max="300"
                    value={weightInput}
                    onChange={e => setWeightInput(e.target.value)}
                    placeholder="70.0"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-text-secondary mb-1">Date</label>
                  <input
                    type="date"
                    value={weightDate}
                    onChange={e => setWeightDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <input
                type="text"
                value={weightNotes}
                onChange={e => setWeightNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Log Weight'}
              </button>
            </form>
          </div>

          {/* Weekly rate card */}
          {weeklyRate && (
            <div className={cn(
              'rounded-2xl border p-4',
              weeklyRate.flag ? 'bg-orange-400/10 border-orange-400/30' : 'bg-surface border-border'
            )}>
              <div className="flex items-center gap-2 mb-1">
                {weeklyRate.direction === 'loss' ? <TrendingDown className="w-4 h-4 text-blue-400" /> :
                  weeklyRate.direction === 'gain' ? <TrendingUp className="w-4 h-4 text-green-400" /> :
                    <Minus className="w-4 h-4 text-text-secondary" />}
                <span className="text-sm font-semibold text-text-primary">
                  {weeklyRate.kgPerWeek > 0 ? '+' : ''}{weeklyRate.kgPerWeek} kg/week
                </span>
                <span className="text-xs text-text-secondary ml-1">({weeklyRate.pctPerWeek > 0 ? '+' : ''}{weeklyRate.pctPerWeek}%)</span>
              </div>
              {weeklyRate.flag && (
                <div className="flex items-center gap-1.5 mt-1 text-orange-400 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Rate of loss exceeds 1%/week — consider slowing down to preserve lean mass (Garthe 2011)
                </div>
              )}
            </div>
          )}

          {/* Goal progress */}
          {settings.target_weight_kg && latestWeight && (
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-text-primary flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-primary" /> Goal: {settings.target_weight_kg} kg
                </span>
                <span className="text-text-secondary">{latestWeight} kg now</span>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${goalProgress ?? 0}%` }}
                />
              </div>
              {projection && (
                <p className="text-xs text-text-secondary">
                  Projected goal date: <span className="text-text-primary font-medium">{projection.targetDate}</span>
                  {' '}({projection.weeksToGoal} weeks)
                </p>
              )}
            </div>
          )}

          {/* Weight chart */}
          {weightChartData.length > 1 ? (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Weight Trend (180 days)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weightChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="weight" name="Weight (kg)" dot={{ r: 3, fill: 'var(--accent)' }} stroke="var(--accent)" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="trend" name="7-day avg" dot={false} stroke="#a78bfa" strokeWidth={2} strokeDasharray="4 2" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center text-text-secondary text-sm">
              Log at least 2 weight entries to see your trend chart.
            </div>
          )}
        </div>
      )}

      {/* ── Body Comp Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'bodycomp' && (
        <div className="space-y-4">
          {/* BMI gauge */}
          {bmiResult && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> BMI
              </h2>
              <BMIGauge bmi={bmiResult.value} />
              <div className="mt-3 flex justify-between text-xs">
                <div>
                  <span className="text-text-secondary">WHO: </span>
                  <span className="font-semibold" style={{ color: bmiResult.color }}>{bmiResult.category}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Asian: </span>
                  <span className="font-semibold text-text-primary">{bmiResult.categoryAsian}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navy BF estimator */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" /> Body Fat Estimator (Navy Method)
            </h2>
            <p className="text-xs text-text-secondary mb-3">Hodgdon & Beckett 1984 — tape measurements in cm</p>
            {(!sex || !heightCm) && (
              <p className="text-xs text-orange-400 mb-3 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Set height & sex in Goals tab first.
              </p>
            )}
            <form onSubmit={handleNavyCalc} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Neck (cm)', value: navyNeck, set: setNavyNeck },
                  { label: 'Waist (cm)', value: navyWaist, set: setNavyWaist },
                  { label: sex === 'female' ? 'Hip (cm)' : 'Hip (optional)', value: navyHip, set: setNavyHip },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs text-text-secondary mb-1">{f.label}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                disabled={!sex || !heightCm}
                className="w-full bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Calculate
              </button>
            </form>
            {navyResult !== null && (
              <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-xl">
                <div className="text-lg font-bold text-primary">{navyResult}% body fat</div>
                {sex && (
                  <div className="text-xs text-text-secondary mt-0.5">
                    ACE: <span className="font-medium" style={{ color: bodyFatCategory(navyResult, sex, 30).color }}>
                      {bodyFatCategory(navyResult, sex, 30).category}
                    </span>
                  </div>
                )}
                <button
                  className="mt-2 text-xs text-primary underline"
                  onClick={async () => {
                    const d = today()
                    await saveLog({ date: d, body_fat_pct: navyResult })
                    setNavyResult(null)
                  }}
                >
                  Save to today's log
                </button>
              </div>
            )}
          </div>

          {/* Fat vs Lean stacked area chart */}
          {fatMassData.length > 1 ? (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Fat Mass vs Lean Mass (kg)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={fatMassData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="leanMass" name="Lean (kg)" stackId="1" stroke="#4ade80" fill="#4ade80" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="fatMass" name="Fat (kg)" stackId="1" stroke="#f87171" fill="#f87171" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-6 text-center text-text-secondary text-sm">
              Log weight + body fat % to see fat/lean composition chart.
            </div>
          )}

          {/* Body fat classification */}
          {sex && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3">ACE Body Fat Classification</h2>
              <div className="space-y-1.5">
                {(sex === 'male'
                  ? [
                      { label: 'Essential fat', range: '2–5%', color: '#a78bfa' },
                      { label: 'Athletic', range: '6–13%', color: '#4ade80' },
                      { label: 'Fitness', range: '14–17%', color: '#86efac' },
                      { label: 'Average', range: '18–24%', color: '#facc15' },
                      { label: 'Obese', range: '≥25%', color: '#f87171' },
                    ]
                  : [
                      { label: 'Essential fat', range: '10–13%', color: '#a78bfa' },
                      { label: 'Athletic', range: '14–20%', color: '#4ade80' },
                      { label: 'Fitness', range: '21–24%', color: '#86efac' },
                      { label: 'Average', range: '25–31%', color: '#facc15' },
                      { label: 'Obese', range: '≥32%', color: '#f87171' },
                    ]
                ).map(row => (
                  <div key={row.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                      <span className="text-text-primary">{row.label}</span>
                    </div>
                    <span className="text-text-secondary">{row.range}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Measurements Tab ──────────────────────────────────────────────── */}
      {activeTab === 'measurements' && (
        <div className="space-y-4">
          {/* Entry form */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-primary" /> Log Measurements
            </h2>
            <form onSubmit={handleMeasurementsLog} className="space-y-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Date</label>
                <input
                  type="date"
                  value={mDate}
                  onChange={e => setMDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Waist', value: mWaist, set: setMWaist },
                  { label: 'Hip', value: mHip, set: setMHip },
                  { label: 'Chest', value: mChest, set: setMChest },
                  { label: 'Arm', value: mArm, set: setMArm },
                  { label: 'Thigh', value: mThigh, set: setMThigh },
                  { label: 'Calf', value: mCalf, set: setMCalf },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs text-text-secondary mb-1">{f.label} (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? 'Saving…' : 'Save Measurements'}
              </button>
            </form>
          </div>

          {/* Risk badges */}
          {(waistRiskResult || whrResult || whtResult) && (
            <div className="grid grid-cols-1 gap-3">
              {waistRiskResult && (
                <div className={cn('rounded-2xl border p-3', RISK_BG[waistRiskResult.risk])}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-text-primary">Waist Circumference</span>
                    <span className={cn('text-xs font-bold', RISK_COLORS[waistRiskResult.risk])}>{waistRiskResult.label}</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {latestMeasurements?.waist_cm} cm — threshold {waistRiskResult.threshold} cm (NHLBI/IDF)
                  </p>
                </div>
              )}
              {whrResult && (
                <div className={cn('rounded-2xl border p-3', RISK_BG[whrResult.risk])}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-text-primary">Waist-to-Hip Ratio</span>
                    <span className={cn('text-xs font-bold', RISK_COLORS[whrResult.risk])}>{whrResult.label}</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    WHR: {whrResult.ratio} (WHO)
                  </p>
                </div>
              )}
              {whtResult && (
                <div className={cn('rounded-2xl border p-3', RISK_BG[whtResult.risk])}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-text-primary">Waist-to-Height Ratio</span>
                    <span className={cn('text-xs font-bold', RISK_COLORS[whtResult.risk])}>{whtResult.label}</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    WHtR: {whtResult.ratio} — &lt;0.5 healthy (Browning 2010)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Radar chart */}
          {radarData.filter(d => d.value > 0).length >= 3 ? (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Measurement Profile</h2>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <Radar name="Measurements (cm)" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip content={<ChartTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-6 text-center text-text-secondary text-sm">
              Log at least 3 measurements to see the radar chart.
            </div>
          )}
        </div>
      )}

      {/* ── Goals Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {/* Settings form */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Your Profile & Goal
            </h2>
            <form onSubmit={handleSettingsSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sHeight}
                    onChange={e => setSHeight(e.target.value)}
                    placeholder="175"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Sex</label>
                  <select
                    value={sSex}
                    onChange={e => setSSex(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Ethnicity (for waist thresholds)</label>
                <select
                  value={sEthnicity}
                  onChange={e => setSEthnicity(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="european">European</option>
                  <option value="asian">South/East Asian</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Goal</label>
                  <select
                    value={sGoalType}
                    onChange={e => setSGoalType(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="lose">Lose</option>
                    <option value="maintain">Maintain</option>
                    <option value="gain">Gain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Target (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sTarget}
                    onChange={e => setSTarget(e.target.value)}
                    placeholder="65.0"
                    className="w-full bg-background border border-border rounded-xl px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">By date</label>
                  <input
                    type="date"
                    value={sTargetDate}
                    onChange={e => setSTargetDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </form>
          </div>

          {/* Ideal weight range */}
          {idealRange && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Ideal Weight Range</h2>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-primary">{idealRange.min}–{idealRange.max} kg</span>
                {latestWeight && (
                  <span className={cn('text-xs px-2 py-1 rounded-lg font-medium', latestWeight >= idealRange.min && latestWeight <= idealRange.max ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400')}>
                    {latestWeight >= idealRange.min && latestWeight <= idealRange.max ? 'In range' : 'Out of range'}
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {Object.entries(idealRange.formulas).map(([name, val]) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{name} formula</span>
                    <span className="text-text-primary font-medium">{val} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projection chart */}
          {projectionChartData.length > 1 && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Weight Projection</h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={projectionChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="week" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.floor(projectionChartData.length / 6)} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="projected" name="Projected (kg)" stroke="var(--accent)" strokeWidth={2} dot={false} />
                  <ReferenceLine y={settings.target_weight_kg} stroke="#4ade80" strokeDasharray="4 2" label={{ value: 'Target', fill: '#4ade80', fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Milestones */}
          {projection && projection.milestones.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Milestones</h2>
              <div className="space-y-2">
                {projection.milestones.map(m => {
                  const reached = latestWeight != null && (
                    sGoalType === 'lose' ? latestWeight <= m.targetWeight : latestWeight >= m.targetWeight
                  )
                  return (
                    <div key={m.label} className={cn('flex items-center gap-3 p-2.5 rounded-xl border text-sm', reached ? 'bg-green-400/10 border-green-400/30' : 'bg-background border-border')}>
                      {reached
                        ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-text-secondary shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-text-primary">{m.label}</span>
                        <span className="text-text-secondary ml-2 text-xs">{m.targetWeight} kg</span>
                      </div>
                      <span className="text-xs text-text-secondary">{m.date}</span>
                    </div>
                  )
                })}
              </div>
              {!projection.feasible && (
                <p className="mt-2 text-xs text-orange-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Rate exceeds 1 kg/week — consider a slower pace.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
