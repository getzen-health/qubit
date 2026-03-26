'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  CalendarDays,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LAB_MARKERS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  flagMarkers,
  calculateLabHealthScore,
  biomarkerTrend,
  getMarkerInterpretation,
  type LabCategory,
  type MarkerSeverity,
} from '@/lib/lab-results'

const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false })
const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false })
const ReferenceLine = dynamic(() => import('recharts').then((m) => m.ReferenceLine), { ssr: false })
const ReferenceArea = dynamic(() => import('recharts').then((m) => m.ReferenceArea), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

interface LabResult {
  id: string
  test_date: string
  panel_name: string | null
  markers: Record<string, number>
  lab_name: string | null
  ordering_provider: string | null
  notes: string | null
  created_at: string
}

interface DoctorVisit {
  id: string
  visit_date: string
  provider_name: string | null
  visit_type: string | null
  chief_complaint: string | null
  diagnoses: string[]
  medications_changed: Array<{ name: string; action: string }>
  follow_up_date: string | null
  notes: string | null
  created_at: string
}

interface Props {
  initialResults: LabResult[]
  initialVisits: DoctorVisit[]
}

// ─── Severity Helpers ─────────────────────────────────────────────────────────

function severityColor(s: MarkerSeverity) {
  if (s === 'optimal') return 'text-emerald-500'
  if (s === 'normal_not_optimal') return 'text-amber-500'
  return 'text-red-500'
}

function severityBg(s: MarkerSeverity) {
  if (s === 'optimal') return 'bg-emerald-500/10 border-emerald-500/30'
  if (s === 'normal_not_optimal') return 'bg-amber-500/10 border-amber-500/30'
  return 'bg-red-500/10 border-red-500/30'
}

function SeverityIcon({ s, className }: { s: MarkerSeverity; className?: string }) {
  if (s === 'optimal') return <CheckCircle2 className={cn('w-4 h-4 text-emerald-500', className)} />
  if (s === 'normal_not_optimal') return <AlertTriangle className={cn('w-4 h-4 text-amber-500', className)} />
  return <XCircle className={cn('w-4 h-4 text-red-500', className)} />
}

// ─── Score Gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color =
    score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={color}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-2xl font-bold', color)}>{score}</span>
          <span className="text-[10px] text-text-secondary">/100</span>
        </div>
      </div>
      <span className="text-xs font-medium text-text-secondary text-center">{label}</span>
    </div>
  )
}

// ─── Trend Arrow ─────────────────────────────────────────────────────────────

function TrendArrow({ direction }: { direction: 'improving' | 'stable' | 'declining' }) {
  if (direction === 'improving') return <TrendingUp className="w-4 h-4 text-emerald-500" />
  if (direction === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />
  return <Minus className="w-4 h-4 text-text-secondary" />
}

// ─── Tab Definition ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'current', label: 'Current', icon: FlaskConical },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'enter', label: 'Enter Results', icon: Plus },
  { id: 'visits', label: 'Visits', icon: Stethoscope },
] as const

type TabId = (typeof TABS)[number]['id']

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LabsClient({ initialResults, initialVisits }: Props) {
  const [tab, setTab] = useState<TabId>('current')
  const [results, setResults] = useState<LabResult[]>(initialResults)
  const [visits, setVisits] = useState<DoctorVisit[]>(initialVisits)

  // Aggregate latest value per marker across all results
  const latestValues = useMemo<Record<string, number>>(() => {
    const vals: Record<string, number> = {}
    // results are sorted desc — first one wins
    for (const r of [...results].sort((a, b) => b.test_date.localeCompare(a.test_date))) {
      for (const [id, val] of Object.entries(r.markers)) {
        if (!(id in vals) && val != null) vals[id] = val
      }
    }
    return vals
  }, [results])

  const flagged = useMemo(() => flagMarkers(latestValues), [latestValues])
  const flagIndex = useMemo(() => {
    const idx: Record<string, (typeof flagged)[0]> = {}
    for (const f of flagged) idx[f.marker.id] = f
    return idx
  }, [flagged])

  const scoreResult = useMemo(() => calculateLabHealthScore(latestValues), [latestValues])

  // History per marker for trends
  const markerHistory = useMemo(() => {
    const hist: Record<string, { date: string; value: number }[]> = {}
    for (const r of results) {
      for (const [id, val] of Object.entries(r.markers)) {
        if (val == null) continue
        if (!hist[id]) hist[id] = []
        hist[id].push({ date: r.test_date, value: val })
      }
    }
    // Sort each marker's history by date ascending
    for (const id in hist) hist[id].sort((a, b) => a.date.localeCompare(b.date))
    return hist
  }, [results])

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-primary/10">
            <FlaskConical className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Lab Results</h1>
        </div>
        <p className="text-sm text-text-secondary ml-12">Biomarker tracking & personal health records</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 bg-surface rounded-2xl p-1 border border-border">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-[11px] font-medium transition-colors',
                tab === id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="leading-none">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'current' && (
        <CurrentTab
          latestValues={latestValues}
          flagIndex={flagIndex}
          scoreResult={scoreResult}
          markerHistory={markerHistory}
        />
      )}
      {tab === 'trends' && (
        <TrendsTab markerHistory={markerHistory} latestValues={latestValues} />
      )}
      {tab === 'enter' && (
        <EnterResultsTab onSaved={(r) => setResults((prev) => [r, ...prev])} />
      )}
      {tab === 'visits' && (
        <VisitsTab visits={visits} onSaved={(v) => setVisits((prev) => [v, ...prev])} />
      )}
    </div>
  )
}

// ─── Current Tab ──────────────────────────────────────────────────────────────

function CurrentTab({
  latestValues,
  flagIndex,
  scoreResult,
  markerHistory,
}: {
  latestValues: Record<string, number>
  flagIndex: Record<string, ReturnType<typeof flagMarkers>[0]>
  scoreResult: ReturnType<typeof calculateLabHealthScore>
  markerHistory: Record<string, { date: string; value: number }[]>
}) {
  const [expandedCategory, setExpandedCategory] = useState<LabCategory | null>(null)

  const categories = Array.from(new Set(LAB_MARKERS.map((m) => m.category))) as LabCategory[]

  return (
    <div className="px-4 space-y-4">
      {/* Composite Score */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Lab Health Score</p>
        {scoreResult.sampleSize === 0 ? (
          <p className="text-sm text-text-secondary text-center py-4">
            Enter lab results to see your composite health score.
          </p>
        ) : (
          <div className="flex items-center gap-6">
            <ScoreGauge score={scoreResult.overall} label="Overall Score" />
            <div className="flex-1 grid grid-cols-2 gap-2">
              {Object.entries(scoreResult.byCategory).map(([cat, score]) => (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-sm">{CATEGORY_ICONS[cat as LabCategory]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-text-secondary truncate">{CATEGORY_LABELS[cat as LabCategory]}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500',
                          )}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-text-primary w-6 text-right">{score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {scoreResult.sampleSize > 0 && (
          <p className="text-[11px] text-text-secondary text-center mt-2">
            Based on {scoreResult.sampleSize} biomarkers
          </p>
        )}
      </div>

      {/* Category Sections */}
      {categories.map((cat) => {
        const markers = LAB_MARKERS.filter((m) => m.category === cat)
        const hasValues = markers.some((m) => latestValues[m.id] != null)
        const isExpanded = expandedCategory === cat || hasValues

        const outCount = markers.filter((m) => flagIndex[m.id]?.severity === 'out_of_range').length
        const warnCount = markers.filter((m) => flagIndex[m.id]?.severity === 'normal_not_optimal').length

        return (
          <div key={cat} className="bg-surface border border-border rounded-2xl overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-secondary transition-colors"
              onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
            >
              <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-text-primary">{CATEGORY_LABELS[cat]}</p>
                <p className="text-[11px] text-text-secondary">{markers.length} markers</p>
              </div>
              <div className="flex items-center gap-1.5">
                {outCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500">
                    {outCount} ✗
                  </span>
                )}
                {warnCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                    {warnCount} ⚠
                  </span>
                )}
              </div>
              {expandedCategory === cat ? (
                <ChevronUp className="w-4 h-4 text-text-secondary" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-secondary" />
              )}
            </button>

            {expandedCategory === cat && (
              <div className="px-4 pb-3 grid grid-cols-1 gap-2 border-t border-border">
                {markers.map((marker) => {
                  const val = latestValues[marker.id]
                  const flag = flagIndex[marker.id]
                  const hist = markerHistory[marker.id] ?? []
                  const trend = hist.length >= 2 ? biomarkerTrend(hist, marker.id) : null

                  return (
                    <MarkerCard
                      key={marker.id}
                      marker={marker}
                      value={val}
                      flag={flag}
                      trend={trend}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Marker Card ──────────────────────────────────────────────────────────────

function MarkerCard({
  marker,
  value,
  flag,
  trend,
}: {
  marker: ReturnType<typeof LAB_MARKERS>[0]
  value: number | undefined
  flag: ReturnType<typeof flagMarkers>[0] | undefined
  trend: ReturnType<typeof biomarkerTrend> | null
}) {
  const [showInfo, setShowInfo] = useState(false)
  const severity = flag?.severity ?? null

  return (
    <div
      className={cn(
        'mt-2 rounded-xl border p-3 transition-colors',
        severity ? severityBg(severity) : 'bg-surface-secondary border-border',
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium text-text-primary">{marker.name}</p>
            {severity && <SeverityIcon s={severity} />}
            {trend && <TrendArrow direction={trend.direction} />}
          </div>
          {value != null ? (
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={cn('text-lg font-bold', severity ? severityColor(severity) : 'text-text-primary')}>
                {value}
              </span>
              <span className="text-xs text-text-secondary">{marker.unit}</span>
              {trend && trend.direction !== 'stable' && (
                <span className={cn('text-xs', trend.direction === 'improving' ? 'text-emerald-500' : 'text-red-500')}>
                  {trend.delta > 0 ? '+' : ''}{trend.delta} ({trend.deltaPercent > 0 ? '+' : ''}{trend.deltaPercent}%)
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-text-secondary mt-0.5">Not entered</p>
          )}
          <p className="text-[11px] text-text-secondary mt-0.5">
            Optimal: {marker.optimalLow}–{marker.optimalHigh} {marker.unit}
          </p>
        </div>
        <button
          onClick={() => setShowInfo((v) => !v)}
          className="p-1.5 rounded-lg hover:bg-surface transition-colors shrink-0"
          aria-label="More info"
        >
          <Info className="w-3.5 h-3.5 text-text-secondary" />
        </button>
      </div>

      {showInfo && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-[12px] text-text-secondary leading-relaxed">
            {value != null ? getMarkerInterpretation(marker.id, value) : marker.interpretation}
          </p>
          <p className="text-[11px] text-text-secondary/70 mt-1">
            Lab range: {marker.labRangeLow}–{marker.labRangeHigh} {marker.unit}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Trends Tab ───────────────────────────────────────────────────────────────

function TrendsTab({
  markerHistory,
  latestValues,
}: {
  markerHistory: Record<string, { date: string; value: number }[]>
  latestValues: Record<string, number>
}) {
  const availableMarkers = LAB_MARKERS.filter((m) => (markerHistory[m.id]?.length ?? 0) >= 1)
  const [selectedId, setSelectedId] = useState<string>(availableMarkers[0]?.id ?? '')

  const marker = LAB_MARKERS.find((m) => m.id === selectedId)
  const history = markerHistory[selectedId] ?? []
  const trend = history.length >= 2 ? biomarkerTrend(history, selectedId) : null

  if (availableMarkers.length === 0) {
    return (
      <div className="px-4">
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <TrendingUp className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-sm font-medium text-text-primary">No trend data yet</p>
          <p className="text-xs text-text-secondary mt-1">Enter results from multiple dates to see trends.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 space-y-4">
      {/* Marker selector */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Select Biomarker</p>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
            const catMarkers = availableMarkers.filter((m) => m.category === cat)
            if (catMarkers.length === 0) return null
            return (
              <optgroup key={cat} label={label}>
                {catMarkers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({markerHistory[m.id]?.length ?? 0} readings)
                  </option>
                ))}
              </optgroup>
            )
          })}
        </select>
      </div>

      {marker && (
        <>
          {/* Trend summary */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-base font-semibold text-text-primary">{marker.name}</p>
                <p className="text-xs text-text-secondary">{CATEGORY_LABELS[marker.category]}</p>
              </div>
              {latestValues[marker.id] != null && (
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{latestValues[marker.id]}</p>
                  <p className="text-xs text-text-secondary">{marker.unit}</p>
                </div>
              )}
            </div>

            {trend && (
              <div className="flex items-center gap-2 mt-3 p-2.5 bg-surface-secondary rounded-xl">
                <TrendArrow direction={trend.direction} />
                <div>
                  <p className="text-sm font-medium text-text-primary capitalize">
                    {trend.direction} — {trend.significance} significance
                  </p>
                  <p className="text-xs text-text-secondary">
                    Δ {trend.delta > 0 ? '+' : ''}{trend.delta} {marker.unit} ({trend.deltaPercent > 0 ? '+' : ''}{trend.deltaPercent}%) over {history.length} readings
                  </p>
                </div>
              </div>
            )}

            <p className="text-xs text-text-secondary mt-3 leading-relaxed">{marker.interpretation}</p>
          </div>

          {/* Chart */}
          {history.length >= 2 && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
                {marker.name} Over Time
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                      tickFormatter={(d) => d.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.75rem',
                        fontSize: 12,
                      }}
                      formatter={(val: number) => [`${val} ${marker.unit}`, marker.name]}
                    />
                    {/* Optimal range band */}
                    <ReferenceArea
                      y1={marker.optimalLow}
                      y2={marker.optimalHigh}
                      fill="rgba(16,185,129,0.08)"
                      stroke="rgba(16,185,129,0.3)"
                      strokeDasharray="3 3"
                    />
                    <ReferenceLine
                      y={marker.optimalLow}
                      stroke="rgba(16,185,129,0.5)"
                      strokeDasharray="3 3"
                      label={{ value: 'Opt ↓', fontSize: 9, fill: 'rgba(16,185,129,0.8)' }}
                    />
                    <ReferenceLine
                      y={marker.optimalHigh}
                      stroke="rgba(16,185,129,0.5)"
                      strokeDasharray="3 3"
                      label={{ value: 'Opt ↑', fontSize: 9, fill: 'rgba(16,185,129,0.8)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--accent, #6366f1)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: 'var(--accent, #6366f1)', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-text-secondary">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/30" />
                  <span>Optimal range ({marker.optimalLow}–{marker.optimalHigh} {marker.unit})</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Enter Results Tab ────────────────────────────────────────────────────────

const INITIAL_FORM = {
  test_date: new Date().toISOString().slice(0, 10),
  panel_name: '',
  lab_name: '',
  ordering_provider: '',
  notes: '',
  markers: {} as Record<string, string>,
}

function EnterResultsTab({ onSaved }: { onSaved: (r: LabResult) => void }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [activeCategory, setActiveCategory] = useState<LabCategory>('metabolic')

  const categories = Array.from(new Set(LAB_MARKERS.map((m) => m.category))) as LabCategory[]

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const numericMarkers: Record<string, number> = {}
      for (const [id, val] of Object.entries(form.markers)) {
        const n = parseFloat(val)
        if (!isNaN(n)) numericMarkers[id] = n
      }

      if (Object.keys(numericMarkers).length === 0) {
        setSavedMsg('Please enter at least one marker value.')
        setTimeout(() => setSavedMsg(''), 3000)
        return
      }

      const res = await fetch('/api/labs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_date: form.test_date,
          panel_name: form.panel_name || null,
          lab_name: form.lab_name || null,
          ordering_provider: form.ordering_provider || null,
          notes: form.notes || null,
          markers: numericMarkers,
        }),
      })
      const json = await res.json()
      if (json.result) {
        onSaved(json.result)
        setForm(INITIAL_FORM)
        setSavedMsg('✓ Results saved successfully!')
      } else {
        setSavedMsg(json.error ?? 'Failed to save.')
      }
    } finally {
      setSaving(false)
      setTimeout(() => setSavedMsg(''), 4000)
    }
  }

  return (
    <div className="px-4">
      <form onSubmit={handleSave} className="space-y-4">
        {/* Meta fields */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Panel Details</p>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Test Date *</label>
            <input
              type="date"
              required
              value={form.test_date}
              onChange={(e) => setForm((f) => ({ ...f, test_date: e.target.value }))}
              className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Panel Name</label>
              <input
                type="text"
                placeholder="e.g. Comprehensive Metabolic"
                value={form.panel_name}
                onChange={(e) => setForm((f) => ({ ...f, panel_name: e.target.value }))}
                className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Lab Name</label>
              <input
                type="text"
                placeholder="e.g. LabCorp"
                value={form.lab_name}
                onChange={(e) => setForm((f) => ({ ...f, lab_name: e.target.value }))}
                className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Ordering Provider</label>
            <input
              type="text"
              placeholder="e.g. Dr. Smith"
              value={form.ordering_provider}
              onChange={(e) => setForm((f) => ({ ...f, ordering_provider: e.target.value }))}
              className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Category tabs for marker entry */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="flex overflow-x-auto gap-1 p-2 border-b border-border">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap',
                  activeCategory === cat
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary',
                )}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="p-4 grid grid-cols-2 gap-3">
            {LAB_MARKERS.filter((m) => m.category === activeCategory).map((marker) => (
              <div key={marker.id}>
                <label className="block text-[11px] font-medium text-text-secondary mb-1 leading-tight">
                  {marker.name}
                  <span className="font-normal ml-1 opacity-60">({marker.unit})</span>
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder={`${marker.optimalLow}–${marker.optimalHigh}`}
                  value={form.markers[marker.id] ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      markers: { ...f.markers, [marker.id]: e.target.value },
                    }))
                  }
                  className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
          <textarea
            rows={3}
            placeholder="Any additional context, fasting status, symptoms, etc."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {savedMsg && (
          <p
            className={cn(
              'text-sm text-center font-medium py-2 rounded-xl',
              savedMsg.startsWith('✓') ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50',
            )}
          >
            {savedMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-2xl bg-primary text-white font-semibold text-sm disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Saving…' : 'Save Lab Results'}
        </button>
      </form>
    </div>
  )
}

// ─── Visits Tab ───────────────────────────────────────────────────────────────

const VISIT_FORM_INIT = {
  visit_date: new Date().toISOString().slice(0, 10),
  provider_name: '',
  visit_type: '',
  chief_complaint: '',
  diagnoses: '',
  follow_up_date: '',
  notes: '',
}

function VisitsTab({
  visits,
  onSaved,
}: {
  visits: DoctorVisit[]
  onSaved: (v: DoctorVisit) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(VISIT_FORM_INIT)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/doctor-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visit_date: form.visit_date,
          provider_name: form.provider_name || null,
          visit_type: form.visit_type || null,
          chief_complaint: form.chief_complaint || null,
          diagnoses: form.diagnoses
            ? form.diagnoses.split(',').map((d) => d.trim()).filter(Boolean)
            : [],
          follow_up_date: form.follow_up_date || null,
          notes: form.notes || null,
        }),
      })
      const json = await res.json()
      if (json.visit) {
        onSaved(json.visit)
        setForm(VISIT_FORM_INIT)
        setShowForm(false)
        setSavedMsg('✓ Visit logged!')
      } else {
        setSavedMsg(json.error ?? 'Failed to save.')
      }
    } finally {
      setSaving(false)
      setTimeout(() => setSavedMsg(''), 4000)
    }
  }

  return (
    <div className="px-4 space-y-4">
      {/* Add visit button */}
      <button
        onClick={() => setShowForm((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/10 border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/15 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Log Doctor Visit
      </button>

      {/* Add visit form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-text-primary">New Visit</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Visit Date *</label>
              <input
                type="date"
                required
                value={form.visit_date}
                onChange={(e) => setForm((f) => ({ ...f, visit_date: e.target.value }))}
                className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Follow-up Date</label>
              <input
                type="date"
                value={form.follow_up_date}
                onChange={(e) => setForm((f) => ({ ...f, follow_up_date: e.target.value }))}
                className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Provider Name</label>
              <input
                type="text"
                placeholder="Dr. Jane Smith"
                value={form.provider_name}
                onChange={(e) => setForm((f) => ({ ...f, provider_name: e.target.value }))}
                className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Visit Type</label>
              <select
                value={form.visit_type}
                onChange={(e) => setForm((f) => ({ ...f, visit_type: e.target.value }))}
                className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select type</option>
                <option value="annual_physical">Annual Physical</option>
                <option value="follow_up">Follow-up</option>
                <option value="specialist">Specialist</option>
                <option value="urgent_care">Urgent Care</option>
                <option value="telemedicine">Telemedicine</option>
                <option value="lab_review">Lab Review</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Chief Complaint / Reason</label>
            <input
              type="text"
              placeholder="e.g. Annual checkup, fatigue workup"
              value={form.chief_complaint}
              onChange={(e) => setForm((f) => ({ ...f, chief_complaint: e.target.value }))}
              className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Diagnoses <span className="font-normal opacity-60">(comma-separated)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Hypothyroidism, Vitamin D deficiency"
              value={form.diagnoses}
              onChange={(e) => setForm((f) => ({ ...f, diagnoses: e.target.value }))}
              className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
            <textarea
              rows={3}
              placeholder="Key discussion points, next steps, prescription changes…"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {savedMsg && (
            <p className={cn('text-sm text-center font-medium', savedMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-600')}>
              {savedMsg}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Saving…' : 'Save Visit'}
            </button>
          </div>
        </form>
      )}

      {savedMsg && !showForm && (
        <p className="text-sm text-center text-emerald-600 font-medium">{savedMsg}</p>
      )}

      {/* Visit timeline */}
      {visits.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <Stethoscope className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-sm font-medium text-text-primary">No visits logged yet</p>
          <p className="text-xs text-text-secondary mt-1">Log your doctor visits to track your health timeline.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((visit, i) => (
            <VisitCard key={visit.id} visit={visit} isFirst={i === 0} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Visit Card ───────────────────────────────────────────────────────────────

const VISIT_TYPE_LABELS: Record<string, string> = {
  annual_physical: 'Annual Physical',
  follow_up: 'Follow-up',
  specialist: 'Specialist',
  urgent_care: 'Urgent Care',
  telemedicine: 'Telemedicine',
  lab_review: 'Lab Review',
  other: 'Other',
}

function VisitCard({ visit, isFirst }: { visit: DoctorVisit; isFirst: boolean }) {
  const [expanded, setExpanded] = useState(isFirst)

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-secondary transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 shrink-0">
          <CalendarDays className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            {new Date(visit.visit_date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
          <p className="text-xs text-text-secondary truncate">
            {[
              visit.provider_name,
              visit.visit_type ? VISIT_TYPE_LABELS[visit.visit_type] ?? visit.visit_type : null,
            ]
              .filter(Boolean)
              .join(' · ') || 'No details'}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-text-secondary shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2.5 border-t border-border pt-3">
          {visit.chief_complaint && (
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Reason</p>
              <p className="text-sm text-text-primary mt-0.5">{visit.chief_complaint}</p>
            </div>
          )}

          {visit.diagnoses?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Diagnoses</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {visit.diagnoses.map((d) => (
                  <span key={d} className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {visit.follow_up_date && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
              <span>
                Follow-up:{' '}
                {new Date(visit.follow_up_date + 'T00:00:00').toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          {visit.notes && (
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Notes</p>
              <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">{visit.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
