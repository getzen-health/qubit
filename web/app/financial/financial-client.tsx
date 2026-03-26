'use client'

import { useState, useTransition, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import {
  FinancialWellnessLog,
  FinancialWellnessScore,
  CFPB_QUESTIONS,
  LIKERT_LABELS,
  WORRY_TOPICS,
  COPING_TECHNIQUES,
  COPING_TIPS,
  EMERGENCY_FUND_OPTIONS,
  calculateFinancialWellness,
  pearsonCorrelation,
  getTodayPrompt,
} from '@/lib/financial-wellness'
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  BarChart3,
} from 'lucide-react'

// Recharts — SSR off
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false })
const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false })
const BarChart = dynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false })
const Legend = dynamic(() => import('recharts').then((m) => m.Legend), { ssr: false })

// ─── Types ──────────────────────────────────────────────────────────────────
type SummaryRow = { date: string; avg_mood?: number | null; sleep_quality?: number | null; avg_stress?: number | null }

interface Props {
  initialLogs: FinancialWellnessLog[]
  initialScore: FinancialWellnessScore | null
  initialSummaries: SummaryRow[]
}

type Tab = 'checkin' | 'wellness' | 'trends'

const TABS: { id: Tab; label: string }[] = [
  { id: 'checkin', label: 'Check-In' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'trends', label: 'Trends' },
]

const GRADE_COLORS: Record<string, string> = {
  Thriving: 'text-green-500',
  'Doing OK': 'text-teal-500',
  'At Risk': 'text-yellow-500',
  Struggling: 'text-red-500',
}
const GRADE_RING: Record<string, string> = {
  Thriving: '#22c55e',
  'Doing OK': '#14b8a6',
  'At Risk': '#eab308',
  Struggling: '#ef4444',
}

// ─── Score Ring ──────────────────────────────────────────────────────────────
function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const fill = circ - (score / 100) * circ
  const color = GRADE_RING[grade] ?? '#6366f1'
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={112} height={112} className="-rotate-90">
        <circle cx={56} cy={56} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={10} />
        <circle
          cx={56} cy={56} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={circ}
          strokeDashoffset={fill}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center" style={{ marginTop: 28 }}>
        <span className="text-3xl font-bold text-text-primary" style={{ color }}>{score}</span>
        <span className="text-[11px] text-text-secondary">/ 100</span>
      </div>
      <span className={cn('text-sm font-semibold mt-1', GRADE_COLORS[grade])}>{grade}</span>
    </div>
  )
}

// ─── CFPB Badge ──────────────────────────────────────────────────────────────
function CFPBBadge({ score }: { score: number }) {
  const level = score >= 20 ? 'Thriving' : score >= 15 ? 'Doing OK' : score >= 10 ? 'At Risk' : 'Struggling'
  return (
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', {
      'bg-green-500/15 text-green-600': level === 'Thriving',
      'bg-teal-500/15 text-teal-600': level === 'Doing OK',
      'bg-yellow-500/15 text-yellow-600': level === 'At Risk',
      'bg-red-500/15 text-red-600': level === 'Struggling',
    })}>
      CFPB {score}/25 — {level}
    </span>
  )
}

// ─── Chip ────────────────────────────────────────────────────────────────────
function Chip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
        active
          ? 'bg-accent/15 border-accent/40 text-accent'
          : 'bg-surface border-border text-text-secondary hover:text-text-primary'
      )}
    >
      {label}
    </button>
  )
}

// ─── Slider ──────────────────────────────────────────────────────────────────
function SliderField({
  label, value, min, max, onChange, hint,
}: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <span className="text-sm font-bold text-accent">{value}</span>
      </div>
      {hint && <p className="text-xs text-text-secondary">{hint}</p>}
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[color:var(--accent)]"
      />
      <div className="flex justify-between text-[10px] text-text-muted">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )
}

// ─── Tooltip style ───────────────────────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: 'hsl(var(--surface))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  color: 'hsl(var(--text-primary))',
  fontSize: 12,
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function FinancialClient({ initialLogs, initialScore, initialSummaries }: Props) {
  const [tab, setTab] = useState<Tab>('checkin')
  const [logs, setLogs] = useState<FinancialWellnessLog[]>(initialLogs)
  const [latestScore, setLatestScore] = useState<FinancialWellnessScore | null>(initialScore)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = logs.find((l) => l.date === today)

  // Form state — default from today's log if exists
  const [cfpb, setCfpb] = useState({
    q1: todayLog?.cfpb_q1 ?? 3,
    q2: todayLog?.cfpb_q2 ?? 3,
    q3: todayLog?.cfpb_q3 ?? 3,
    q4: todayLog?.cfpb_q4 ?? 3,
    q5: todayLog?.cfpb_q5 ?? 3,
  })
  const [financialStress, setFinancialStress] = useState(todayLog?.financial_stress ?? 5)
  const [emergencyMonths, setEmergencyMonths] = useState(todayLog?.emergency_fund_months ?? 0)
  const [positiveThoughts, setPositiveThoughts] = useState(todayLog?.positive_money_thoughts ?? 5)
  const [worryTopics, setWorryTopics] = useState<string[]>(todayLog?.financial_worry_topics ?? [])
  const [copingUsed, setCopingUsed] = useState<string[]>(todayLog?.coping_techniques_used ?? [])
  const [notes, setNotes] = useState(todayLog?.notes ?? '')

  // Live preview score
  const previewLog: FinancialWellnessLog = {
    date: today,
    cfpb_q1: cfpb.q1, cfpb_q2: cfpb.q2, cfpb_q3: cfpb.q3, cfpb_q4: cfpb.q4, cfpb_q5: cfpb.q5,
    financial_stress: financialStress,
    emergency_fund_months: emergencyMonths,
    positive_money_thoughts: positiveThoughts,
    financial_worry_topics: worryTopics,
    coping_techniques_used: copingUsed,
    notes,
  }
  const previewScore = calculateFinancialWellness(previewLog)

  // Trend data for charts
  const trendData = useMemo(() => {
    return [...logs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => {
        const s = calculateFinancialWellness(l)
        return {
          date: l.date.slice(5),
          wellness: s.total,
          cfpb: s.cfpbScore,
          stress: l.financial_stress,
          mindset: l.positive_money_thoughts,
        }
      })
  }, [logs])

  // Health correlation data
  const correlationData = useMemo(() => {
    const summaryByDate = Object.fromEntries(initialSummaries.map((s) => [s.date, s]))
    const matched = logs
      .map((l) => ({ log: l, s: summaryByDate[l.date] }))
      .filter((p) => p.s)
    if (matched.length < 5) return []
    const wellnessScores = matched.map((p) => calculateFinancialWellness(p.log).total)
    const result = []
    const metrics = [
      { key: 'avg_mood' as const, label: 'Mood', metric: 'mood', color: '#a78bfa' },
      { key: 'sleep_quality' as const, label: 'Sleep', metric: 'sleep', color: '#38bdf8' },
      { key: 'avg_stress' as const, label: 'Stress', metric: 'stress', color: '#f87171' },
    ]
    for (const m of metrics) {
      const vals = matched.map((p) => (p.s[m.key] as number | null) ?? null)
      const validPairs = matched
        .map((p, i) => ({ fw: wellnessScores[i], h: vals[i] }))
        .filter((p) => p.h !== null) as { fw: number; h: number }[]
      if (validPairs.length < 5) continue
      const r = pearsonCorrelation(validPairs.map((p) => p.fw), validPairs.map((p) => p.h))
      if (Math.abs(r) > 0.3) result.push({ ...m, r: Math.round(r * 100) / 100 })
    }
    return result
  }, [logs, initialSummaries])

  // Multi-line health vs wellness chart
  const healthComparisonData = useMemo(() => {
    const summaryByDate = Object.fromEntries(initialSummaries.map((s) => [s.date, s]))
    return [...logs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => {
        const s = calculateFinancialWellness(l)
        const h = summaryByDate[l.date]
        return {
          date: l.date.slice(5),
          wellness: s.total,
          mood: h?.avg_mood ? Math.round((h.avg_mood / 10) * 100) : null,
          sleep: h?.sleep_quality ? Math.round((h.sleep_quality / 10) * 100) : null,
          stress: h?.avg_stress ? Math.round(100 - h.avg_stress * 10) : null,
        }
      })
  }, [logs, initialSummaries])

  // Worry frequency
  const worryFreq = useMemo(() => {
    const freq: Record<string, number> = {}
    for (const log of logs) {
      for (const t of log.financial_worry_topics ?? []) {
        freq[t] = (freq[t] ?? 0) + 1
      }
    }
    return WORRY_TOPICS.map((w) => ({ topic: w.label, count: freq[w.id] ?? 0 }))
      .filter((w) => w.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [logs])

  function toggleArr<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
  }

  async function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        const res = await fetch('/api/financial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: today,
            cfpb_q1: cfpb.q1, cfpb_q2: cfpb.q2, cfpb_q3: cfpb.q3, cfpb_q4: cfpb.q4, cfpb_q5: cfpb.q5,
            financial_stress: financialStress,
            emergency_fund_months: emergencyMonths,
            positive_money_thoughts: positiveThoughts,
            financial_worry_topics: worryTopics,
            coping_techniques_used: copingUsed,
            notes: notes || null,
          }),
        })
        if (!res.ok) {
          const body = await res.json()
          setError(body.error ?? 'Save failed')
          return
        }
        const { data, score } = await res.json()
        setLogs((prev) => {
          const filtered = prev.filter((l) => l.date !== today)
          return [data as FinancialWellnessLog, ...filtered]
        })
        setLatestScore(score)
        setSaved(true)
      } catch {
        setError('Network error. Please try again.')
      }
    })
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 pt-12 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h1 className="text-lg font-bold text-text-primary">Financial Wellness</h1>
          </div>
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 py-2 text-xs font-semibold rounded-xl transition-colors',
                  tab === t.id
                    ? 'bg-accent/15 text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* ═══════════════════════ TAB: CHECK-IN ═══════════════════════ */}
        {tab === 'checkin' && (
          <>
            {/* Privacy notice */}
            <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3">
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">Privacy:</span> This tracks financial wellness
                perceptions only — no actual financial data (balances, income, or spending) is ever stored.
              </p>
            </div>

            {/* Live Score Ring */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="relative flex justify-center">
                <ScoreRing score={previewScore.total} grade={previewScore.grade} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(Object.entries(previewScore.pillars) as [string, number][]).map(([key, val]) => (
                  <div key={key} className="bg-surface-secondary rounded-xl p-2.5">
                    <div className="text-[10px] text-text-secondary capitalize mb-0.5">
                      {key === 'cfpb' ? 'CFPB Scale' : key === 'stressInverse' ? 'Low Stress' : key === 'buffer' ? 'Emergency Buffer' : 'Mindset'}
                    </div>
                    <div className="text-sm font-bold text-text-primary">{val}<span className="text-text-muted font-normal">/100</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* CFPB 5-item Scale */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-text-primary">CFPB Financial Well-Being Scale</h2>
                <CFPBBadge score={previewScore.cfpbScore} />
              </div>
              <p className="text-xs text-text-secondary -mt-2">
                Adapted 5-item version of the validated CFPB scale (2015). Measures financial security and freedom of choice.
              </p>
              {CFPB_QUESTIONS.map((q, qi) => {
                const qKey = `q${qi + 1}` as 'q1' | 'q2' | 'q3' | 'q4' | 'q5'
                const val = cfpb[qKey]
                return (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm text-text-primary font-medium leading-snug">{qi + 1}. {q.text}</p>
                    <p className="text-xs text-text-secondary">{q.hint}</p>
                    <div className="flex gap-1.5">
                      {([1, 2, 3, 4, 5] as const).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setCfpb((prev) => ({ ...prev, [qKey]: n }))}
                          className={cn(
                            'flex-1 py-2 rounded-xl border text-[11px] font-medium transition-colors',
                            val === n
                              ? 'bg-accent/15 border-accent/40 text-accent'
                              : 'bg-surface-secondary border-border text-text-secondary hover:text-text-primary'
                          )}
                        >
                          <div className="font-bold">{n}</div>
                          <div className="text-[9px] leading-tight mt-0.5">{LIKERT_LABELS[n - 1]}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Financial Stress Slider */}
            <div className="bg-surface border border-border rounded-2xl p-4">
              <SliderField
                label="Financial stress level"
                value={financialStress}
                min={1} max={10}
                onChange={setFinancialStress}
                hint="How stressed are you about money right now? (1 = none, 10 = overwhelming)"
              />
            </div>

            {/* Emergency Fund */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
              <label className="text-sm font-medium text-text-primary">Emergency fund buffer</label>
              <p className="text-xs text-text-secondary">Approximately how many months of expenses do you have accessible?</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {EMERGENCY_FUND_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEmergencyMonths(opt.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors',
                      emergencyMonths === opt.value
                        ? 'bg-accent/15 border-accent/40 text-accent'
                        : 'bg-surface-secondary border-border text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Positive Money Thoughts */}
            <div className="bg-surface border border-border rounded-2xl p-4">
              <SliderField
                label="Positive money thoughts"
                value={positiveThoughts}
                min={1} max={10}
                onChange={setPositiveThoughts}
                hint="How often did you have constructive, hopeful thoughts about your finances today? (1 = rarely, 10 = frequently)"
              />
            </div>

            {/* Worry Topics */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-text-primary">Financial worry topics today</h3>
              <p className="text-xs text-text-secondary">Select any topics that caused worry or anxiety (optional)</p>
              <div className="flex flex-wrap gap-2">
                {WORRY_TOPICS.map((w) => (
                  <Chip
                    key={w.id}
                    label={w.label}
                    active={worryTopics.includes(w.id)}
                    onToggle={() => setWorryTopics((prev) => toggleArr(prev, w.id))}
                  />
                ))}
              </div>
            </div>

            {/* Coping Techniques */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-text-primary">Coping techniques used today</h3>
              <div className="flex flex-wrap gap-2">
                {COPING_TECHNIQUES.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.label}
                    active={copingUsed.includes(c.id)}
                    onToggle={() => setCopingUsed((prev) => toggleArr(prev, c.id))}
                  />
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
              <label className="text-sm font-medium text-text-primary">Notes (optional)</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any reflections about your financial mindset today…"
                className="w-full bg-surface-secondary rounded-xl border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent/50"
              />
            </div>

            {/* Save */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-500">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            {saved && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs text-green-500">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> Saved successfully
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isPending}
              className="w-full py-3 bg-accent text-white rounded-2xl font-semibold text-sm disabled:opacity-50 transition-opacity"
            >
              {isPending ? 'Saving…' : 'Save Check-In'}
            </button>
          </>
        )}

        {/* ═══════════════════════ TAB: WELLNESS ═══════════════════════ */}
        {tab === 'wellness' && (
          <>
            {/* CFPB Scale Explainer */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-text-primary">About the CFPB Scale</h2>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                The Consumer Financial Protection Bureau (CFPB) Financial Well-Being Scale is a validated 10-item instrument
                measuring financial security in the present and future, and freedom of choice. This app uses a validated 5-item
                adaptation covering the same dimensions.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { level: 'Thriving', range: '20–25', color: 'text-green-500 bg-green-500/10' },
                  { level: 'Doing OK', range: '15–19', color: 'text-teal-500 bg-teal-500/10' },
                  { level: 'At Risk', range: '10–14', color: 'text-yellow-500 bg-yellow-500/10' },
                  { level: 'Struggling', range: '5–9', color: 'text-red-500 bg-red-500/10' },
                ].map((b) => (
                  <div key={b.level} className={cn('rounded-xl p-2.5', b.color.split(' ')[1])}>
                    <div className={cn('text-xs font-bold', b.color.split(' ')[0])}>{b.level}</div>
                    <div className="text-[11px] text-text-secondary">{b.range} / 25</div>
                  </div>
                ))}
              </div>
              {latestScore && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-text-secondary mb-2">Your latest CFPB score breakdown:</p>
                  {CFPB_QUESTIONS.map((q, i) => {
                    const qKey = `q${i + 1}` as keyof Pick<FinancialWellnessLog, 'cfpb_q1' | 'cfpb_q2' | 'cfpb_q3' | 'cfpb_q4' | 'cfpb_q5'>
                    const rawLog = logs[0]
                    if (!rawLog) return null
                    const raw = rawLog[qKey] as number
                    const scored = q.isPositive ? raw : 6 - raw
                    return (
                      <div key={q.id} className="flex items-center gap-2 py-1">
                        <div className="flex-1 text-[11px] text-text-secondary truncate">{q.text.slice(0, 48)}…</div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} className={cn('w-3 h-3 rounded-sm', n <= scored ? 'bg-accent' : 'bg-surface-tertiary')} />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-text-primary w-4">{scored}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Top Worries This Month */}
            {worryFreq.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <h2 className="text-sm font-bold text-text-primary">Top worries this month</h2>
                <div className="space-y-2">
                  {worryFreq.slice(0, 5).map((w) => (
                    <div key={w.topic} className="flex items-center gap-3">
                      <div className="flex-1 text-xs text-text-primary">{w.topic}</div>
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(w.count, 10) }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-sm bg-accent/60" />
                        ))}
                      </div>
                      <span className="text-[11px] text-text-secondary w-6 text-right">{w.count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Money-Health Correlations */}
            {correlationData.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-bold text-text-primary">Money-Health Correlations</h2>
                </div>
                <p className="text-xs text-text-secondary">
                  Based on Archuleta et al. 2013 and Gallo et al. 2013 — financial stress is significantly linked to
                  physical and mental health outcomes. Here's what your data shows:
                </p>
                {correlationData.map((c) => (
                  <div key={c.metric} className="bg-surface-secondary rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-text-primary">
                        Financial wellness ↔ {c.label}
                      </span>
                      <span className={cn('text-xs font-bold', c.r > 0 ? 'text-green-500' : 'text-red-500')}>
                        r = {c.r > 0 ? '+' : ''}{c.r}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary">
                      {c.r > 0
                        ? `Significant positive relationship found — higher financial wellness correlates with better ${c.label.toLowerCase()}.`
                        : `Significant inverse relationship found — higher financial wellness correlates with lower ${c.label.toLowerCase()}.`}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Evidence-Based Coping Techniques */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <h2 className="text-sm font-bold text-text-primary">Evidence-Based Coping Techniques</h2>
              </div>
              {COPING_TIPS.map((tip) => (
                <div key={tip.id} className="border border-border rounded-xl p-3 space-y-1.5">
                  <div className="text-sm font-semibold text-text-primary">{tip.title}</div>
                  <p className="text-xs text-text-secondary leading-relaxed">{tip.description}</p>
                  <p className="text-[10px] text-text-muted italic">{tip.evidence}</p>
                  <div className="flex items-start gap-1.5 bg-accent/10 rounded-lg p-2 mt-1">
                    <ChevronRight className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium text-accent">{tip.actionStep}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Daily Money Mindset Prompt */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
              <h2 className="text-sm font-bold text-text-primary">Money Mindset Prompt</h2>
              <p className="text-xs text-text-secondary">Daily CBT-style reframe question — rotate to the next each day</p>
              <div className="bg-accent/10 rounded-xl p-3">
                <p className="text-sm text-text-primary italic leading-relaxed">"{getTodayPrompt()}"</p>
              </div>
            </div>

            {/* Recommendations from latest score */}
            {latestScore && latestScore.recommendations.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <h2 className="text-sm font-bold text-text-primary">Personalized Recommendations</h2>
                <ul className="space-y-2">
                  {latestScore.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════ TAB: TRENDS ═══════════════════════ */}
        {tab === 'trends' && (
          <>
            {trendData.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                <TrendingUp className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-secondary">No trend data yet. Complete a few check-ins to see your trends.</p>
              </div>
            ) : (
              <>
                {/* 30-day Financial Wellness Score */}
                <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                  <h2 className="text-sm font-bold text-text-primary">Financial Wellness Score — 30 days</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData} margin={{ left: 0, right: 8, top: 5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="wellness" stroke="var(--accent)" strokeWidth={2} dot={false} name="Wellness" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* CFPB Score Trend */}
                <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                  <h2 className="text-sm font-bold text-text-primary">CFPB Score Trend</h2>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={trendData} margin={{ left: 0, right: 8, top: 5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                      <YAxis domain={[5, 25]} tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="cfpb" stroke="#14b8a6" strokeWidth={2} dot={false} name="CFPB" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Financial Stress Trend */}
                <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                  <h2 className="text-sm font-bold text-text-primary">Financial Stress & Mindset Trends</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData} margin={{ left: 0, right: 8, top: 5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} dot={false} name="Financial Stress" />
                      <Line type="monotone" dataKey="mindset" stroke="#a78bfa" strokeWidth={2} dot={false} name="Positive Mindset" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Health Comparison Multi-line */}
                {healthComparisonData.some((d) => d.mood || d.sleep || d.stress) && (
                  <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                    <h2 className="text-sm font-bold text-text-primary">Financial Wellness vs Health Metrics</h2>
                    <p className="text-xs text-text-secondary">All values normalized 0-100 for comparison</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={healthComparisonData} margin={{ left: 0, right: 8, top: 5, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Line type="monotone" dataKey="wellness" stroke="var(--accent)" strokeWidth={2} dot={false} name="Fin. Wellness" />
                        <Line type="monotone" dataKey="mood" stroke="#a78bfa" strokeWidth={1.5} dot={false} name="Mood" connectNulls />
                        <Line type="monotone" dataKey="sleep" stroke="#38bdf8" strokeWidth={1.5} dot={false} name="Sleep" connectNulls />
                        <Line type="monotone" dataKey="stress" stroke="#fb923c" strokeWidth={1.5} dot={false} name="Low Stress" connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Worry Topic Frequency Bar Chart */}
                {worryFreq.length > 0 && (
                  <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                    <h2 className="text-sm font-bold text-text-primary">Worry Topic Frequency (30 days)</h2>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={worryFreq} margin={{ left: 0, right: 8, top: 5, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="topic" tick={{ fontSize: 9, fill: 'hsl(var(--text-secondary))' }}
                          angle={-35} textAnchor="end" interval={0}
                        />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} allowDecimals={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Days" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
