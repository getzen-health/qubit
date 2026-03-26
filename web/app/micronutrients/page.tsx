'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { FlaskConical, X, ChevronDown, Search, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MICRONUTRIENT_DB } from '@/lib/micronutrients'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GapRow {
  nutrient_id: string
  name: string
  unit: string
  category: 'vitamin' | 'mineral'
  logged_amount: number
  rda: number
  ul: number | null
  percentage: number
  status: 'deficient' | 'insufficient' | 'adequate' | 'optimal' | 'excess'
  gap_amount: number
  top_food_suggestions: string[]
  functions: string[]
  deficiencySymptoms: string[]
  topFoods: string[]
  interactions: string[]
}

interface ApiResponse {
  date: string
  age: number
  sex: string
  todayScore: number
  gaps: GapRow[]
  weeklyTrend: { date: string; score: number }[]
  totalNutrients: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: GapRow['status']): string {
  switch (status) {
    case 'deficient':    return 'bg-red-500'
    case 'insufficient': return 'bg-orange-400'
    case 'adequate':     return 'bg-green-500'
    case 'optimal':      return 'bg-emerald-500'
    case 'excess':       return 'bg-purple-500'
  }
}

function statusTextColor(status: GapRow['status']): string {
  switch (status) {
    case 'deficient':    return 'text-red-400'
    case 'insufficient': return 'text-orange-400'
    case 'adequate':     return 'text-green-400'
    case 'optimal':      return 'text-emerald-400'
    case 'excess':       return 'text-purple-400'
  }
}

function statusLabel(status: GapRow['status']): string {
  switch (status) {
    case 'deficient':    return 'Deficient'
    case 'insufficient': return 'Insufficient'
    case 'adequate':     return 'Adequate'
    case 'optimal':      return 'Optimal'
    case 'excess':       return 'Excess'
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-green-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

function fmt(n: number, unit: string): string {
  if (n === 0) return `0 ${unit}`
  if (n < 1 && unit === 'mg') return `${(n * 1000).toFixed(0)} mcg`
  return `${n % 1 === 0 ? n : n.toFixed(1)} ${unit}`
}

// ─── Notable interactions ──────────────────────────────────────────────────────

const NOTABLE_INTERACTIONS = [
  { emoji: '⚠️', text: 'Zinc + Copper compete — don't over-supplement both at once' },
  { emoji: '✅', text: 'Vitamin D3 + K2 work together to direct calcium to bones' },
  { emoji: '✅', text: 'Vitamin C dramatically boosts non-heme iron absorption' },
  { emoji: '⚠️', text: 'Excess calcium reduces zinc and magnesium absorption' },
  { emoji: '✅', text: 'Magnesium activates vitamin D — deficiency in both is common' },
  { emoji: '⚠️', text: 'Folate (B9) can mask B12 deficiency — test B12 levels too' },
]

// ─── Nutrient Detail Modal ─────────────────────────────────────────────────────

function NutrientModal({
  row,
  onClose,
}: {
  row: GapRow
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-background border border-border rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">{row.name}</h2>
            <span className={cn('text-xs font-semibold uppercase tracking-wide', statusTextColor(row.status))}>
              {statusLabel(row.status)} — {row.percentage.toFixed(0)}% of RDA
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface text-text-secondary"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-text-secondary mb-1">
            <span>{fmt(row.logged_amount, row.unit)} logged</span>
            <span>RDA: {fmt(row.rda, row.unit)}</span>
          </div>
          <div className="h-3 rounded-full bg-surface overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', statusColor(row.status))}
              style={{ width: `${Math.min(row.percentage, 100)}%` }}
            />
          </div>
          {row.ul && (
            <p className="text-xs text-text-secondary mt-1">
              Upper limit: {fmt(row.ul, row.unit)}
            </p>
          )}
        </div>

        {row.gap_amount > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <p className="text-sm text-orange-400 font-medium">
              Need {fmt(row.gap_amount, row.unit)} more to reach RDA
            </p>
          </div>
        )}

        <Section title="Body Functions">
          <ul className="space-y-1">
            {row.functions.map((f) => (
              <li key={f} className="text-sm text-text-secondary flex gap-2">
                <span className="text-primary mt-0.5">•</span>{f}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Deficiency Signs">
          <ul className="space-y-1">
            {row.deficiencySymptoms.map((s) => (
              <li key={s} className="text-sm text-text-secondary flex gap-2">
                <span className="text-orange-400 mt-0.5">•</span>{s}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Top Food Sources">
          <div className="flex flex-wrap gap-2">
            {row.topFoods.map((f) => (
              <span
                key={f}
                className="text-xs bg-surface border border-border rounded-lg px-2 py-1 text-text-primary"
              >
                {f}
              </span>
            ))}
          </div>
        </Section>

        {row.interactions.length > 0 && (
          <Section title="Key Interactions">
            <ul className="space-y-1">
              {row.interactions.map((i) => (
                <li key={i} className="text-sm text-text-secondary flex gap-2">
                  <span className="text-blue-400 mt-0.5">↔</span>{i}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">{title}</h3>
      {children}
    </div>
  )
}

// ─── Nutrient card ─────────────────────────────────────────────────────────────

function NutrientCard({ row, onClick }: { row: GapRow; onClick: () => void }) {
  const pct = Math.min(row.percentage, 100)
  return (
    <button
      onClick={onClick}
      className="bg-surface border border-border rounded-2xl p-3 text-left hover:border-border/60 transition-colors w-full"
    >
      <div className="flex items-start justify-between gap-1 mb-2">
        <span className="text-xs font-semibold text-text-primary leading-tight line-clamp-2">{row.name}</span>
        <span className={cn('text-[10px] font-bold shrink-0 mt-0.5', statusTextColor(row.status))}>
          {row.percentage.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-background overflow-hidden mb-1.5">
        <div
          className={cn('h-full rounded-full transition-all duration-500', statusColor(row.status))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-text-secondary truncate">
          {fmt(row.logged_amount, row.unit)}
        </span>
        <span className={cn('text-[10px] font-medium', statusTextColor(row.status))}>
          {statusLabel(row.status)}
        </span>
      </div>
    </button>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function MicronutrientsPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState<'all' | 'vitamin' | 'mineral'>('all')
  const [search, setSearch] = useState('')
  const [selectedRow, setSelectedRow] = useState<GapRow | null>(null)

  // Log form
  const [logNutrient, setLogNutrient] = useState('')
  const [logAmount, setLogAmount] = useState('')
  const [logSource, setLogSource] = useState<'food' | 'supplement'>('food')
  const [logFoodName, setLogFoodName] = useState('')
  const [logSaving, setLogSaving] = useState(false)
  const [logError, setLogError] = useState('')

  const fetchData = async (d: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/micronutrients?date=${d}`)
      const json = await res.json()
      if (res.ok) setData(json)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData(date) }, [date])

  const filteredGaps = useMemo(() => {
    if (!data) return []
    return data.gaps.filter((g) => {
      if (category !== 'all' && g.category !== category) return false
      if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [data, category, search])

  const mostDeficient = useMemo(() => {
    if (!data) return []
    return [...data.gaps]
      .filter((g) => g.status === 'deficient' || g.status === 'insufficient')
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 5)
  }, [data])

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault()
    setLogError('')
    if (!logNutrient || !logAmount) { setLogError('Select a nutrient and enter an amount'); return }
    setLogSaving(true)
    try {
      const res = await fetch('/api/micronutrients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutrient_id: logNutrient,
          amount: parseFloat(logAmount),
          source: logSource,
          food_name: logFoodName || undefined,
          logged_at: date,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setLogError(json.error ?? 'Failed to save'); return }
      setLogNutrient('')
      setLogAmount('')
      setLogFoodName('')
      await fetchData(date)
    } finally {
      setLogSaving(false)
    }
  }

  const todayScore = data?.todayScore ?? 0
  const trendData = data?.weeklyTrend ?? []

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            <h1 className="text-base font-bold text-text-primary">Micronutrients</h1>
          </div>
          <input
            type="date"
            value={date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs bg-surface border border-border rounded-xl px-2 py-1.5 text-text-primary"
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

        {/* Daily score + trend */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold">Daily Nutrient Score</p>
              <div className="flex items-baseline gap-1">
                <span className={cn('text-4xl font-bold', scoreColor(todayScore))}>
                  {loading ? '—' : todayScore}
                </span>
                <span className="text-sm text-text-secondary">/100</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-secondary">7-day trend</p>
              <div className="flex items-center gap-1 mt-1">
                {['deficient', 'insufficient', 'adequate', 'optimal', 'excess'].map((s) => (
                  <span key={s} className="flex items-center gap-0.5">
                    <span className={cn('w-2 h-2 rounded-full inline-block', statusColor(s as GapRow['status']))} />
                    <span className="text-[9px] text-text-secondary capitalize">{s.slice(0, 3)}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {trendData.length > 0 && (
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={trendData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: 'var(--text-secondary)' }}
                  tickFormatter={(d) => new Date(d + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  formatter={(val: number) => [`${val}/100`, 'Score']}
                  labelFormatter={(d) => new Date(d + 'T00:00:00').toLocaleDateString()}
                  contentStyle={{
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--primary)' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick Log Form */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Log Intake</h2>
          <form onSubmit={handleLog} className="space-y-3">
            {/* Nutrient selector */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              <select
                value={logNutrient}
                onChange={(e) => setLogNutrient(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-background border border-border rounded-xl text-sm text-text-primary appearance-none"
              >
                <option value="">Select nutrient…</option>
                <optgroup label="Vitamins">
                  {MICRONUTRIENT_DB.filter((n) => n.category === 'vitamin').map((n) => (
                    <option key={n.id} value={n.id}>{n.name} ({n.unit})</option>
                  ))}
                </optgroup>
                <optgroup label="Minerals">
                  {MICRONUTRIENT_DB.filter((n) => n.category === 'mineral').map((n) => (
                    <option key={n.id} value={n.id}>{n.name} ({n.unit})</option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Amount"
                value={logAmount}
                onChange={(e) => setLogAmount(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary"
              />
              <select
                value={logSource}
                onChange={(e) => setLogSource(e.target.value as 'food' | 'supplement')}
                className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-text-primary"
              >
                <option value="food">Food</option>
                <option value="supplement">Supplement</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Food name (optional)"
              value={logFoodName}
              onChange={(e) => setLogFoodName(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary"
            />

            {logError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />{logError}
              </p>
            )}

            <button
              type="submit"
              disabled={logSaving}
              className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
            >
              {logSaving ? 'Saving…' : 'Log Intake'}
            </button>
          </form>
        </div>

        {/* Most Deficient */}
        {mostDeficient.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Most Deficient Today
            </h2>
            <div className="space-y-3">
              {mostDeficient.map((row) => (
                <button
                  key={row.nutrient_id}
                  onClick={() => setSelectedRow(row)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary">{row.name}</span>
                    <span className={cn('text-xs font-bold', statusTextColor(row.status))}>
                      {row.percentage.toFixed(0)}% RDA
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-background overflow-hidden mb-1">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', statusColor(row.status))}
                      style={{ width: `${Math.min(row.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary">
                    Eat: {row.top_food_suggestions.join(', ')}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interactions callout */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            Important Interactions
          </h2>
          <ul className="space-y-2">
            {NOTABLE_INTERACTIONS.map((i, idx) => (
              <li key={idx} className="text-xs text-text-secondary flex gap-2">
                <span>{i.emoji}</span>
                <span>{i.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Grid controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'vitamin', 'mineral'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors capitalize',
                category === c
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              )}
            >
              {c === 'all' ? 'All' : c === 'vitamin' ? 'Vitamins' : 'Minerals'}
            </button>
          ))}
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-secondary"
            />
          </div>
        </div>

        {/* Nutrient grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-3 h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredGaps.map((row) => (
              <NutrientCard
                key={row.nutrient_id}
                row={row}
                onClick={() => setSelectedRow(row)}
              />
            ))}
          </div>
        )}

        {!loading && filteredGaps.length === 0 && (
          <div className="text-center py-12 text-text-secondary text-sm">
            No nutrients match your filter.
          </div>
        )}

      </div>

      {/* Detail modal */}
      {selectedRow && (
        <NutrientModal row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </div>
  )
}
