'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Droplets, FlaskConical, TrendingUp, AlertTriangle, CheckCircle, Info, Plus, Trash2 } from 'lucide-react'
import {
  URINE_COLORS, BEVERAGES_BHI,
  calculateHydrationGoal, calculateSweatRate, analyzeHydration,
  type HydrationLog, type BeverageEntry, type HydrationAnalysis,
} from '@/lib/hydration-science'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'today' | 'sweat' | 'trends'

interface TrendEntry {
  date: string
  water_ml: number
  urine_color: number
  goalMl: number
  percentOfGoal: number
  hydrationStatus: string
  effectiveHydrationMl: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: HydrationAnalysis['hydrationStatus']): string {
  switch (status) {
    case 'optimal':           return 'text-green-400'
    case 'adequate':          return 'text-lime-400'
    case 'mild_dehydration':  return 'text-yellow-400'
    case 'dehydration':       return 'text-orange-400'
    case 'severe_dehydration':return 'text-red-400'
    default:                  return 'text-text-secondary'
  }
}

function statusBg(status: HydrationAnalysis['hydrationStatus']): string {
  switch (status) {
    case 'optimal':           return 'bg-green-500/10 border-green-500/30'
    case 'adequate':          return 'bg-lime-500/10 border-lime-500/30'
    case 'mild_dehydration':  return 'bg-yellow-500/10 border-yellow-500/30'
    case 'dehydration':       return 'bg-orange-500/10 border-orange-500/30'
    case 'severe_dehydration':return 'bg-red-500/10 border-red-500/30'
    default:                  return 'bg-surface border-border'
  }
}

function statusLabel(status: HydrationAnalysis['hydrationStatus']): string {
  switch (status) {
    case 'optimal':           return '💧 Optimal Hydration'
    case 'adequate':          return '✅ Adequately Hydrated'
    case 'mild_dehydration':  return '⚠️ Mildly Dehydrated'
    case 'dehydration':       return '🔶 Dehydrated'
    case 'severe_dehydration':return '🚨 Severely Dehydrated'
    default:                  return 'Unknown'
  }
}

function fmtL(ml: number): string {
  return ml >= 1000 ? `${(ml / 1000).toFixed(2)}L` : `${ml}ml`
}

// ─── Circular Progress ────────────────────────────────────────────────────────

function CircularProgress({ pct, ml, goalMl }: { pct: number; ml: number; goalMl: number }) {
  const r = 60
  const circ = 2 * Math.PI * r
  const progress = Math.min(1, pct / 100)
  const dash = circ * progress
  const gap  = circ - dash

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={160} height={160} viewBox="0 0 160 160">
        <circle cx={80} cy={80} r={r} fill="none" stroke="currentColor" strokeWidth={14} className="text-border" />
        <circle
          cx={80} cy={80} r={r}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={circ / 4}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={80} y={72} textAnchor="middle" className="fill-text-primary" style={{ fontSize: 22, fontWeight: 700 }}>
          {pct}%
        </text>
        <text x={80} y={92} textAnchor="middle" className="fill-text-secondary" style={{ fontSize: 11 }}>
          {fmtL(ml)}
        </text>
        <text x={80} y={108} textAnchor="middle" className="fill-text-secondary" style={{ fontSize: 11 }}>
          of {fmtL(goalMl)}
        </text>
      </svg>
    </div>
  )
}

// ─── Urine Color Selector ─────────────────────────────────────────────────────

function UrineColorSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const selected = URINE_COLORS.find(c => c.level === value) ?? URINE_COLORS[0]
  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {URINE_COLORS.map(c => (
          <button
            key={c.level}
            onClick={() => onChange(c.level)}
            title={`${c.level}: ${c.label}`}
            className={`flex-1 rounded-lg transition-all ${value === c.level ? 'ring-2 ring-white scale-110 z-10' : 'opacity-70'}`}
            style={{ height: 36, backgroundColor: c.color }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span
          className="px-2 py-0.5 rounded text-xs font-semibold"
          style={{ backgroundColor: selected.color, color: selected.textColor }}
        >
          {selected.level}: {selected.label}
        </span>
        <span className="text-text-secondary">{selected.status}</span>
      </div>
      {value >= 7 && (
        <p className="text-xs text-red-400 font-medium flex items-center gap-1">
          <AlertTriangle size={12} /> Brown/orange urine may indicate severe dehydration — seek medical attention
        </p>
      )}
    </div>
  )
}

// ─── Beverage Row ─────────────────────────────────────────────────────────────

function BeverageRow({
  entry, onUpdate, onRemove,
}: {
  entry: BeverageEntry
  onUpdate: (e: BeverageEntry) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={entry.type}
        onChange={e => {
          const t = e.target.value
          onUpdate({ ...entry, type: t, bhi: BEVERAGES_BHI[t]?.bhi ?? 1.0 })
        }}
        className="flex-1 bg-surface border border-border rounded-xl px-2 py-1.5 text-sm text-text-primary"
      >
        {Object.entries(BEVERAGES_BHI).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
      <input
        type="number" min={0} max={2000} step={50}
        value={entry.volume_ml}
        onChange={e => onUpdate({ ...entry, volume_ml: Number(e.target.value) })}
        className="w-24 bg-surface border border-border rounded-xl px-2 py-1.5 text-sm text-text-primary text-right"
        placeholder="ml"
      />
      <span className="text-xs text-text-secondary w-16">BHI {entry.bhi.toFixed(2)}</span>
      <button onClick={onRemove} className="text-red-400 hover:text-red-300 transition-colors">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Default log ──────────────────────────────────────────────────────────────

function makeDefaultLog(): HydrationLog {
  return {
    date: new Date().toISOString().slice(0, 10),
    water_ml: 0,
    beverages: [],
    urine_color: 1,
    urine_frequency: 6,
    sodium_mg: 0,
    potassium_mg: 0,
    magnesium_mg: 0,
    electrolyte_drink: false,
    exercise_minutes: 0,
    exercise_intensity: 'none',
    ambient_temp_f: 72,
    altitude_ft: 0,
    is_pregnant: false,
    is_breastfeeding: false,
    weight_kg: 70,
    caffeine_drinks: 0,
  }
}

// ─── BHI Table ────────────────────────────────────────────────────────────────

function BHITable() {
  const sorted = Object.entries(BEVERAGES_BHI).sort((a, b) => b[1].bhi - a[1].bhi)
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
      <h3 className="font-semibold text-text-primary flex items-center gap-2">
        <FlaskConical size={16} className="text-primary" /> Beverage Hydration Index (Maughan 2016)
      </h3>
      <p className="text-xs text-text-secondary">BHI &gt; 1.0 = more hydrating than water; &lt; 1.0 = less hydrating</p>
      <div className="space-y-1">
        {sorted.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <span className="flex-1 text-sm text-text-primary">{v.label}</span>
            <div className="flex-1 bg-background rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${Math.min(100, (v.bhi / 1.5) * 100)}%`,
                  backgroundColor: v.bhi >= 1 ? '#3b82f6' : '#f97316',
                }}
              />
            </div>
            <span className="text-xs font-mono text-text-secondary w-8 text-right">{v.bhi.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HydrationClient() {
  const [tab, setTab] = useState<Tab>('today')
  const [log, setLog] = useState<HydrationLog>(makeDefaultLog())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [trends, setTrends] = useState<TrendEntry[]>([])
  const [allLogs, setAllLogs] = useState<HydrationLog[]>([])

  const analysis = analyzeHydration(log)

  // ── Sweat test state ──
  const [sweatPre, setSweatPre]        = useState('')
  const [sweatPost, setSweatPost]      = useState('')
  const [sweatFluid, setSweatFluid]    = useState('')
  const [sweatDur, setSweatDur]        = useState('')
  const [weightUnit, setWeightUnit]    = useState<'kg' | 'lbs'>('kg')

  const sweatLog: HydrationLog = {
    ...makeDefaultLog(),
    pre_exercise_weight_kg:  weightUnit === 'kg' ? Number(sweatPre)  : Number(sweatPre)  / 2.20462,
    post_exercise_weight_kg: weightUnit === 'kg' ? Number(sweatPost) : Number(sweatPost) / 2.20462,
    exercise_fluid_ml: Number(sweatFluid) || 0,
    exercise_duration_min: Number(sweatDur) || 0,
  }
  const sweatRate = calculateSweatRate(sweatLog)

  // ── Load data ──
  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/hydration-science')
      if (!res.ok) return
      const json = await res.json()
      if (json.todayLog) {
        setLog({ ...makeDefaultLog(), ...json.todayLog, beverages: json.todayLog.beverages ?? [] })
      }
      setTrends((json.trend ?? []).reverse())
      setAllLogs(json.logs ?? [])
    } catch {}
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Save ──
  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/hydration-science', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      await loadData()
    } catch {}
    setSaving(false)
  }

  // ── Beverage helpers ──
  const addBeverage = () => {
    setLog(l => ({ ...l, beverages: [...(l.beverages ?? []), { type: 'water', volume_ml: 250, bhi: 1.0 }] }))
  }
  const updateBeverage = (i: number, e: BeverageEntry) => {
    setLog(l => { const b = [...(l.beverages ?? [])]; b[i] = e; return { ...l, beverages: b } })
  }
  const removeBeverage = (i: number) => {
    setLog(l => { const b = [...(l.beverages ?? [])]; b.splice(i, 1); return { ...l, beverages: b } })
  }

  // ── Trend chart data ──
  const trendChartData = trends.map(t => ({
    date: t.date.slice(5),
    pct: t.percentOfGoal,
    urine: t.urine_color,
    ml: Math.round(t.effectiveHydrationMl),
    goal: t.goalMl,
  }))

  // ── Status distribution for pie ──
  const statusCounts: Record<string, number> = {}
  allLogs.forEach((l: HydrationLog) => {
    const s = analyzeHydration(l).hydrationStatus
    statusCounts[s] = (statusCounts[s] ?? 0) + 1
  })
  const pieData = Object.entries(statusCounts).map(([k, v]) => ({
    name: k.replace(/_/g, ' '),
    value: v,
    color: k === 'optimal' ? '#22c55e' : k === 'adequate' ? '#84cc16' : k === 'mild_dehydration' ? '#eab308' : k === 'dehydration' ? '#f97316' : '#ef4444',
  }))

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Droplets className="text-primary" size={28} />
          <div>
            <h1 className="text-xl font-bold text-text-primary">Hydration Science v2</h1>
            <p className="text-xs text-text-secondary">IOM · Armstrong scale · Montain & Coyle · Shirreffs</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface rounded-2xl p-1 border border-border">
          {(['today', 'sweat', 'trends'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t === 'today' ? '💧 Today' : t === 'sweat' ? '🏃 Sweat Test' : '📊 Trends'}
            </button>
          ))}
        </div>

        {/* ── TODAY TAB ── */}
        {tab === 'today' && (
          <div className="space-y-4">

            {/* Status banner */}
            <div className={`border rounded-2xl p-4 ${statusBg(analysis.hydrationStatus)}`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${statusColor(analysis.hydrationStatus)}`}>
                  {statusLabel(analysis.hydrationStatus)}
                </span>
                <span className="text-xs text-text-secondary">{analysis.urineColorStatus}</span>
              </div>
              {analysis.hyponatremiaRisk && (
                <div className="mt-2 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-2 text-xs text-red-300">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span><strong>Hyponatremia Risk:</strong> You are drinking large volumes of plain water during extended exercise — add electrolytes (Noakes 2012)</span>
                </div>
              )}
            </div>

            {/* Circular progress + goal breakdown */}
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <CircularProgress
                pct={analysis.percentOfGoal}
                ml={analysis.effectiveHydrationMl}
                goalMl={analysis.goalMl}
              />
              <div className="flex-1 space-y-1 text-sm w-full">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Goal</span>
                  <span className="font-mono">{fmtL(analysis.goalMl)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Consumed</span>
                  <span className="font-mono">{fmtL(analysis.totalFluidMl)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Effective (BHI)</span>
                  <span className="font-mono">{fmtL(analysis.effectiveHydrationMl)}</span>
                </div>
                {analysis.deficit > 0 && (
                  <div className="flex justify-between text-orange-400">
                    <span>Remaining</span>
                    <span className="font-mono">{fmtL(analysis.deficit)}</span>
                  </div>
                )}
                {/* Goal breakdown */}
                <div className="pt-2 border-t border-border space-y-0.5 text-xs text-text-secondary">
                  <div>Base: {(log.weight_kg ?? 70)} kg × 35ml = {Math.round((log.weight_kg ?? 70) * 35)}ml</div>
                  {log.exercise_minutes > 0 && <div>Exercise: +{log.exercise_minutes}min {log.exercise_intensity}</div>}
                  {log.ambient_temp_f > 85 && <div>Heat: +300ml</div>}
                  {log.caffeine_drinks > 0 && <div>Caffeine: +{log.caffeine_drinks * 150}ml</div>}
                  {log.altitude_ft > 8000 && <div>Altitude: +500ml</div>}
                  {log.is_pregnant && <div>Pregnancy: +300ml</div>}
                  {log.is_breastfeeding && <div>Breastfeeding: +700ml</div>}
                </div>
              </div>
            </div>

            {/* Urine color */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-text-primary text-sm">Urine Color (Armstrong 1994)</h3>
              <UrineColorSelector value={log.urine_color} onChange={v => setLog(l => ({ ...l, urine_color: v }))} />
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-secondary">Frequency today</label>
                <input
                  type="number" min={0} max={20}
                  value={log.urine_frequency}
                  onChange={e => setLog(l => ({ ...l, urine_frequency: Number(e.target.value) }))}
                  className="w-16 bg-background border border-border rounded-xl px-2 py-1 text-sm text-center text-text-primary"
                />
                <span className="text-xs text-text-secondary">times</span>
              </div>
            </div>

            {/* Water intake */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-text-primary text-sm">💧 Water Intake</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Plain water</span>
                  <span className="font-mono">{fmtL(log.water_ml)}</span>
                </div>
                <input
                  type="range" min={0} max={5000} step={50}
                  value={log.water_ml}
                  onChange={e => setLog(l => ({ ...l, water_ml: Number(e.target.value) }))}
                  className="w-full accent-primary"
                />
                {/* Quick adds */}
                <div className="flex gap-1">
                  {[200, 300, 500, 750].map(ml => (
                    <button
                      key={ml}
                      onClick={() => setLog(l => ({ ...l, water_ml: l.water_ml + ml }))}
                      className="flex-1 py-1.5 text-xs rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                    >
                      +{ml}ml
                    </button>
                  ))}
                </div>
              </div>

              {/* Beverages */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Other beverages</span>
                  <button onClick={addBeverage} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                    <Plus size={12} /> Add
                  </button>
                </div>
                {(log.beverages ?? []).map((b, i) => (
                  <BeverageRow key={i} entry={b} onUpdate={e => updateBeverage(i, e)} onRemove={() => removeBeverage(i)} />
                ))}
              </div>
            </div>

            {/* Electrolytes */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-text-primary text-sm">⚡ Electrolytes (Shirreffs 2003)</h3>
              <div className="grid grid-cols-3 gap-2">
                {([['Sodium', 'sodium_mg', 2300], ['Potassium', 'potassium_mg', 3500], ['Magnesium', 'magnesium_mg', 420]] as [string, keyof HydrationLog, number][]).map(
                  ([label, key, max]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs text-text-secondary">{label} (mg)</label>
                      <input
                        type="number" min={0} max={max} step={10}
                        value={log[key] as number ?? 0}
                        onChange={e => setLog(l => ({ ...l, [key]: Number(e.target.value) }))}
                        className="w-full bg-background border border-border rounded-xl px-2 py-1.5 text-sm text-text-primary text-center"
                      />
                    </div>
                  )
                )}
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={log.electrolyte_drink}
                  onChange={e => setLog(l => ({ ...l, electrolyte_drink: e.target.checked }))}
                  className="accent-primary"
                />
                <span className="text-text-primary">Had an electrolyte drink today</span>
              </label>
              {!analysis.electrolytesAdequate && (
                <p className="text-xs text-orange-400 flex items-center gap-1">
                  <AlertTriangle size={12} /> After prolonged exercise, replenish sodium (500–2300mg) and electrolytes
                </p>
              )}
            </div>

            {/* Context */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-text-primary text-sm">📋 Context</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Body weight (kg)</label>
                  <input
                    type="number" min={30} max={200} step={0.5}
                    value={log.weight_kg ?? 70}
                    onChange={e => setLog(l => ({ ...l, weight_kg: Number(e.target.value) }))}
                    className="w-full bg-background border border-border rounded-xl px-2 py-1.5 text-sm text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Caffeine drinks</label>
                  <input
                    type="number" min={0} max={10}
                    value={log.caffeine_drinks}
                    onChange={e => setLog(l => ({ ...l, caffeine_drinks: Number(e.target.value) }))}
                    className="w-full bg-background border border-border rounded-xl px-2 py-1.5 text-sm text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Exercise (min)</label>
                  <input
                    type="number" min={0} max={480} step={5}
                    value={log.exercise_minutes}
                    onChange={e => setLog(l => ({ ...l, exercise_minutes: Number(e.target.value) }))}
                    className="w-full bg-background border border-border rounded-xl px-2 py-1.5 text-sm text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Intensity</label>
                  <select
                    value={log.exercise_intensity}
                    onChange={e => setLog(l => ({ ...l, exercise_intensity: e.target.value as HydrationLog['exercise_intensity'] }))}
                    className="w-full bg-background border border-border rounded-xl px-2 py-1.5 text-sm text-text-primary"
                  >
                    <option value="none">None</option>
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="vigorous">Vigorous</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Temperature (°F)</label>
                  <input
                    type="number" min={32} max={120}
                    value={log.ambient_temp_f}
                    onChange={e => setLog(l => ({ ...l, ambient_temp_f: Number(e.target.value) }))}
                    className="w-full bg-background border border-border rounded-xl px-2 py-1.5 text-sm text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Altitude (ft)</label>
                  <input
                    type="number" min={0} max={30000} step={500}
                    value={log.altitude_ft}
                    onChange={e => setLog(l => ({ ...l, altitude_ft: Number(e.target.value) }))}
                    className="w-full bg-background border border-border rounded-xl px-2 py-1.5 text-sm text-text-primary"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={log.is_pregnant} onChange={e => setLog(l => ({ ...l, is_pregnant: e.target.checked }))} className="accent-primary" />
                  <span>Pregnant</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={log.is_breastfeeding} onChange={e => setLog(l => ({ ...l, is_breastfeeding: e.target.checked }))} className="accent-primary" />
                  <span>Breastfeeding</span>
                </label>
              </div>
            </div>

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
                <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                  <Info size={14} className="text-primary" /> Recommendations
                </h3>
                <ul className="space-y-1">
                  {analysis.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                      <CheckCircle size={11} className="text-primary shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Today\'s Log'}
            </button>
          </div>
        )}

        {/* ── SWEAT TEST TAB ── */}
        {tab === 'sweat' && (
          <div className="space-y-4">

            {/* Calculator */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-text-primary">Sweat Rate Calculator</h3>
                <div className="flex gap-1 bg-background rounded-xl p-0.5 border border-border">
                  {(['kg', 'lbs'] as const).map(u => (
                    <button
                      key={u}
                      onClick={() => setWeightUnit(u)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${weightUnit === u ? 'bg-primary text-white' : 'text-text-secondary'}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-text-secondary italic">Montain & Coyle 1992: sweat_rate = ((pre − post) × 1000 + fluid_consumed) / hours</p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Pre-exercise weight', sweatPre, setSweatPre],
                  ['Post-exercise weight', sweatPost, setSweatPost],
                ].map(([label, value, setter]) => (
                  <div key={label as string} className="space-y-1">
                    <label className="text-xs text-text-secondary">{label as string} ({weightUnit})</label>
                    <input
                      type="number" step="0.1" min={30}
                      value={value as string}
                      onChange={e => (setter as (v: string) => void)(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
                      placeholder={weightUnit === 'kg' ? '70.0' : '154.0'}
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Fluid consumed (ml)</label>
                  <input
                    type="number" step="50" min={0}
                    value={sweatFluid}
                    onChange={e => setSweatFluid(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
                    placeholder="500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Exercise duration (min)</label>
                  <input
                    type="number" step="5" min={1}
                    value={sweatDur}
                    onChange={e => setSweatDur(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
                    placeholder="60"
                  />
                </div>
              </div>

              {sweatRate != null && sweatRate > 0 && (
                <div className="bg-background border border-border rounded-2xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{Math.round(sweatRate)}</div>
                      <div className="text-xs text-text-secondary">ml / hour</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">{(sweatRate / 1000).toFixed(2)}</div>
                      <div className="text-xs text-text-secondary">L / hour</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Rehydration target (1.5×)</span>
                      <span className="font-mono text-green-400">{fmtL(Math.round(sweatRate * 1.5))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Sodium lost (~920mg/L)</span>
                      <span className="font-mono text-text-primary">{Math.round(sweatRate * 0.92)}mg/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Potassium lost (~160mg/L)</span>
                      <span className="font-mono text-text-primary">{Math.round(sweatRate * 0.16)}mg/hr</span>
                    </div>
                  </div>

                  {/* Hydration plan */}
                  <div className="pt-2 border-t border-border space-y-1">
                    <h4 className="text-xs font-semibold text-text-primary">Exercise Hydration Plan</h4>
                    <div className="text-xs text-text-secondary space-y-0.5">
                      <div>🔵 <strong>Before:</strong> 500ml water 2h prior; 250ml 20min before</div>
                      <div>🔵 <strong>During:</strong> {Math.round(sweatRate / 4)}ml every 15min ({fmtL(Math.round(sweatRate))} / hr)</div>
                      <div>🔵 <strong>After:</strong> {fmtL(Math.round(sweatRate * 1.5))} within 2h to restore 150% losses (Shirreffs 2003)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Why track sweat rate */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
              <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                <Info size={14} className="text-primary" /> Why Track Sweat Rate?
              </h3>
              <div className="text-xs text-text-secondary space-y-1.5">
                <p>Sweat rate varies 6–10× between individuals (0.5–2.5 L/hr). Generic "drink 8 glasses" advice ignores this entirely.</p>
                <p><strong className="text-text-primary">Cheuvront & Kenefick 2014:</strong> Dehydration exceeding 2% body weight causes measurable cognitive and aerobic performance impairment.</p>
                <p><strong className="text-text-primary">Montain & Coyle 1992:</strong> Replacing fluid losses at the rate they occur maintains core temperature and reduces cardiovascular strain.</p>
                <p><strong className="text-text-primary">Shirreffs 2003:</strong> Drink 1.5× sweat losses post-exercise to account for ongoing urinary losses during recovery.</p>
              </div>
            </div>

            {/* BHI table */}
            <BHITable />
          </div>
        )}

        {/* ── TRENDS TAB ── */}
        {tab === 'trends' && (
          <div className="space-y-4">

            {trendChartData.length === 0 && (
              <div className="text-center text-text-secondary py-12">
                <Droplets size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No trend data yet. Start logging to see insights.</p>
              </div>
            )}

            {trendChartData.length > 0 && (
              <>
                {/* % of goal bar chart */}
                <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
                  <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                    <TrendingUp size={14} className="text-primary" /> Hydration vs Goal (%)
                  </h3>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={trendChartData}>
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                      <YAxis hide />
                      <Tooltip formatter={(v: number) => [`${v}%`, 'Goal %']} />
                      <ReferenceLine y={100} stroke="#3b82f6" strokeDasharray="4 4" />
                      <Bar
                        dataKey="pct"
                        radius={[4, 4, 0, 0]}
                        fill="#3b82f6"
                        label={false}
                      >
                        {trendChartData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.pct >= 100 ? '#22c55e' : entry.pct >= 80 ? '#84cc16' : entry.pct >= 60 ? '#eab308' : '#ef4444'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Urine color trend */}
                <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
                  <h3 className="font-semibold text-text-primary text-sm">Urine Color Trend (lower = better)</h3>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                      <YAxis domain={[1, 8]} ticks={[1, 2, 3, 4, 5, 6, 7, 8]} tick={{ fontSize: 9 }} />
                      <Tooltip formatter={(v: number) => [`${v}: ${URINE_COLORS[v - 1]?.label ?? ''}`, 'Urine color']} />
                      <ReferenceLine y={3} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Optimal', position: 'right', fontSize: 9 }} />
                      <Line type="monotone" dataKey="urine" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Water vs goal line chart */}
                <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
                  <h3 className="font-semibold text-text-primary text-sm">Water Intake vs Goal (ml)</h3>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip formatter={(v: number) => [fmtL(v), '']} />
                      <Line type="monotone" dataKey="ml" name="Consumed" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="goal" name="Goal" stroke="#6b7280" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Status distribution pie */}
                {pieData.length > 0 && (
                  <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
                    <h3 className="font-semibold text-text-primary text-sm">Hydration Status Distribution</h3>
                    <div className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Legend formatter={(v) => <span className="text-xs text-text-secondary">{v}</span>} />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
