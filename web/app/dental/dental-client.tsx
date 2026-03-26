'use client'

import { useState, useCallback } from 'react'
import {
  Smile,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Shield,
  Droplets,
  Wind,
  Star,
  Info,
} from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'
import {
  calculateDentalScore,
  assessCavityRisk,
  getStephanCurveData,
  scoreColor,
  riskColor,
  riskBadgeClass,
  gradeBadgeClass,
  SENSITIVITY_AREAS,
  CAVITY_RISK_FACTORS,
} from '@/lib/dental-health'
import type { DentalLog, DentalScore } from '@/lib/dental-health'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts'

type Tab = 'today' | 'risk' | 'trends'

interface Props {
  initialLogs: DentalLog[]
  initialTodayLog: DentalLog
  initialScore: DentalScore
}

const HYGIENE_EXTRAS: Array<{ key: keyof DentalLog; label: string; emoji: string }> = [
  { key: 'flossed', label: 'Flossed', emoji: '🦷' },
  { key: 'mouthwash', label: 'Mouthwash', emoji: '💧' },
  { key: 'tongue_scraper', label: 'Tongue Scraper', emoji: '👅' },
  { key: 'oil_pulling', label: 'Oil Pulling', emoji: '🫙' },
  { key: 'water_flosser', label: 'Water Flosser', emoji: '💦' },
  { key: 'fluoride_used', label: 'Fluoride', emoji: '⚗️' },
]

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const color = scoreColor(score)
  const r = 45
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-border" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>
        {score}
      </text>
      <text x="50" y="60" textAnchor="middle" fontSize="9" fill="currentColor" className="text-text-secondary">
        /100
      </text>
    </svg>
  )
}

function Counter({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  label?: string
}) {
  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-sm text-text-secondary min-w-0 flex-1">{label}</span>}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-primary transition-colors"
        >
          −
        </button>
        <span className="w-8 text-center font-semibold text-text-primary">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-primary transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}

export function DentalClient({ initialLogs, initialTodayLog, initialScore }: Props) {
  const [tab, setTab] = useState<Tab>('today')
  const [log, setLog] = useState<DentalLog>(initialTodayLog)
  const [score, setScore] = useState<DentalScore>(initialScore)
  const [logs, setLogs] = useState<DentalLog[]>(initialLogs)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedRiskFactor, setExpandedRiskFactor] = useState<string | null>(null)

  const update = useCallback(
    (patch: Partial<DentalLog>) => {
      const updated = { ...log, ...patch }
      setLog(updated)
      setScore(calculateDentalScore(updated))
    },
    [log]
  )

  const toggleSensitivity = (areaId: string) => {
    const areas = log.sensitivity_areas.includes(areaId)
      ? log.sensitivity_areas.filter((a) => a !== areaId)
      : [...log.sensitivity_areas, areaId]
    update({ sensitivity_areas: areas })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/dental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        // Refresh logs
        const refreshed = await fetch('/api/dental')
        if (refreshed.ok) {
          const data = await refreshed.json()
          setLogs(data.logs ?? [])
        }
      }
    } finally {
      setSaving(false)
    }
  }

  // Trend data
  const trendData = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => ({
      date: l.date.slice(5),
      score: calculateDentalScore(l).total,
      brushing: l.brushing_count,
      flossed: l.flossed ? 1 : 0,
      sugar: l.sugar_exposures,
    }))

  // Heatmap: last 30 days
  const today = new Date().toISOString().slice(0, 10)
  const heatmapDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10)
    const l = logs.find((x) => x.date === d)
    return { date: d, brushing: l?.brushing_count ?? 0, flossed: l?.flossed ?? false }
  })

  // Streaks
  const sortedDesc = [...logs].sort((a, b) => b.date.localeCompare(a.date))
  let brushingStreak = 0
  let flossingStreak = 0
  for (const l of sortedDesc) {
    if (l.brushing_count >= 2) brushingStreak++
    else break
  }
  for (const l of sortedDesc) {
    if (l.flossed) flossingStreak++
    else break
  }
  const flossCompliance =
    logs.length > 0 ? Math.round((logs.filter((l) => l.flossed).length / logs.length) * 100) : 0

  // Stephan curve
  const stephanData = getStephanCurveData(log.sugar_exposures)
  const cavityRisk = assessCavityRisk(log)

  const tabs: Array<{ id: Tab; label: string; icon: typeof Smile }> = [
    { id: 'today', label: 'Today', icon: Smile },
    { id: 'risk', label: 'Risk', icon: Shield },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
  ]

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-6 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Smile className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Dental Health</h1>
          <p className="text-xs text-text-secondary">ADA + WHO evidence-based tracking</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface rounded-2xl p-1 border border-border mb-5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors',
              tab === id
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── TODAY TAB ─── */}
      {tab === 'today' && (
        <div className="space-y-4">
          {/* Score Ring */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center gap-5">
              <ScoreRing score={score.total} />
              <div className="flex-1">
                <div className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border mb-2', gradeBadgeClass(score.grade))}>
                  {score.grade}
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-xs">
                  {Object.entries(score.pillars).map(([k, v]) => (
                    <div key={k}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-text-secondary capitalize">{k}</span>
                        <span className="font-medium text-text-primary">{v}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${v}%`, backgroundColor: scoreColor(v) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Brushing */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              🪥 Brushing
            </h2>
            <Counter
              value={log.brushing_count}
              onChange={(v) => update({ brushing_count: v })}
              min={0}
              max={3}
              label="Sessions today"
            />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Duration per session</span>
                <span className={cn('text-sm font-semibold', log.brushing_duration_sec >= 120 ? 'text-green-500' : 'text-yellow-500')}>
                  {Math.floor(log.brushing_duration_sec / 60)}:{String(log.brushing_duration_sec % 60).padStart(2, '0')}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={180}
                step={10}
                value={log.brushing_duration_sec}
                onChange={(e) => update({ brushing_duration_sec: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                <span>0s</span>
                <span className="text-primary font-medium">2:00 target</span>
                <span>3:00</span>
              </div>
            </div>
          </div>

          {/* Hygiene Extras */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-text-primary mb-3">✨ Hygiene Extras</h2>
            <div className="grid grid-cols-3 gap-2">
              {HYGIENE_EXTRAS.map(({ key, label, emoji }) => {
                const active = log[key] as boolean
                return (
                  <button
                    key={key}
                    onClick={() => update({ [key]: !active })}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-colors',
                      active
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sugar & Acid Log */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              🍬 Sugar & Acid Log
            </h2>
            <Counter
              value={log.sugar_exposures}
              onChange={(v) => update({ sugar_exposures: v })}
              min={0}
              max={20}
              label="Sugar exposures"
            />
            <Counter
              value={log.acidic_beverages}
              onChange={(v) => update({ acidic_beverages: v })}
              min={0}
              max={10}
              label="Acidic beverages"
            />
            <Counter
              value={log.snacking_count}
              onChange={(v) => update({ snacking_count: v })}
              min={0}
              max={15}
              label="Snacks between meals"
            />

            {/* Stephan Curve */}
            {log.sugar_exposures > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-text-secondary">Stephan pH Curve</span>
                  <span className="text-[10px] text-text-secondary">Safe &gt;5.5 | Critical &lt;4.5</span>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={stephanData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}m`} interval={14} />
                    <YAxis domain={[4, 7.2]} tick={{ fontSize: 9 }} />
                    <Tooltip
                      formatter={(v: number) => [`pH ${v.toFixed(1)}`, 'Oral pH']}
                      labelFormatter={(l) => `${l} min`}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                    <ReferenceLine y={5.5} stroke="#eab308" strokeDasharray="4 2" label={{ value: 'Safe', fontSize: 9, fill: '#eab308' }} />
                    <ReferenceLine y={4.5} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'Critical', fontSize: 9, fill: '#ef4444' }} />
                    <Line
                      type="monotone"
                      dataKey="ph"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-text-secondary mt-1">
                  Each sugar event drops pH to ~4.5 in 5 min; recovery takes ~30 min (Marsh 2006)
                </p>
              </div>
            )}
          </div>

          {/* Symptoms */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
            <h2 className="font-semibold text-text-primary">🩺 Symptoms</h2>

            {/* Bleeding gums */}
            <button
              onClick={() => update({ bleeding_gums: !log.bleeding_gums })}
              className={cn(
                'flex items-center gap-3 w-full p-3 rounded-xl border text-sm font-medium transition-colors text-left',
                log.bleeding_gums
                  ? 'bg-red-500/10 border-red-500/30 text-red-500'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              )}
            >
              <span className="text-xl">🩸</span>
              <div>
                <div className="font-semibold">Bleeding Gums</div>
                <div className="text-xs opacity-70">May indicate gingivitis</div>
              </div>
              {log.bleeding_gums && <AlertTriangle className="w-4 h-4 ml-auto" />}
            </button>

            {/* Dry mouth */}
            <button
              onClick={() => update({ dry_mouth: !log.dry_mouth })}
              className={cn(
                'flex items-center gap-3 w-full p-3 rounded-xl border text-sm font-medium transition-colors text-left',
                log.dry_mouth
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-500'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              )}
            >
              <Droplets className="w-5 h-5" />
              <div>
                <div className="font-semibold">Dry Mouth</div>
                <div className="text-xs opacity-70">Xerostomia reduces acid buffering</div>
              </div>
            </button>

            {/* Sensitivity quadrant */}
            <div>
              <p className="text-sm text-text-secondary mb-2">Sensitivity Areas</p>
              <div className="grid grid-cols-2 gap-2">
                {SENSITIVITY_AREAS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => toggleSensitivity(id)}
                    className={cn(
                      'py-3 rounded-xl border text-xs font-medium transition-colors',
                      log.sensitivity_areas.includes(id)
                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                        : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                    )}
                  >
                    🦷 {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dentist Visit */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Dentist Visit
            </h2>
            <div>
              <label className="text-sm text-text-secondary block mb-1.5">Last visit date</label>
              <input
                type="date"
                value={log.last_dentist_visit ?? ''}
                onChange={(e) => update({ last_dentist_visit: e.target.value || undefined })}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            {score.daysUntilDentist !== null && (
              <div
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border text-sm',
                  score.daysUntilDentist <= 0
                    ? 'bg-red-500/10 border-red-500/20 text-red-500'
                    : score.daysUntilDentist <= 30
                    ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600'
                    : 'bg-green-500/10 border-green-500/20 text-green-600'
                )}
              >
                <Calendar className="w-4 h-4 flex-shrink-0" />
                {score.daysUntilDentist <= 0
                  ? 'Dentist visit overdue — book now (ADA: every 6 months)'
                  : `Next visit in ${score.daysUntilDentist} days`}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-text-primary mb-2">📝 Notes</h2>
            <textarea
              value={log.notes ?? ''}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="Anything to note today..."
              rows={3}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Recommendations */}
          {score.recommendations.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Recommendations
              </h2>
              <ul className="space-y-2">
                {score.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
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
            className={cn(
              'w-full py-3 rounded-2xl font-semibold text-sm transition-colors',
              saved
                ? 'bg-green-500 text-white'
                : 'bg-primary text-white hover:bg-primary/90 disabled:opacity-60'
            )}
          >
            {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Log'}
          </button>
        </div>
      )}

      {/* ─── RISK TAB ─── */}
      {tab === 'risk' && (
        <div className="space-y-4">
          {/* Risk Summary */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text-primary">Cavity Risk Assessment</h2>
              <div className={cn('px-3 py-1 rounded-full text-xs font-bold border', riskBadgeClass(cavityRisk.level))}>
                {cavityRisk.level}
              </div>
            </div>
            {/* Risk score bar */}
            <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
              <span>Score: {cavityRisk.score}/12</span>
              <span>CAT-inspired scale</span>
            </div>
            <div className="h-3 rounded-full bg-border overflow-hidden mb-4">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(cavityRisk.score / 12) * 100}%`, backgroundColor: riskColor(cavityRisk.level) }}
              />
            </div>
            <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
              {(['Low', 'Moderate', 'High', 'Very High'] as const).map((lvl) => (
                <div
                  key={lvl}
                  className={cn('py-1 rounded-lg border', lvl === cavityRisk.level ? riskBadgeClass(lvl) : 'text-text-secondary border-border')}
                >
                  {lvl}
                </div>
              ))}
            </div>
          </div>

          {/* Risk Factors */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-text-primary mb-3">Risk Factors</h2>
            <div className="space-y-2">
              {CAVITY_RISK_FACTORS.map((factor) => {
                const expanded = expandedRiskFactor === factor.id
                const isActive =
                  factor.id === 'sugar_frequency'
                    ? log.sugar_exposures > 0
                    : factor.id === 'dry_mouth'
                    ? log.dry_mouth
                    : factor.id === 'no_fluoride'
                    ? !log.fluoride_used
                    : factor.id === 'poor_brushing'
                    ? log.brushing_count < 2 || log.brushing_duration_sec < 120
                    : factor.id === 'acidic_beverages'
                    ? log.acidic_beverages > 0
                    : log.snacking_count > 0

                return (
                  <div key={factor.id} className={cn('rounded-xl border overflow-hidden', isActive ? 'border-orange-500/30' : 'border-border')}>
                    <button
                      className="flex items-center gap-3 w-full px-4 py-3 text-left"
                      onClick={() => setExpandedRiskFactor(expanded ? null : factor.id)}
                    >
                      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', isActive ? 'bg-orange-500' : 'bg-green-500')} />
                      <span className="text-sm font-medium text-text-primary flex-1">{factor.label}</span>
                      {expanded ? (
                        <ChevronUp className="w-4 h-4 text-text-secondary" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-text-secondary" />
                      )}
                    </button>
                    {expanded && (
                      <div className="px-4 pb-3">
                        <p className="text-sm text-text-secondary">{factor.description}</p>
                        <p className="text-[11px] text-text-secondary/60 mt-1 italic">Source: {factor.citation}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Oral-Systemic Health Card */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Wind className="w-4 h-4 text-primary" />
              Oral-Systemic Health Links
            </h2>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="font-medium text-sm text-red-500 mb-1">❤️ Cardiovascular Disease</div>
                <p className="text-xs text-text-secondary">
                  Oral bacteria (Porphyromonas gingivalis, S. mutans) enter the bloodstream via bleeding gums, contributing to atherosclerosis and endocarditis risk.
                </p>
                <p className="text-[10px] text-text-secondary/60 mt-1 italic">Scannapieco 1998</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div className="font-medium text-sm text-blue-500 mb-1">🩸 Diabetes</div>
                <p className="text-xs text-text-secondary">
                  Periodontitis and diabetes share a bidirectional relationship — poor glycemic control worsens gum disease, which in turn raises blood glucose.
                </p>
                <p className="text-[10px] text-text-secondary/60 mt-1 italic">Scannapieco 1998</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                <div className="font-medium text-sm text-yellow-600 mb-1">🦠 Oral Microbiome</div>
                <p className="text-xs text-text-secondary">
                  A healthy oral biofilm pH stays above 5.5. Frequent sugar exposures repeatedly drive pH below 4.5, demineralizing enamel and selecting for acidogenic bacteria.
                </p>
                <p className="text-[10px] text-text-secondary/60 mt-1 italic">Marsh 2006</p>
              </div>
            </div>
          </div>

          {/* Risk Reduction Tips */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Tips to Reduce Your Risk
            </h2>
            <ul className="space-y-2">
              {score.recommendations.length > 0 ? (
                score.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-primary mt-0.5">•</span>
                    {r}
                  </li>
                ))
              ) : (
                <li className="text-sm text-green-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Excellent oral hygiene — keep it up!
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* ─── TRENDS TAB ─── */}
      {tab === 'trends' && (
        <div className="space-y-4">
          {/* Streaks */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface border border-border rounded-2xl p-3 text-center">
              <div className="text-2xl font-bold text-primary">{brushingStreak}</div>
              <div className="text-xs text-text-secondary mt-1">Brushing Streak</div>
              <div className="text-[10px] text-text-secondary opacity-60">2x/day days</div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-3 text-center">
              <div className="text-2xl font-bold text-teal-500">{flossingStreak}</div>
              <div className="text-xs text-text-secondary mt-1">Flossing Streak</div>
              <div className="text-[10px] text-text-secondary opacity-60">consecutive days</div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-3 text-center">
              <div className="text-2xl font-bold text-yellow-500">{flossCompliance}%</div>
              <div className="text-xs text-text-secondary mt-1">Floss Compliance</div>
              <div className="text-[10px] text-text-secondary opacity-60">last 30 days</div>
            </div>
          </div>

          {/* 30-day Score Chart */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-text-primary mb-3">30-Day Oral Health Score</h2>
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.floor(trendData.length / 5)} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Tooltip
                    formatter={(v: number) => [v, 'Score']}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <ReferenceLine y={85} stroke="#22c55e" strokeDasharray="4 2" />
                  <ReferenceLine y={65} stroke="#14b8a6" strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-text-secondary text-center py-8">Log a few days to see trends</p>
            )}
          </div>

          {/* Brushing Heatmap */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-text-primary mb-3">Brushing Consistency (30 days)</h2>
            <div className="flex flex-wrap gap-1">
              {heatmapDays.map(({ date, brushing, flossed: fl }) => {
                const intensity =
                  brushing >= 2 ? 'bg-primary' : brushing === 1 ? 'bg-primary/40' : 'bg-border'
                return (
                  <div
                    key={date}
                    title={`${date}: ${brushing}x brushing${fl ? ', flossed' : ''}`}
                    className={cn('w-6 h-6 rounded-md transition-colors', intensity, date === today && 'ring-2 ring-primary/50')}
                  />
                )
              })}
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-text-secondary">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-primary" />2x/day</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-primary/40" />1x</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-border" />None</div>
            </div>
          </div>

          {/* Sugar Exposure Chart */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-text-primary mb-3">Sugar Exposures (30 days)</h2>
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={trendData.slice(-14)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip
                    formatter={(v: number) => [v, 'Sugar events']}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <Bar dataKey="sugar" fill="#f97316" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-text-secondary text-center py-6">Log a few days to see data</p>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
