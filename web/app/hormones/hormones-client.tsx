'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  HormoneLog,
  HormoneScore,
  HormonePillar,
  THYROID_SYMPTOM_KEYS,
  THYROID_SYMPTOM_LABELS,
  IODINE_RICH_FOODS,
  CORTISOL_PATTERN_LABELS,
  CORTISOL_PATTERN_DESCRIPTIONS,
  scoreToGrade,
  scoreToColor,
} from '@/lib/hormone-health'
import { ChevronDown, ChevronUp, Info, TrendingUp, Activity, Zap, Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false })
const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false })
const ScatterChart = dynamic(() => import('recharts').then((m) => m.ScatterChart), { ssr: false })
const Scatter = dynamic(() => import('recharts').then((m) => m.Scatter), { ssr: false })
const PieChart = dynamic(() => import('recharts').then((m) => m.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then((m) => m.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then((m) => m.Cell), { ssr: false })
const Legend = dynamic(() => import('recharts').then((m) => m.Legend), { ssr: false })

interface ScoredLog {
  date: string
  sleep_hours: number
  scores: HormoneScore
  [key: string]: unknown
}

interface Props {
  logs: ScoredLog[]
  currentScore: HormoneScore
  todayLog: HormoneLog
}

// ─── Circular Gauge ────────────────────────────────────────────────────────
function CircularGauge({ score, label, description }: { score: number; label: string; description: string }) {
  const color = scoreToColor(score)
  const grade = scoreToGrade(score)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-surface rounded-2xl border border-border">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide text-center">{label}</p>
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-text-primary">{score}</span>
          <span className="text-[10px] font-medium" style={{ color }}>{grade}</span>
        </div>
      </div>
      <p className="text-[11px] text-text-secondary text-center leading-tight">{description}</p>
    </div>
  )
}

// ─── Pillar Bar ────────────────────────────────────────────────────────────
function PillarBar({ pillar }: { pillar: HormonePillar }) {
  const [open, setOpen] = useState(false)
  const color = scoreToColor(pillar.score)
  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-xs text-text-secondary font-medium">{pillar.label}</span>
        <span className="text-xs font-bold" style={{ color }}>{Math.round(pillar.score)}</span>
      </button>
      <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pillar.score}%`, backgroundColor: color }}
        />
      </div>
      {open && (
        <p className="text-[11px] text-text-secondary leading-relaxed pt-0.5">{pillar.detail}</p>
      )}
    </div>
  )
}

// ─── Cortisol Pattern Visual ───────────────────────────────────────────────
const PATTERN_COLORS: Record<HormoneScore['cortisol_pattern'], string> = {
  healthy: '#22c55e',
  flat: '#94a3b8',
  inverted: '#a855f7',
  elevated: '#ef4444',
}

function CortisolTimeline({
  pattern,
  morningEnergy,
  eveningAlertness,
}: {
  pattern: HormoneScore['cortisol_pattern']
  morningEnergy: number
  eveningAlertness: number
}) {
  const color = PATTERN_COLORS[pattern]
  const times = ['6am', '9am', '12pm', '3pm', '6pm', '9pm']
  // Generate approximate cortisol levels for each time based on pattern
  const levelsByPattern: Record<string, number[]> = {
    healthy: [morningEnergy * 10, 90, 70, 55, 40, Math.min(eveningAlertness * 10, 30)],
    flat: [35, 35, 30, 28, 28, 25],
    inverted: [30, 35, 45, 60, 75, eveningAlertness * 10],
    elevated: [morningEnergy * 10, 88, 82, 78, 70, eveningAlertness * 10],
  }
  const levels = levelsByPattern[pattern]
  const max = Math.max(...levels)

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Cortisol Rhythm</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '20', color }}>
          {CORTISOL_PATTERN_LABELS[pattern]}
        </span>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {levels.map((lvl, i) => (
          <div key={i} className="flex flex-col items-center flex-1 gap-1">
            <div
              className="w-full rounded-t-sm transition-all duration-700"
              style={{ height: `${(lvl / max) * 52}px`, backgroundColor: color, opacity: 0.7 + i * 0.03 }}
            />
            <span className="text-[9px] text-text-secondary">{times[i]}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-text-secondary leading-relaxed">{CORTISOL_PATTERN_DESCRIPTIONS[pattern]}</p>
    </div>
  )
}

// ─── Quick Log Form (Tab 1) ────────────────────────────────────────────────
function QuickLogForm({ todayLog }: { todayLog: HormoneLog }) {
  const [form, setForm] = useState({
    sleep_hours: todayLog.sleep_hours ?? 7,
    stress_level: todayLog.stress_level ?? 5,
    morning_energy: todayLog.morning_energy ?? 5,
    afternoon_crash: todayLog.afternoon_crash ?? 0,
    evening_alertness_9pm: todayLog.evening_alertness_9pm ?? 5,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/hormones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...todayLog, ...form }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
      <h3 className="text-sm font-semibold text-text-primary">Today's Quick Log</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-secondary block mb-1">Sleep Hours</label>
          <input
            type="number"
            min={0} max={14} step={0.5}
            value={form.sleep_hours}
            onChange={(e) => setForm((f) => ({ ...f, sleep_hours: parseFloat(e.target.value) }))}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1">Stress Level (1-10)</label>
          <input
            type="number"
            min={1} max={10}
            value={form.stress_level}
            onChange={(e) => setForm((f) => ({ ...f, stress_level: parseInt(e.target.value) }))}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1">Morning Energy (1-10)</label>
          <input
            type="number"
            min={1} max={10}
            value={form.morning_energy}
            onChange={(e) => setForm((f) => ({ ...f, morning_energy: parseInt(e.target.value) }))}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1">Afternoon Crash</label>
          <select
            value={form.afternoon_crash}
            onChange={(e) => setForm((f) => ({ ...f, afternoon_crash: parseInt(e.target.value) }))}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value={0}>None</option>
            <option value={1}>Mild</option>
            <option value={2}>Moderate</option>
            <option value={3}>Severe</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-text-secondary block mb-1">Evening Alertness at 9pm (1-10)</label>
          <input
            type="number"
            min={1} max={10}
            value={form.evening_alertness_9pm}
            onChange={(e) => setForm((f) => ({ ...f, evening_alertness_9pm: parseInt(e.target.value) }))}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={cn(
          'w-full py-2.5 rounded-xl text-sm font-semibold transition-colors',
          saved
            ? 'bg-green-500/20 text-green-500'
            : 'bg-primary text-white hover:bg-primary/90'
        )}
      >
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Today'}
      </button>
    </div>
  )
}

// ─── Deep Dive Section ────────────────────────────────────────────────────
function DeepDiveSection({
  title,
  icon,
  score,
  pillars,
  educationText,
  children,
}: {
  title: string
  icon: string
  score: number
  pillars: HormonePillar[]
  educationText: string
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const color = scoreToColor(score)

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="font-semibold text-text-primary text-sm">{title}</p>
            <p className="text-xs font-bold" style={{ color }}>{score}/100 — {scoreToGrade(score)}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-5 border-t border-border pt-4">
          {/* Education */}
          <div className="bg-surface-secondary rounded-xl p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-text-secondary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-text-secondary leading-relaxed">{educationText}</p>
            </div>
          </div>

          {/* Pillars */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Score Breakdown</p>
            {pillars.map((p) => <PillarBar key={p.label} pillar={p} />)}
          </div>

          {/* Extra content (symptom checklist, etc.) */}
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Thyroid Symptom Checklist ────────────────────────────────────────────
function ThyroidChecklist({
  todayLog,
  onUpdate,
}: {
  todayLog: HormoneLog
  onUpdate: (symptoms: Record<string, number>, iodine: number) => void
}) {
  const [symptoms, setSymptoms] = useState<Record<string, number>>(todayLog.thyroid_symptoms ?? {})
  const [iodineCount, setIodineCount] = useState(todayLog.iodine_rich_foods_week ?? 0)

  function updateSymptom(key: string, val: number) {
    const updated = { ...symptoms, [key]: val }
    setSymptoms(updated)
    onUpdate(updated, iodineCount)
  }

  function updateIodine(val: number) {
    setIodineCount(val)
    onUpdate(symptoms, val)
  }

  const severityLabels = ['None', 'Mild', 'Moderate', 'Severe']

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Hypothyroid Symptoms</p>
      <div className="space-y-2.5">
        {THYROID_SYMPTOM_KEYS.map((key) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-xs text-text-primary">{THYROID_SYMPTOM_LABELS[key]}</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((v) => (
                <button
                  key={v}
                  onClick={() => updateSymptom(key, v)}
                  className={cn(
                    'w-7 h-7 rounded-lg text-[10px] font-bold border transition-colors',
                    (symptoms[key] ?? 0) === v
                      ? v === 0 ? 'bg-green-500/20 border-green-500/50 text-green-500'
                        : v === 1 ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500'
                        : v === 2 ? 'bg-orange-500/20 border-orange-500/50 text-orange-500'
                        : 'bg-red-500/20 border-red-500/50 text-red-500'
                      : 'bg-surface-secondary border-border text-text-secondary'
                  )}
                  title={severityLabels[v]}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Iodine-Rich Foods This Week</p>
        <div className="flex flex-wrap gap-2">
          {IODINE_RICH_FOODS.map((food) => (
            <button
              key={food.name}
              onClick={() => {
                // Toggle — if selected colour, count changes conceptually
                // Here just increment/decrement against 5 possible foods
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-secondary border border-border text-xs text-text-secondary"
            >
              <span>{food.emoji}</span>
              <span>{food.name}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-text-secondary">Total servings:</label>
          <input
            type="number"
            min={0}
            max={21}
            value={iodineCount}
            onChange={(e) => updateIodine(parseInt(e.target.value) || 0)}
            className="w-20 bg-background border border-border rounded-xl px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {iodineCount < 3 && (
            <span className="text-xs text-orange-500 font-medium">⚠ Iodine risk</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Full Detail Log Form (Tab 2) ─────────────────────────────────────────
function DetailLogForm({ todayLog }: { todayLog: HormoneLog }) {
  const [form, setForm] = useState({
    resistance_training_days_week: todayLog.resistance_training_days_week ?? 0,
    zinc_mg: todayLog.zinc_mg ?? 0,
    healthy_fat_servings: todayLog.healthy_fat_servings ?? 0,
    vitamin_d_iu: todayLog.vitamin_d_iu ?? 0,
    adequate_calories: todayLog.adequate_calories ?? true,
    bmi_estimate: todayLog.bmi_estimate ?? 22,
    body_fat_estimate: todayLog.body_fat_estimate ?? 20,
    fiber_g: todayLog.fiber_g ?? 0,
    cruciferous_servings: todayLog.cruciferous_servings ?? 0,
    alcohol_drinks: todayLog.alcohol_drinks ?? 0,
    sleep_quality: todayLog.sleep_quality ?? 3,
    thyroid_symptoms: todayLog.thyroid_symptoms ?? {},
    iodine_rich_foods_week: todayLog.iodine_rich_foods_week ?? 0,
    notes: todayLog.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/hormones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...todayLog, ...form }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
      <h3 className="text-sm font-semibold text-text-primary">Full Daily Log</h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Resistance Training Days/Week', key: 'resistance_training_days_week', min: 0, max: 7, step: 1 },
          { label: 'Zinc (mg)', key: 'zinc_mg', min: 0, max: 50, step: 0.5 },
          { label: 'Healthy Fat Servings', key: 'healthy_fat_servings', min: 0, max: 10, step: 1 },
          { label: 'Vitamin D (IU)', key: 'vitamin_d_iu', min: 0, max: 10000, step: 100 },
          { label: 'BMI Estimate', key: 'bmi_estimate', min: 15, max: 50, step: 0.1 },
          { label: 'Body Fat %', key: 'body_fat_estimate', min: 5, max: 60, step: 0.5 },
          { label: 'Fiber (g)', key: 'fiber_g', min: 0, max: 100, step: 1 },
          { label: 'Cruciferous Servings', key: 'cruciferous_servings', min: 0, max: 10, step: 1 },
          { label: 'Alcohol Drinks', key: 'alcohol_drinks', min: 0, max: 20, step: 1 },
          { label: 'Sleep Quality (1-5)', key: 'sleep_quality', min: 1, max: 5, step: 1 },
        ].map(({ label, key, min, max, step }) => (
          <div key={key}>
            <label className="text-xs text-text-secondary block mb-1">{label}</label>
            <input
              type="number"
              min={min} max={max} step={step}
              value={(form as Record<string, unknown>)[key] as number}
              onChange={(e) => setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        ))}
        <div className="col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="adequate_calories"
            checked={form.adequate_calories}
            onChange={(e) => setForm((f) => ({ ...f, adequate_calories: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="adequate_calories" className="text-xs text-text-primary">Eating adequate calories today</label>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className={cn(
          'w-full py-2.5 rounded-xl text-sm font-semibold transition-colors',
          saved ? 'bg-green-500/20 text-green-500' : 'bg-primary text-white hover:bg-primary/90'
        )}
      >
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Details'}
      </button>
    </div>
  )
}

// ─── Trends Tab ────────────────────────────────────────────────────────────
function TrendsTab({ logs }: { logs: ScoredLog[] }) {
  const chartData = [...logs]
    .reverse()
    .map((l) => ({
      date: l.date.slice(5),
      testosterone: l.scores.testosterone_index,
      cortisol: l.scores.cortisol_rhythm_score,
      thyroid: l.scores.thyroid_score,
      estrogen: l.scores.estrogen_balance,
      sleep: l.sleep_hours,
    }))

  const scatterData = logs.map((l) => ({
    x: l.sleep_hours,
    y: l.scores.testosterone_index,
  }))

  // Cortisol pattern frequency for pie chart
  const patternCounts: Record<string, number> = { healthy: 0, flat: 0, inverted: 0, elevated: 0 }
  logs.forEach((l) => { patternCounts[l.scores.cortisol_pattern]++ })
  const pieData = Object.entries(patternCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: CORTISOL_PATTERN_LABELS[name as HormoneScore['cortisol_pattern']], value }))

  const PIE_COLORS = ['#22c55e', '#94a3b8', '#a855f7', '#ef4444']

  const thyroidTrend = [...logs].reverse().map((l) => ({
    date: l.date.slice(5),
    score: l.scores.thyroid_score,
  }))

  // Lowest scoring hormone recommendation
  const latest = logs[0]?.scores
  const lowestKey = latest
    ? (['testosterone_index', 'cortisol_rhythm_score', 'thyroid_score', 'estrogen_balance'] as const).reduce(
        (a, b) => latest[a] < latest[b] ? a : b
      )
    : null

  const lowestLabels: Record<string, string> = {
    testosterone_index: 'Testosterone Vitality',
    cortisol_rhythm_score: 'Cortisol Rhythm',
    thyroid_score: 'Thyroid Health',
    estrogen_balance: 'Estrogen Balance',
  }

  return (
    <div className="space-y-6">
      {/* 30-day multi-line chart */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">30-Day Hormone Scores</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="testosterone" stroke="#f59e0b" strokeWidth={2} dot={false} name="Testosterone" />
              <Line type="monotone" dataKey="cortisol" stroke="#3b82f6" strokeWidth={2} dot={false} name="Cortisol" />
              <Line type="monotone" dataKey="thyroid" stroke="#10b981" strokeWidth={2} dot={false} name="Thyroid" />
              <Line type="monotone" dataKey="estrogen" stroke="#a855f7" strokeWidth={2} dot={false} name="Estrogen" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Testosterone vs Sleep scatter */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Testosterone Index vs Sleep Hours</p>
        <p className="text-[11px] text-text-secondary mb-4">Van Cauter 2011: each hour of sleep restriction correlates with lower testosterone</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <XAxis dataKey="x" name="Sleep (h)" type="number" domain={[4, 10]} tick={{ fontSize: 10 }} label={{ value: 'Sleep (h)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
              <YAxis dataKey="y" name="Testosterone Index" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 11 }} />
              <Scatter data={scatterData} fill="#f59e0b" opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cortisol pattern pie */}
      {pieData.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">Cortisol Pattern Frequency (Last 30 Days)</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Thyroid symptom burden trend */}
      {thyroidTrend.length > 1 && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">Thyroid Health Score Trend</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={thyroidTrend}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 11 }} />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={false} name="Thyroid Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {lowestKey && latest && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-text-primary">Focus Area: {lowestLabels[lowestKey]}</p>
          </div>
          <p className="text-xs text-text-secondary">Your lowest-scoring hormone domain. Address these first for the biggest impact.</p>
          <div className="space-y-2">
            {latest.recommendations.slice(0, 4).map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-text-secondary bg-surface-secondary rounded-xl p-2.5">
                <span className="text-primary font-bold mt-0.5">→</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Client ───────────────────────────────────────────────────────────
const TABS = ['Overview', 'Deep Dive', 'Trends'] as const

export function HormonesClient({ logs, currentScore, todayLog }: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  const [localLog, setLocalLog] = useState<HormoneLog>(todayLog)

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 bg-surface rounded-xl border border-border p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors',
              tab === t ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Overview ── */}
      {tab === 'Overview' && (
        <div className="space-y-5">
          {/* 2×2 Gauge Grid */}
          <div className="grid grid-cols-2 gap-3">
            <CircularGauge
              score={currentScore.testosterone_index}
              label="Testosterone Vitality"
              description="Sleep, training, nutrition, stress & body composition proxy"
            />
            <CircularGauge
              score={currentScore.cortisol_rhythm_score}
              label="Cortisol Rhythm"
              description="CAR proxy based on morning energy & daily energy pattern"
            />
            <CircularGauge
              score={currentScore.thyroid_score}
              label="Thyroid Health"
              description="Symptom burden score — lower symptoms = higher score"
            />
            <CircularGauge
              score={currentScore.estrogen_balance}
              label="Estrogen Balance"
              description="Stress, body fat, alcohol, fiber & cruciferous veg factors"
            />
          </div>

          {/* Iodine risk badge */}
          {currentScore.iodine_risk && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
              <span className="text-orange-500 text-lg">⚠</span>
              <div>
                <p className="text-xs font-semibold text-orange-500">Iodine Deficiency Risk</p>
                <p className="text-[11px] text-text-secondary">Fewer than 3 iodine-rich food servings/week detected — Zimmermann 2009 identifies this as the most preventable cause of thyroid dysfunction.</p>
              </div>
            </div>
          )}

          {/* Cortisol rhythm visual */}
          <CortisolTimeline
            pattern={currentScore.cortisol_pattern}
            morningEnergy={localLog.morning_energy ?? 5}
            eveningAlertness={localLog.evening_alertness_9pm ?? 5}
          />

          {/* Quick log */}
          <QuickLogForm todayLog={localLog} />
        </div>
      )}

      {/* ── Tab 2: Deep Dive ── */}
      {tab === 'Deep Dive' && (
        <div className="space-y-3">
          <DeepDiveSection
            title="Testosterone Vitality"
            icon="⚡"
            score={currentScore.testosterone_index}
            pillars={currentScore.testosterone_pillars}
            educationText="Testosterone is a key anabolic hormone in all genders — it drives muscle protein synthesis, bone density, libido, mood, and red blood cell production. Bhasin et al. 2010 (NEJM) demonstrated clear dose-response relationships between testosterone and body composition. Van Cauter 2011 (JAMA) showed that just one week of 5h sleep restriction reduces testosterone 10-15% in healthy young men."
          >
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Evidence-Based Optimisation</p>
              {[
                '🏋️ Compound lifts (squats, deadlifts, bench) acutely increase testosterone and androgen receptor density — aim 3x/week',
                '😴 7-9h sleep is the single highest-leverage testosterone intervention — Leproult & Van Cauter 2011',
                '🥩 Zinc (8-11mg/day) from oysters, beef, or pumpkin seeds is a rate-limiting co-factor for LH-stimulated testosterone synthesis',
                '☀️ Vitamin D (600-2000 IU/day) functions as a prohormone and correlates with testosterone levels in observational studies',
              ].map((tip, i) => (
                <div key={i} className="text-[11px] text-text-secondary bg-surface-secondary rounded-xl p-2.5 leading-relaxed">{tip}</div>
              ))}
            </div>
          </DeepDiveSection>

          <DeepDiveSection
            title="Cortisol Rhythm"
            icon="🌅"
            score={currentScore.cortisol_rhythm_score}
            pillars={currentScore.cortisol_pillars}
            educationText="Cortisol follows a circadian rhythm: peaks 30-45 minutes after waking (the Cortisol Awakening Response / CAR), then declines through the day, reaching its nadir around midnight. Kumari et al. 2009 showed the CAR is a reliable proxy of HPA axis reactivity. Chrousos 2009 describes how chronic stress leads to cortisol resistance — tissues stop responding normally, causing metabolic dysregulation, immune suppression, and poor sleep."
          >
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">CAR & HPA Axis Support</p>
              {[
                '☀️ Get bright light (>10,000 lux or direct sunlight) within 30 minutes of waking — this is the most potent CAR stimulant',
                '🧘 Practices that reduce chronic cortisol: NSDR (yoga nidra), box breathing (4-4-4-4), cold exposure (progressive)',
                '☕ Time caffeine 90-120 min after waking to avoid blunting your natural cortisol peak',
                '🌙 Dim lights and avoid screens after 9pm — light is the most potent suppressor of evening cortisol clearance',
              ].map((tip, i) => (
                <div key={i} className="text-[11px] text-text-secondary bg-surface-secondary rounded-xl p-2.5 leading-relaxed">{tip}</div>
              ))}
            </div>
          </DeepDiveSection>

          <DeepDiveSection
            title="Thyroid Health"
            icon="🦋"
            score={currentScore.thyroid_score}
            pillars={currentScore.thyroid_pillars}
            educationText="The thyroid gland regulates metabolic rate, body temperature, heart rate, and energy via T3/T4 hormones. Zimmermann 2009 identified iodine deficiency as the single most preventable cause of thyroid dysfunction globally. Subclinical hypothyroidism often presents with a cluster of non-specific symptoms years before TSH abnormalities appear on standard labs."
          >
            <ThyroidChecklist
              todayLog={localLog}
              onUpdate={(symptoms, iodine) => setLocalLog((l) => ({ ...l, thyroid_symptoms: symptoms, iodine_rich_foods_week: iodine }))}
            />
          </DeepDiveSection>

          <DeepDiveSection
            title="Estrogen Balance"
            icon="⚖️"
            score={currentScore.estrogen_balance}
            pillars={currentScore.estrogen_pillars}
            educationText="Estrogen is essential in all genders for bone density, cardiovascular health, mood, and cognition. The key is balance — excess estrogen (estrogen dominance) or insufficient levels both cause problems. Adipose tissue contains aromatase enzyme, converting testosterone to estrogen. Alcohol impairs hepatic estrogen metabolism. DIM from cruciferous vegetables supports safe 2-hydroxylation of estrogen. Fiber aids intestinal estrogen clearance by inhibiting beta-glucuronidase."
          >
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Estrogen Balance Tips</p>
              {[
                '🥦 1-2 cups cruciferous veg daily (broccoli, cauliflower, Brussels sprouts) — provides DIM for healthy estrogen metabolism',
                '🌾 25-38g dietary fiber/day — inhibits beta-glucuronidase, preventing reabsorption of conjugated estrogen in the gut',
                '🚫 Limit alcohol — even 2 drinks/day measurably impairs hepatic CYP1A2 enzyme activity for estrogen clearance',
                '🏃 Reducing excess body fat reduces total aromatase activity and peripheral estrogen production',
              ].map((tip, i) => (
                <div key={i} className="text-[11px] text-text-secondary bg-surface-secondary rounded-xl p-2.5 leading-relaxed">{tip}</div>
              ))}
            </div>
          </DeepDiveSection>

          <DetailLogForm todayLog={localLog} />
        </div>
      )}

      {/* ── Tab 3: Trends ── */}
      {tab === 'Trends' && (
        logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <span className="text-5xl">📊</span>
            <p className="text-sm font-medium text-text-primary">No data yet</p>
            <p className="text-xs text-text-secondary">Log a few days of hormone data to see trends and correlations.</p>
          </div>
        ) : (
          <TrendsTab logs={logs} />
        )
      )}

      {/* Recommendations strip */}
      {currentScore.recommendations.length > 0 && tab !== 'Trends' && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Top Recommendations</p>
          {currentScore.recommendations.slice(0, 3).map((rec, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-text-secondary bg-surface-secondary rounded-xl p-2.5">
              <span className="text-primary font-bold mt-0.5">→</span>
              <span className="leading-relaxed">{rec}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
