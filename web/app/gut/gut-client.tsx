'use client'

import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts'
import {
  BRISTOL_TYPES,
  FERMENTED_FOODS,
  calculateGutScore,
  assessLeakyGutRisk,
  type GutLog,
  type GutScore,
} from '@/lib/gut-health'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  initialLog: GutLog
  logs: GutLog[]
  currentScore: GutScore
  trend: { date: string; score: number }[]
  weeklyPlantCount: number
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const fill = circ - (score / 100) * circ
  const color =
    score >= 75 ? '#10b981' : score >= 55 ? '#14b8a6' : score >= 35 ? '#f59e0b' : '#ef4444'
  const gradeColor =
    score >= 75
      ? 'text-emerald-500'
      : score >= 55
      ? 'text-teal-500'
      : score >= 35
      ? 'text-yellow-500'
      : 'text-red-500'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg width="128" height="128" className="-rotate-90 absolute inset-0">
          <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-border" />
          <circle
            cx="64" cy="64" r={r} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={fill}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="relative flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-text-primary">{score}</span>
          <span className="text-xs text-text-secondary">/ 100</span>
        </div>
      </div>
      <span className={`text-sm font-semibold ${gradeColor}`}>{grade}</span>
    </div>
  )
}

// ─── Counter ─────────────────────────────────────────────────────────────────

function Counter({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-8 h-8 rounded-full bg-surface-secondary border border-border flex items-center justify-center text-text-secondary hover:text-text-primary"
      >
        −
      </button>
      <span className="text-lg font-semibold text-text-primary w-10 text-center">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className="w-8 h-8 rounded-full bg-surface-secondary border border-border flex items-center justify-center text-text-secondary hover:text-text-primary"
      >
        +
      </button>
    </div>
  )
}

// ─── Symptom Slider ───────────────────────────────────────────────────────────

function SymptomSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  const labels = ['None', 'Mild', 'Moderate', 'Severe']
  const colors = ['text-emerald-500', 'text-yellow-500', 'text-orange-500', 'text-red-500']
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className={`text-xs font-medium ${colors[value]}`}>{labels[value]}</span>
      </div>
      <input
        type="range" min={0} max={3} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  )
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export function GutClient({ initialLog, logs, currentScore, trend, weeklyPlantCount }: Props) {
  const [tab, setTab] = useState<'today' | 'microbiome' | 'trends'>('today')
  const [log, setLog] = useState<GutLog>(initialLog)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const score = useMemo(
    () => calculateGutScore(log, weeklyPlantCount),
    [log, weeklyPlantCount]
  )

  const leakyRisk = useMemo(() => assessLeakyGutRisk(log), [log])

  function patch<K extends keyof GutLog>(key: K, value: GutLog[K]) {
    setLog((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/gut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  // ── Trends data ──────────────────────────────────────────────────────────────

  const bristolFreq = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const l of logs) {
      counts[l.bristol_type] = (counts[l.bristol_type] ?? 0) + 1
    }
    return BRISTOL_TYPES.map((b) => ({
      name: `Type ${b.type}`,
      value: counts[b.type] ?? 0,
      color: b.isIdeal ? '#10b981' : b.type <= 2 ? '#ef4444' : b.type <= 5 ? '#f59e0b' : '#f97316',
    })).filter((d) => d.value > 0)
  }, [logs])

  const symptomAvg = useMemo(() => {
    if (!logs.length) return []
    const keys = ['bloating', 'gas', 'pain', 'nausea'] as const
    return keys.map((k) => ({
      symptom: k.charAt(0).toUpperCase() + k.slice(1),
      avg: Number((logs.reduce((s, l) => s + (l[k] ?? 0), 0) / logs.length).toFixed(1)),
    }))
  }, [logs])

  const plantTrend = useMemo(() => {
    const weeks: Record<string, number> = {}
    for (const l of logs) {
      const d = new Date(l.date)
      d.setDate(d.getDate() - d.getDay())
      const wk = d.toISOString().slice(0, 10)
      weeks[wk] = (weeks[wk] ?? 0) + (l.plant_species_count ?? 0)
    }
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([week, count]) => ({ week: week.slice(5), count }))
  }, [logs])

  const microTrend = useMemo(() =>
    logs
      .slice(0, 14)
      .map((l) => ({
        date: l.date.slice(5),
        micro: calculateGutScore(l, 0).microbiomeDiversity,
      }))
      .reverse(),
    [logs]
  )

  // ── Risk level color ──────────────────────────────────────────────────────────

  const riskColor =
    leakyRisk.level === 'Low'
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : leakyRisk.level === 'Moderate'
      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      : leakyRisk.level === 'High'
      ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      : 'bg-red-500/10 text-red-500 border-red-500/20'

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold text-text-primary">🦠 Gut Health</h1>
        <div className="flex gap-1 mt-2">
          {(['today', 'microbiome', 'trends'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                tab === t
                  ? 'bg-accent text-white'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              {t === 'today' ? 'Today' : t === 'microbiome' ? 'Microbiome' : 'Trends'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">

        {/* ═══════════════════ TAB: TODAY ════════════════════════ */}
        {tab === 'today' && (
          <>
            {/* Score ring */}
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col items-center gap-4">
              <div className="relative flex flex-col items-center">
                <ScoreRing score={score.total} grade={score.grade} />
              </div>

              {/* Pillars */}
              <div className="grid grid-cols-3 gap-2 w-full">
                {score.pillars.map((p) => (
                  <div key={p.label} className="bg-surface-secondary rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-text-primary">{p.score}</div>
                    <div className="text-[10px] text-text-secondary">{p.label}</div>
                    <div className="text-[10px] text-text-tertiary">{p.weight}% weight</div>
                  </div>
                ))}
              </div>

              {score.recommendations.length > 0 && (
                <div className="w-full space-y-1.5">
                  {score.recommendations.map((r, i) => (
                    <div key={i} className="flex gap-2 text-xs text-text-secondary bg-surface-secondary rounded-xl px-3 py-2">
                      <span>💡</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bristol Stool Scale */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">Bristol Stool Scale</h2>
              <p className="text-xs text-text-secondary">Lewis & Heaton 1997 — validated transit time indicator</p>
              <div className="grid grid-cols-1 gap-2">
                {BRISTOL_TYPES.map((b) => (
                  <button
                    key={b.type}
                    onClick={() => patch('bristol_type', b.type)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                      log.bristol_type === b.type
                        ? b.isIdeal
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-accent/10 border-accent/30'
                        : 'bg-surface-secondary border-border hover:border-border/60'
                    }`}
                  >
                    <span className="text-xl w-8 text-center">{b.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-primary">Type {b.type}</span>
                        {b.isIdeal && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full">Ideal</span>
                        )}
                        <span className="text-[10px] text-text-tertiary ml-auto">{b.transitHours}</span>
                      </div>
                      <p className="text-xs text-text-secondary truncate">{b.label} — {b.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bowel movements */}
            <div className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-text-primary">Bowel Movements Today</h2>
                  <p className="text-xs text-text-secondary">Ideal: 1–2 per day</p>
                </div>
                <Counter
                  value={log.bowel_movement_count}
                  onChange={(v) => patch('bowel_movement_count', v)}
                  max={20}
                />
              </div>
            </div>

            {/* Symptoms */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
              <h2 className="text-sm font-semibold text-text-primary">Symptoms</h2>
              {(
                [
                  { key: 'bloating' as const, label: 'Bloating' },
                  { key: 'gas' as const, label: 'Gas' },
                  { key: 'pain' as const, label: 'Abdominal Pain' },
                  { key: 'nausea' as const, label: 'Nausea' },
                ] as const
              ).map(({ key, label }) => (
                <SymptomSlider
                  key={key}
                  label={label}
                  value={log[key]}
                  onChange={(v) => patch(key, v)}
                />
              ))}
            </div>

            {/* Microbiome inputs */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Microbiome Inputs</h2>
                <p className="text-xs text-text-secondary">Goal: 30 different plants/week (Dahl 2023)</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">Plant species today</p>
                  <p className="text-xs text-text-tertiary">This week: {weeklyPlantCount} / 30 🌱</p>
                </div>
                <Counter value={log.plant_species_count} onChange={(v) => patch('plant_species_count', v)} max={50} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">Fermented food servings</p>
                  <p className="text-xs text-text-tertiary">yogurt, kefir, kimchi, kombucha…</p>
                </div>
                <Counter value={log.fermented_food_servings} onChange={(v) => patch('fermented_food_servings', v)} max={10} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">Ultra-processed servings</p>
                  <p className="text-xs text-text-tertiary">chips, packaged snacks, fast food</p>
                </div>
                <Counter value={log.ultra_processed_servings} onChange={(v) => patch('ultra_processed_servings', v)} max={20} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">Fiber (g)</p>
                  <p className="text-xs text-text-tertiary">Goal: 30g/day</p>
                </div>
                <Counter value={log.fiber_g} onChange={(v) => patch('fiber_g', v)} step={5} max={100} />
              </div>

              <div>
                <p className="text-sm text-text-primary mb-1">Probiotic strain</p>
                <input
                  type="text"
                  placeholder="e.g. Lactobacillus rhamnosus GG"
                  value={log.probiotic_strain}
                  onChange={(e) => patch('probiotic_strain', e.target.value)}
                  className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-text-primary">Prebiotic taken</p>
                <button
                  onClick={() => patch('prebiotic_taken', !log.prebiotic_taken)}
                  className={`w-12 h-6 rounded-full transition-colors ${log.prebiotic_taken ? 'bg-accent' : 'bg-surface-tertiary border border-border'}`}
                >
                  <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${log.prebiotic_taken ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Other factors */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
              <h2 className="text-sm font-semibold text-text-primary">Other Factors</h2>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">Water intake (L)</p>
                  <p className="text-xs text-text-tertiary">Goal: ≥2L/day</p>
                </div>
                <Counter value={log.water_l} onChange={(v) => patch('water_l', v)} step={0.25} max={10} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-text-primary">Stress level</p>
                  <span className={`text-xs font-medium ${log.stress_level > 7 ? 'text-red-500' : log.stress_level > 4 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                    {log.stress_level} / 10
                  </span>
                </div>
                <input
                  type="range" min={1} max={10} value={log.stress_level}
                  onChange={(e) => patch('stress_level', Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">Alcohol drinks</p>
                  <p className="text-xs text-text-tertiary">&gt;1/day is a leaky gut risk factor</p>
                </div>
                <Counter value={log.alcohol_drinks} onChange={(v) => patch('alcohol_drinks', v)} max={20} />
              </div>

              {(
                [
                  { key: 'nsaid_use' as const, label: 'NSAID use', sub: 'aspirin, ibuprofen' },
                  { key: 'gluten_sensitivity' as const, label: 'Gluten sensitivity', sub: 'self-reported' },
                  { key: 'antibiotic_recent' as const, label: 'Antibiotics (last 3 months)', sub: 'recent use disrupts microbiome' },
                ] as const
              ).map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-primary">{label}</p>
                    <p className="text-xs text-text-tertiary">{sub}</p>
                  </div>
                  <button
                    onClick={() => patch(key, !log[key])}
                    className={`w-12 h-6 rounded-full transition-colors ${log[key] ? 'bg-accent' : 'bg-surface-tertiary border border-border'}`}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${log[key] ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}

              <div>
                <p className="text-sm text-text-primary mb-1">Notes</p>
                <textarea
                  rows={2}
                  placeholder="Any observations about your gut today…"
                  value={log.notes}
                  onChange={(e) => patch('notes', e.target.value)}
                  className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none"
                />
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={save}
              disabled={saving}
              className="w-full py-3 bg-accent text-white rounded-2xl font-semibold text-sm disabled:opacity-60"
            >
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Today\'s Log'}
            </button>
          </>
        )}

        {/* ═══════════════════ TAB: MICROBIOME ════════════════════ */}
        {tab === 'microbiome' && (
          <>
            {/* 30-plant goal tracker */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-text-primary">🌱 Weekly Plant Diversity</h2>
                  <p className="text-xs text-text-secondary">Goal: 30 different plants/week (Dahl 2023)</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-text-primary">{weeklyPlantCount}</span>
                  <span className="text-sm text-text-secondary"> / 30</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-surface-secondary rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min((weeklyPlantCount / 30) * 100, 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                <div className="bg-surface-secondary rounded-xl p-2">
                  <p className="font-medium text-text-primary">🥦 Vegetables</p>
                  <p>Broccoli, spinach, bell pepper, carrot, onion, garlic</p>
                </div>
                <div className="bg-surface-secondary rounded-xl p-2">
                  <p className="font-medium text-text-primary">🍎 Fruits</p>
                  <p>Apple, banana, berries, mango, kiwi, pomegranate</p>
                </div>
                <div className="bg-surface-secondary rounded-xl p-2">
                  <p className="font-medium text-text-primary">🌾 Grains</p>
                  <p>Oats, quinoa, brown rice, barley, rye bread</p>
                </div>
                <div className="bg-surface-secondary rounded-xl p-2">
                  <p className="font-medium text-text-primary">🫘 Legumes</p>
                  <p>Lentils, chickpeas, black beans, edamame</p>
                </div>
              </div>
            </div>

            {/* Fermented foods reference */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">🧫 Fermented Foods</h2>
              <p className="text-xs text-text-secondary">Zmora et al. 2018 — fermented foods increase microbiome diversity more effectively than fiber alone</p>
              <div className="grid grid-cols-1 gap-2">
                {FERMENTED_FOODS.map((f) => (
                  <div key={f.name} className="flex items-center gap-3 bg-surface-secondary rounded-xl p-3">
                    <span className="text-2xl">{f.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{f.name}</p>
                      <p className="text-xs text-text-secondary">{f.benefit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gut-Brain Axis */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">🧠 Gut-Brain Axis</h2>
              <p className="text-xs text-text-secondary italic">Cryan et al. 2019, Nature Reviews Neuroscience</p>
              <div className="space-y-2 text-xs text-text-secondary">
                <p>The gut microbiome communicates bidirectionally with the brain via the vagus nerve, immune signaling, and short-chain fatty acids (SCFAs).</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: '😊', title: 'Mood', text: '95% of serotonin is produced in the gut. Microbiome composition influences anxiety and depression.' },
                    { icon: '🧠', title: 'Cognition', text: 'Butyrate-producing bacteria support BDNF, a protein critical for memory and learning.' },
                    { icon: '😴', title: 'Sleep', text: 'Gut dysbiosis is associated with disrupted circadian rhythms and poor sleep quality.' },
                    { icon: '🛡️', title: 'Immunity', text: '70% of immune cells reside in the gut lining. Microbiome diversity = stronger immunity.' },
                  ].map(({ icon, title, text }) => (
                    <div key={title} className="bg-surface-secondary rounded-xl p-2.5">
                      <p className="font-medium text-text-primary mb-0.5">{icon} {title}</p>
                      <p>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Leaky Gut Risk */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-primary">🚧 Leaky Gut Risk</h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${riskColor}`}>
                  {leakyRisk.level} ({leakyRisk.score}/12)
                </span>
              </div>
              <p className="text-xs text-text-secondary">Each factor scored 0–2; total 0–12</p>
              {[
                { label: 'Chronic stress (>7/10)', active: log.stress_level > 7 },
                { label: 'NSAID use (aspirin, ibuprofen)', active: log.nsaid_use },
                { label: 'Alcohol >1 drink/day', active: log.alcohol_drinks > 1 },
                { label: 'Gluten sensitivity (self-reported)', active: log.gluten_sensitivity },
                { label: 'Low fiber (<15g/day)', active: log.fiber_g < 15 },
                { label: 'Antibiotic use (last 3 months)', active: log.antibiotic_recent },
              ].map(({ label, active }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] ${active ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    {active ? '✕' : '✓'}
                  </span>
                  <span className={active ? 'text-red-500' : 'text-text-secondary'}>{label}</span>
                </div>
              ))}
            </div>

            {/* Prebiotics vs Probiotics explainer */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">🔬 Prebiotics vs Probiotics</h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3 space-y-1.5">
                  <p className="font-semibold text-indigo-400">🌾 Prebiotics</p>
                  <p className="text-text-secondary">Food for your microbiome. Non-digestible fibers that feed beneficial bacteria.</p>
                  <p className="text-text-tertiary font-medium">Sources:</p>
                  <p className="text-text-secondary">Garlic, onion, leeks, asparagus, oats, bananas, chicory root, psyllium husk</p>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 space-y-1.5">
                  <p className="font-semibold text-emerald-400">🧫 Probiotics</p>
                  <p className="text-text-secondary">Live beneficial bacteria that transiently colonize the gut and modulate immune response.</p>
                  <p className="text-text-tertiary font-medium">Sources:</p>
                  <p className="text-text-secondary">Yogurt, kefir, kimchi, miso, tempeh, sauerkraut, supplements (L. rhamnosus, B. longum)</p>
                </div>
              </div>
              <p className="text-xs text-text-tertiary italic">Synbiotics = prebiotics + probiotics together for synergistic effect.</p>
            </div>
          </>
        )}

        {/* ═══════════════════ TAB: TRENDS ════════════════════════ */}
        {tab === 'trends' && (
          <>
            {logs.length === 0 && (
              <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                <p className="text-4xl mb-2">📊</p>
                <p className="text-sm text-text-secondary">Log a few days to see your trends here.</p>
              </div>
            )}

            {/* 30-day gut score line chart */}
            {trend.length > 1 && (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <h2 className="text-sm font-semibold text-text-primary">Gut Health Score — 30 Days</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trend} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Bristol type frequency donut */}
            {bristolFreq.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <h2 className="text-sm font-semibold text-text-primary">Bristol Type Frequency (30 days)</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={bristolFreq} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {bristolFreq.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Symptom frequency bar chart */}
            {symptomAvg.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <h2 className="text-sm font-semibold text-text-primary">Avg Symptom Severity (30 days)</h2>
                <p className="text-xs text-text-secondary">Scale 0–3 (0=none, 3=severe)</p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={symptomAvg} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                    <XAxis dataKey="symptom" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 3]} hide />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="avg" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Plant diversity weekly bar */}
            {plantTrend.length > 1 && (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <h2 className="text-sm font-semibold text-text-primary">🌱 Plant Diversity — Weekly</h2>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={plantTrend} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                    <XAxis dataKey="week" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 35]} hide />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Microbiome diversity proxy trend */}
            {microTrend.length > 1 && (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <h2 className="text-sm font-semibold text-text-primary">🧫 Microbiome Diversity Proxy</h2>
                <p className="text-xs text-text-secondary">Composite of plant diversity, fermented foods, fiber, and processed food penalty</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={microTrend} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="micro" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
