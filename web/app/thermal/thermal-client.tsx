'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, CartesianGrid,
} from 'recharts'
import { Thermometer, Snowflake, Flame, RefreshCw, AlertTriangle, Star, ChevronDown, ChevronUp, Save, CheckCircle, BookOpen, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type ThermalLog,
  type ThermalAnalysis,
  type ProtocolCard,
  COLD_PROTOCOLS,
  SAUNA_PROTOCOLS,
  SAFETY_GUIDELINES,
  COLD_WEEKLY_TARGET_MIN,
  SAUNA_WEEKLY_TARGET_MIN,
  fahrenheitToCelsius,
  celsiusToFahrenheit,
} from '@/lib/thermoregulation'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiData {
  logs: ThermalLog[]
  analysis: ThermalAnalysis
  totalColdMin: number
  totalSaunaMin: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const COLD_METHODS = [
  { value: 'cold_plunge', label: 'Cold Plunge 🏊', minTemp: 45, maxTemp: 65 },
  { value: 'ice_bath', label: 'Ice Bath 🧊', minTemp: 35, maxTemp: 55 },
  { value: 'cold_shower', label: 'Cold Shower 🚿', minTemp: 50, maxTemp: 70 },
  { value: 'cryotherapy', label: 'Cryotherapy ❄️', minTemp: -130, maxTemp: -50 },
  { value: 'cold_lake', label: 'Cold Lake/River 🌊', minTemp: 40, maxTemp: 65 },
]
const SAUNA_METHODS = [
  { value: 'dry_sauna', label: 'Dry Sauna 🔥', minTemp: 170, maxTemp: 212 },
  { value: 'steam_room', label: 'Steam Room 💨', minTemp: 100, maxTemp: 125 },
  { value: 'infrared_sauna', label: 'Infrared Sauna ☀️', minTemp: 120, maxTemp: 150 },
  { value: 'hot_bath', label: 'Hot Bath 🛁', minTemp: 100, maxTemp: 110 },
]
const CONTRAST_METHODS = [{ value: 'contrast', label: 'Contrast Therapy 🔄', minTemp: 50, maxTemp: 212 }]
const TIME_OF_DAY = ['morning', 'afternoon', 'evening', 'night']

const DEFAULT_FORM: Omit<ThermalLog, 'id' | 'user_id' | 'created_at'> = {
  date: new Date().toISOString().slice(0, 10),
  session_type: 'cold',
  method: 'cold_plunge',
  temp_f: 55,
  duration_min: 5,
  protocol: 'metabolism',
  time_of_day: 'morning',
  alertness_after: 3,
  mood_after: 3,
  recovery_rating: 3,
  sleep_quality_that_night: 3,
  notes: '',
}

// ─── Progress Ring ────────────────────────────────────────────────────────────
function ProgressRing({ pct, color, size = 80, label, value, target }: {
  pct: number
  color: string
  size?: number
  label: string
  value: number
  target: number
}) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const stroke = Math.min(pct / 100, 1) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={8} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={`${stroke} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
          {pct}%
        </span>
      </div>
      <p className="text-[11px] text-text-secondary text-center leading-tight">{label}</p>
      <p className="text-[11px] font-semibold text-text-primary">{value}/{target} min</p>
    </div>
  )
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary w-36 shrink-0">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn('w-6 h-6 transition-transform hover:scale-110', n <= value ? 'text-amber-400' : 'text-text-secondary/30')}
          >
            <Star className="w-5 h-5 fill-current" />
          </button>
        ))}
      </div>
      <span className="text-xs text-text-secondary ml-1">{value}/5</span>
    </div>
  )
}

// ─── Safety Banner ────────────────────────────────────────────────────────────
function SafetyBanner() {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-2xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4">
      <button
        type="button"
        className="flex items-center justify-between w-full"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span className="font-semibold text-sm text-red-800 dark:text-red-300">Safety Guidelines — Read Before Every Session</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-red-500" /> : <ChevronDown className="w-4 h-4 text-red-500" />}
      </button>
      {expanded && (
        <ul className="mt-3 space-y-2">
          {SAFETY_GUIDELINES.map((g, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-red-800 dark:text-red-300">
              <span className="text-base shrink-0">{g.icon}</span>
              <span>{g.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Protocol Card ────────────────────────────────────────────────────────────
function ProtocolCardView({ p }: { p: ProtocolCard }) {
  const [open, setOpen] = useState(false)
  const isHeat = p.type === 'sauna'
  const color = isHeat ? '#f97316' : p.type === 'contrast' ? '#8b5cf6' : '#0ea5e9'
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <button type="button" className="flex items-start justify-between w-full gap-2" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
            {p.type === 'cold' && <Snowflake className="w-4 h-4" style={{ color }} />}
            {p.type === 'sauna' && <Flame className="w-4 h-4" style={{ color }} />}
            {p.type === 'contrast' && <RefreshCw className="w-4 h-4" style={{ color }} />}
          </div>
          <div className="min-w-0 text-left">
            <p className="font-semibold text-sm text-text-primary">{p.title}</p>
            <p className="text-xs text-text-secondary">{p.target_duration_min[0]}-{p.target_duration_min[1]} min · {p.target_temp_f[0]}-{p.target_temp_f[1]}°F</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-text-secondary shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-text-secondary shrink-0 mt-1" />}
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-text-primary leading-relaxed">{p.description}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${color}20`, color }}>
              🎯 {p.best_use_case}
            </span>
          </div>
          {p.caveats && (
            <p className="text-amber-700 dark:text-amber-400 text-xs flex items-start gap-1">
              <span>⚠️</span> {p.caveats}
            </p>
          )}
          <p className="text-text-secondary text-xs italic">📚 {p.citation}</p>
        </div>
      )}
    </div>
  )
}

// ─── Log Session Tab ──────────────────────────────────────────────────────────
function LogSessionTab({ onSaved, analysis }: { onSaved: () => void; analysis: ThermalAnalysis | null }) {
  const [form, setForm] = useState({ ...DEFAULT_FORM })
  const [useCelsius, setUseCelsius] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const methods = form.session_type === 'cold' ? COLD_METHODS : form.session_type === 'sauna' ? SAUNA_METHODS : CONTRAST_METHODS
  const protocols = form.session_type === 'cold'
    ? COLD_PROTOCOLS.map(p => ({ value: p.id, label: p.title }))
    : form.session_type === 'sauna'
      ? SAUNA_PROTOCOLS.map(p => ({ value: p.id, label: p.title }))
      : [{ value: 'contrast', label: 'Contrast Therapy' }]

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function handleTypeChange(t: ThermalLog['session_type']) {
    const defaultMethod = t === 'cold' ? 'cold_plunge' : t === 'sauna' ? 'dry_sauna' : 'contrast'
    const defaultProtocol = t === 'cold' ? 'metabolism' : t === 'sauna' ? 'cardiovascular' : 'contrast'
    const defaultTemp = t === 'cold' ? 55 : t === 'sauna' ? 185 : 55
    setForm(f => ({ ...f, session_type: t, method: defaultMethod, protocol: defaultProtocol, temp_f: defaultTemp }))
  }

  function handleTempChange(raw: number) {
    setField('temp_f', useCelsius ? celsiusToFahrenheit(raw) : raw)
  }

  const displayTemp = useCelsius ? fahrenheitToCelsius(form.temp_f) : form.temp_f
  const [minT, maxT] = useCelsius ? [-90, 55] : [-130, 220]

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/thermal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onSaved()
      setForm({ ...DEFAULT_FORM, date: new Date().toISOString().slice(0, 10) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Weekly progress rings */}
      {analysis && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">This Week's Progress</p>
          <div className="flex justify-around">
            <ProgressRing
              pct={analysis.cold_target_pct}
              color="#0ea5e9"
              label="Cold (Søberg 11 min)"
              value={analysis.weekly_cold_min}
              target={COLD_WEEKLY_TARGET_MIN}
            />
            <ProgressRing
              pct={analysis.sauna_target_pct}
              color="#f97316"
              label="Sauna (Laukkanen 57 min)"
              value={analysis.weekly_sauna_min}
              target={SAUNA_WEEKLY_TARGET_MIN}
            />
            <div className="flex flex-col items-center gap-1">
              <div className="w-20 h-20 rounded-full border-4 border-violet-400 flex items-center justify-center">
                <span className="text-sm font-bold text-violet-500">{analysis.streak}d</span>
              </div>
              <p className="text-[11px] text-text-secondary text-center">Streak</p>
              <p className="text-[11px] font-semibold text-text-primary">{analysis.weekly_score}/100</p>
            </div>
          </div>
          {analysis.recommendations.length > 0 && (
            <ul className="mt-3 space-y-1">
              {analysis.recommendations.map((r, i) => (
                <li key={i} className="text-xs text-text-secondary">{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Session type selector */}
      <div>
        <p className="text-sm font-semibold text-text-primary mb-2">Session Type</p>
        <div className="grid grid-cols-3 gap-2">
          {([['cold', '❄️ Cold', '#0ea5e9'], ['sauna', '🔥 Sauna', '#f97316'], ['contrast', '🔄 Contrast', '#8b5cf6']] as const).map(([t, label, color]) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={cn(
                'rounded-2xl border p-3 text-sm font-medium transition-all',
                form.session_type === t
                  ? 'text-white border-transparent'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              )}
              style={form.session_type === t ? { background: color, borderColor: color } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Method */}
      <div>
        <label className="text-sm font-semibold text-text-primary block mb-1">Method</label>
        <select
          value={form.method}
          onChange={e => setField('method', e.target.value)}
          className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {methods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      {/* Protocol */}
      <div>
        <label className="text-sm font-semibold text-text-primary block mb-1">Protocol</label>
        <select
          value={form.protocol}
          onChange={e => setField('protocol', e.target.value)}
          className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {protocols.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {/* Date + time of day */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-semibold text-text-primary block mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setField('date', e.target.value)}
            className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-text-primary block mb-1">Time of Day</label>
          <select
            value={form.time_of_day}
            onChange={e => setField('time_of_day', e.target.value)}
            className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {TIME_OF_DAY.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Temperature */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-semibold text-text-primary">Temperature</label>
          <button
            type="button"
            onClick={() => setUseCelsius(v => !v)}
            className="text-xs px-2 py-1 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors"
          >
            {useCelsius ? '°C → °F' : '°F → °C'}
          </button>
        </div>
        <input
          type="range"
          min={minT}
          max={maxT}
          value={displayTemp}
          onChange={e => handleTempChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          <span>{minT}°{useCelsius ? 'C' : 'F'}</span>
          <span className="font-bold text-text-primary text-sm">{displayTemp}°{useCelsius ? 'C' : 'F'} ({form.temp_f}°F)</span>
          <span>{maxT}°{useCelsius ? 'C' : 'F'}</span>
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="text-sm font-semibold text-text-primary block mb-1">
          Duration: <span className="text-primary">{form.duration_min} min</span>
        </label>
        <input
          type="range"
          min={1}
          max={60}
          value={form.duration_min}
          onChange={e => setField('duration_min', Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-text-secondary mt-1"><span>1 min</span><span>60 min</span></div>
      </div>

      {/* After-effects ratings */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-text-primary">After-Effects Ratings</p>
        <StarRating value={form.alertness_after} onChange={v => setField('alertness_after', v)} label="Alertness" />
        <StarRating value={form.mood_after} onChange={v => setField('mood_after', v)} label="Mood boost" />
        <StarRating value={form.recovery_rating} onChange={v => setField('recovery_rating', v)} label="Recovery feel" />
        <StarRating value={form.sleep_quality_that_night} onChange={v => setField('sleep_quality_that_night', v)} label="Sleep quality (tonight)" />
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-semibold text-text-primary block mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => setField('notes', e.target.value)}
          placeholder="How did it feel? Any observations..."
          rows={3}
          className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      <SafetyBanner />

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-2xl bg-primary text-white font-semibold py-3 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : saving ? 'Saving…' : 'Log Session'}
      </button>
    </div>
  )
}

// ─── Protocols Tab ────────────────────────────────────────────────────────────
function ProtocolsTab() {
  return (
    <div className="space-y-6">
      <SafetyBanner />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Snowflake className="w-5 h-5 text-sky-500" />
          <h2 className="font-semibold text-text-primary">Cold Exposure Protocols</h2>
        </div>
        <div className="space-y-3">
          {COLD_PROTOCOLS.map(p => <ProtocolCardView key={p.id} p={p} />)}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="font-semibold text-text-primary">Sauna Protocols</h2>
        </div>
        <div className="space-y-3">
          {SAUNA_PROTOCOLS.map(p => <ProtocolCardView key={p.id} p={p} />)}
        </div>
      </div>

      <div className="rounded-2xl border border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <h3 className="font-semibold text-sm text-violet-800 dark:text-violet-300">Contrast Therapy Guide</h3>
        </div>
        <ol className="space-y-1 text-sm text-violet-800 dark:text-violet-300 list-decimal list-inside">
          <li>3-4 min hot (sauna / hot tub ~100-104°F)</li>
          <li>1-2 min cold (plunge / shower ~50-59°F)</li>
          <li>Repeat 3-4 rounds</li>
          <li>
            <span className="font-medium">End on COLD</span> for alertness &amp; energy
          </li>
          <li>
            <span className="font-medium">End on WARM</span> for relaxation &amp; sleep
          </li>
        </ol>
        <p className="text-xs text-violet-700 dark:text-violet-400 mt-2 italic">
          📚 Bieuzen et al. PLoS ONE 2013 — contrast superior to passive recovery
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-text-secondary" />
          <h3 className="font-semibold text-sm text-text-primary">Research Summary</h3>
        </div>
        <ul className="space-y-2 text-xs text-text-secondary">
          <li>🧊 <strong>Søberg et al. 2021</strong> — 11 min cold/week at 10-15°C activates brown adipose tissue, increases metabolism</li>
          <li>❄️ <strong>Tipton et al. 2017</strong> — Cold water immersion: norepinephrine +300%, dopamine +250% (sustained hours)</li>
          <li>💪 <strong>Peake et al. 2017</strong> — Reduces DOMS; avoid immediately post-strength training (blunts hypertrophy)</li>
          <li>🔥 <strong>Laukkanen et al. 2018 (JAMA Intern Med)</strong> — Sauna 4×/week: CVD mortality -50%, all-cause mortality -40%</li>
          <li>🧠 <strong>Huberman Lab 2022</strong> — 11 min cold/week target; morning cold for alertness; time of day matters</li>
        </ul>
      </div>
    </div>
  )
}

// ─── Trends Tab ───────────────────────────────────────────────────────────────
function TrendsTab({ logs, analysis, totalColdMin, totalSaunaMin }: {
  logs: ThermalLog[]
  analysis: ThermalAnalysis | null
  totalColdMin: number
  totalSaunaMin: number
}) {
  // 30-day bar chart data grouped by date + type
  const barData = (() => {
    const byDate: Record<string, { date: string; cold: number; sauna: number; contrast: number }> = {}
    logs.forEach(l => {
      if (!byDate[l.date]) byDate[l.date] = { date: l.date, cold: 0, sauna: 0, contrast: 0 }
      byDate[l.date][l.session_type] += l.duration_min
    })
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)).slice(-20)
  })()

  // Weekly cold + sauna minutes per week
  const weeklyData = (() => {
    const byWeek: Record<string, { week: string; cold: number; sauna: number }> = {}
    logs.forEach(l => {
      const d = new Date(l.date)
      const day = d.getDay()
      const monday = new Date(d)
      monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
      const wk = monday.toISOString().slice(0, 10)
      if (!byWeek[wk]) byWeek[wk] = { week: wk, cold: 0, sauna: 0 }
      if (l.session_type === 'cold' || l.session_type === 'contrast') byWeek[wk].cold += l.duration_min
      if (l.session_type === 'sauna' || l.session_type === 'contrast') byWeek[wk].sauna += l.duration_min
    })
    return Object.values(byWeek).sort((a, b) => a.week.localeCompare(b.week))
  })()

  // After-effects trends
  const effectsData = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(l => ({ date: l.date.slice(5), mood: l.mood_after, alertness: l.alertness_after, recovery: l.recovery_rating }))

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-sky-500">{totalColdMin}</p>
          <p className="text-xs text-text-secondary">Total cold min</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-orange-500">{totalSaunaMin}</p>
          <p className="text-xs text-text-secondary">Total sauna min</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-violet-500">{Math.round(analysis?.hormetic_dose ?? 0)}</p>
          <p className="text-xs text-text-secondary">Hormetic dose</p>
        </div>
      </div>

      {/* 30-day sessions bar chart */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-text-secondary" />
          <h3 className="font-semibold text-sm text-text-primary">30-Day Session Log (minutes)</h3>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={barData} barSize={8}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
              tickFormatter={d => d.slice(5)} />
            <YAxis hide />
            <Tooltip formatter={(v: number, name: string) => [`${v} min`, name]} />
            <Bar dataKey="cold" stackId="a" fill="#0ea5e9" name="Cold" radius={[0, 0, 0, 0]} />
            <Bar dataKey="sauna" stackId="a" fill="#f97316" name="Sauna" radius={[0, 0, 0, 0]} />
            <Bar dataKey="contrast" stackId="a" fill="#8b5cf6" name="Contrast" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly minutes vs targets */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="font-semibold text-sm text-text-primary mb-1">Weekly Minutes vs Targets</h3>
        <p className="text-xs text-text-secondary mb-3">Cold target: {COLD_WEEKLY_TARGET_MIN} min · Sauna target: {SAUNA_WEEKLY_TARGET_MIN} min</p>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="cold" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} name="Cold min" />
            <Line type="monotone" dataKey="sauna" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Sauna min" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* After-effects trends */}
      {effectsData.length > 1 && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h3 className="font-semibold text-sm text-text-primary mb-3">After-Effects Trend (1-5)</h3>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={effectsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="mood" stroke="#f59e0b" strokeWidth={2} dot={false} name="Mood" />
              <Line type="monotone" dataKey="alertness" stroke="#10b981" strokeWidth={2} dot={false} name="Alertness" />
              <Line type="monotone" dataKey="recovery" stroke="#6366f1" strokeWidth={2} dot={false} name="Recovery" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Hormetic dose accumulator */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="font-semibold text-sm text-text-primary mb-2">Hormetic Dose Accumulator (30 days)</h3>
        <p className="text-xs text-text-secondary mb-2">Weighted thermal stress: cold 1.2×/min · contrast 1.0×/min · sauna 0.8×/min</p>
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold text-primary">{Math.round(analysis?.hormetic_dose ?? 0)}</span>
          <span className="text-text-secondary text-sm mb-1">pts</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-violet-500 to-orange-500 transition-all"
            style={{ width: `${Math.min(100, ((analysis?.hormetic_dose ?? 0) / 300) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-secondary mt-1"><span>0</span><span>Elite: 300+</span></div>
      </div>
    </div>
  )
}

// ─── Main Client ──────────────────────────────────────────────────────────────
export function ThermalClient() {
  const [tab, setTab] = useState<'log' | 'protocols' | 'trends'>('log')
  const [data, setData] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/thermal')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const tabs = [
    { id: 'log' as const, label: 'Log Session', icon: Thermometer },
    { id: 'protocols' as const, label: 'Protocols', icon: BookOpen },
    { id: 'trends' as const, label: 'Trends', icon: TrendingUp },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-24">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-orange-500 flex items-center justify-center">
          <Thermometer className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Thermal Tracker</h1>
          <p className="text-xs text-text-secondary">Cold · Sauna · Contrast therapy</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-surface border border-border rounded-2xl p-1 mb-5 gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all',
              tab === id
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-surface border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {tab === 'log' && <LogSessionTab onSaved={load} analysis={data?.analysis ?? null} />}
          {tab === 'protocols' && <ProtocolsTab />}
          {tab === 'trends' && (
            <TrendsTab
              logs={data?.logs ?? []}
              analysis={data?.analysis ?? null}
              totalColdMin={data?.totalColdMin ?? 0}
              totalSaunaMin={data?.totalSaunaMin ?? 0}
            />
          )}
        </>
      )}
    </div>
  )
}
