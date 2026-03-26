'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Activity,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  RotateCcw,
  Save,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'
import { FMS_TESTS, FMSScore, FMSResult, calculateFMS } from '@/lib/fms'

type Tab = 'assess' | 'results' | 'history'

interface DraftScore {
  score?: number
  score_left?: number
  score_right?: number
}

interface SavedAssessment {
  id: string
  assessed_at: string
  total_score: number
  risk_level: 'Low' | 'Elevated' | 'High'
  weak_links: string[]
  asymmetries: string[]
}

const SCORE_LABELS: Record<number, string> = {
  3: 'Perfect',
  2: 'Compensated',
  1: 'Cannot',
  0: 'Pain',
}

function ScoreSelector({
  value,
  onChange,
  label,
}: {
  value: number | undefined
  onChange: (v: number) => void
  label?: string
}) {
  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{label}</p>}
      <div className="grid grid-cols-4 gap-2">
        {[3, 2, 1, 0].map((s) => {
          const isSelected = value === s
          const colorActive =
            s === 3
              ? 'bg-green-500 border-green-500 text-white'
              : s === 2
              ? 'bg-blue-500 border-blue-500 text-white'
              : s === 1
              ? 'bg-yellow-500 border-yellow-500 text-white'
              : 'bg-red-500 border-red-500 text-white'
          const colorInactive =
            s === 3
              ? 'border-green-300 text-green-700 hover:bg-green-50'
              : s === 2
              ? 'border-blue-300 text-blue-700 hover:bg-blue-50'
              : s === 1
              ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
              : 'border-red-300 text-red-700 hover:bg-red-50'
          return (
            <button
              key={s}
              onClick={() => onChange(s)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-3 px-1 rounded-xl border-2 transition-all',
                isSelected ? colorActive : `bg-surface ${colorInactive}`
              )}
            >
              <span className="text-xl font-bold leading-none">{s}</span>
              <span className="text-[10px] font-medium leading-tight">{SCORE_LABELS[s]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ScoreRing({ score }: { score: number }) {
  const r = 44
  const c = 2 * Math.PI * r
  const offset = c * (1 - score / 21)
  const color = score >= 15 ? '#22c55e' : score >= 12 ? '#eab308' : '#ef4444'
  return (
    <svg width="130" height="130" viewBox="0 0 110 110" aria-label={`FMS score ${score} out of 21`}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-border" />
      <circle
        cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="55" y="50" textAnchor="middle" fontSize="28" fontWeight="800" fill={color}>{score}</text>
      <text x="55" y="67" textAnchor="middle" fontSize="12" fill="#9ca3af">/ 21</text>
    </svg>
  )
}

function riskBadgeClass(risk: string) {
  if (risk === 'Low') return 'bg-green-100 text-green-700 border-green-200'
  if (risk === 'Elevated') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return 'bg-red-100 text-red-700 border-red-200'
}

export default function MobilityPage() {
  const [tab, setTab] = useState<Tab>('assess')
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Record<string, DraftScore>>({})
  const [result, setResult] = useState<FMSResult | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [history, setHistory] = useState<SavedAssessment[]>([])
  const [trend, setTrend] = useState<{ date: string; total: number }[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/fms')
      if (res.ok) {
        const data = await res.json()
        setHistory(data.assessments ?? [])
        setTrend(data.trend ?? [])
      }
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const currentTest = FMS_TESTS[step]
  const currentDraft = draft[currentTest?.id] ?? {}

  const isCurrentComplete = () => {
    if (!currentTest) return false
    if (currentTest.bilateral) {
      return currentDraft.score_left !== undefined && currentDraft.score_right !== undefined
    }
    return currentDraft.score !== undefined
  }

  const setScore = (testId: string, value: number, side?: 'left' | 'right') => {
    setDraft((prev) => {
      const existing = prev[testId] ?? {}
      if (side === 'left') return { ...prev, [testId]: { ...existing, score_left: value } }
      if (side === 'right') return { ...prev, [testId]: { ...existing, score_right: value } }
      return { ...prev, [testId]: { ...existing, score: value } }
    })
  }

  const finishAssessment = () => {
    const scores: FMSScore[] = FMS_TESTS.map((test) => {
      const d = draft[test.id] ?? {}
      if (test.bilateral) {
        const sl = d.score_left ?? 0
        const sr = d.score_right ?? 0
        return { test_id: test.id, score_left: sl, score_right: sr, pain: sl === 0 || sr === 0 }
      }
      const s = d.score ?? 0
      return { test_id: test.id, score: s, pain: s === 0 }
    })
    const r = calculateFMS(scores)
    setResult(r)
    setSaved(false)
    setTab('results')
  }

  const handleNext = () => {
    if (!isCurrentComplete()) return
    if (step < FMS_TESTS.length - 1) {
      setStep(step + 1)
      setShowGuide(false)
    } else {
      finishAssessment()
    }
  }

  const handleBack = () => {
    if (step > 0) { setStep(step - 1); setShowGuide(false) }
  }

  const handleReset = () => {
    setStep(0)
    setDraft({})
    setResult(null)
    setSaved(false)
    setShowGuide(false)
    setTab('assess')
  }

  const handleSave = async () => {
    if (!result || saving || saved) return
    setSaving(true)
    try {
      const res = await fetch('/api/fms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores: result.scores,
          total_score: result.total,
          risk_level: result.risk_level,
          weak_links: result.weak_links,
          asymmetries: result.asymmetries,
        }),
      })
      if (res.ok) {
        setSaved(true)
        await fetchHistory()
      }
    } finally {
      setSaving(false)
    }
  }

  // ─── ASSESS TAB ────────────────────────────────────────────────
  const renderAssessTab = () => {
    if (!currentTest) return null
    const progress = ((step + 1) / FMS_TESTS.length) * 100
    const doneCount = Object.keys(draft).length

    return (
      <div className="space-y-5">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Test {step + 1} of {FMS_TESTS.length} ({doneCount} scored)</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-1">
            {FMS_TESTS.map((t, i) => {
              const d = draft[t.id]
              const done = d !== undefined && (t.bilateral
                ? d.score_left !== undefined && d.score_right !== undefined
                : d.score !== undefined)
              return (
                <button
                  key={t.id}
                  onClick={() => { setStep(i); setShowGuide(false) }}
                  className={cn(
                    'w-6 h-6 rounded-full text-[10px] font-bold border-2 transition-colors',
                    i === step
                      ? 'bg-primary text-white border-primary'
                      : done
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-surface border-border text-text-secondary'
                  )}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>

        {/* Test info card */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-text-primary">{currentTest.name}</h2>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {currentTest.targetArea.slice(0, 3).map((area) => (
                  <span
                    key={area}
                    className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                  >
                    {area}
                  </span>
                ))}
                {currentTest.bilateral && (
                  <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Bilateral
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs font-bold bg-surface-secondary text-text-secondary px-2 py-1 rounded-lg shrink-0">
              #{step + 1}
            </span>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed">{currentTest.description}</p>

          <div className="bg-background rounded-xl p-4 border border-border">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">How to Perform</p>
            <p className="text-sm text-text-primary leading-relaxed">{currentTest.position}</p>
          </div>

          {/* Scoring guide toggle */}
          <button
            onClick={() => setShowGuide((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-primary"
          >
            <Info className="w-4 h-4" />
            {showGuide ? 'Hide' : 'Show'} scoring guide
          </button>

          {showGuide && (
            <div className="space-y-2">
              {[
                { n: 3, label: 'Perfect', text: currentTest.scoring.three, cls: 'bg-green-50 border-green-200 text-green-800' },
                { n: 2, label: 'Compensated', text: currentTest.scoring.two, cls: 'bg-blue-50 border-blue-200 text-blue-800' },
                { n: 1, label: 'Cannot Perform', text: currentTest.scoring.one, cls: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
                { n: 0, label: 'Pain — Refer', text: currentTest.scoring.zero, cls: 'bg-red-50 border-red-200 text-red-800' },
              ].map(({ n, label, text, cls }) => (
                <div key={n} className={cn('rounded-xl p-3 border', cls)}>
                  <p className="text-xs font-bold mb-0.5">{n} – {label}</p>
                  <p className="text-xs leading-relaxed opacity-90">{text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Score input card */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-5">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Score This Test</p>

          {currentTest.bilateral ? (
            <>
              <ScoreSelector
                label="Left Side"
                value={currentDraft.score_left}
                onChange={(v) => setScore(currentTest.id, v, 'left')}
              />
              <ScoreSelector
                label="Right Side"
                value={currentDraft.score_right}
                onChange={(v) => setScore(currentTest.id, v, 'right')}
              />
              {currentDraft.score_left !== undefined && currentDraft.score_right !== undefined && (
                <p className="text-xs text-center text-text-secondary">
                  Effective score:{' '}
                  <span className="font-bold text-text-primary">
                    {Math.min(currentDraft.score_left, currentDraft.score_right)}
                  </span>{' '}
                  (lower of L/R per FMS protocol)
                </p>
              )}
            </>
          ) : (
            <ScoreSelector
              value={currentDraft.score}
              onChange={(v) => setScore(currentTest.id, v)}
            />
          )}
        </div>

        {/* Common compensations */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Watch For</p>
          <div className="flex flex-wrap gap-1.5">
            {currentTest.commonCompensations.map((c) => (
              <span key={c} className="text-[11px] bg-background border border-border text-text-secondary px-2 py-0.5 rounded-full">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Nav buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors',
              step === 0
                ? 'border-border text-text-secondary opacity-40 cursor-not-allowed'
                : 'border-border text-text-primary hover:bg-surface-secondary'
            )}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={handleNext}
            disabled={!isCurrentComplete()}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors',
              isCurrentComplete()
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-surface border border-border text-text-secondary cursor-not-allowed opacity-60'
            )}
          >
            {step === FMS_TESTS.length - 1 ? 'Calculate Results' : 'Next Test'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // ─── RESULTS TAB ──────────────────────────────────────────────
  const renderResultsTab = () => {
    if (!result) {
      return (
        <div className="text-center py-16 space-y-4">
          <Activity className="w-12 h-12 text-text-secondary mx-auto" />
          <p className="text-text-secondary">Complete the assessment to see your results.</p>
          <button
            onClick={() => setTab('assess')}
            className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-semibold"
          >
            Start Assessment
          </button>
        </div>
      )
    }

    const { total, risk_level, weak_links, asymmetries, corrective_priorities } = result

    return (
      <div className="space-y-5">
        {/* Score ring + risk */}
        <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-3">
          <div className="flex justify-center">
            <ScoreRing score={total} />
          </div>
          <span className={cn('inline-block px-4 py-1.5 rounded-full text-sm font-bold border', riskBadgeClass(risk_level))}>
            {risk_level} Injury Risk
          </span>
          <p className="text-sm text-text-secondary max-w-xs mx-auto">
            {risk_level === 'Low'
              ? 'Good movement quality. Maintain with regular screening every 6–8 weeks.'
              : risk_level === 'Elevated'
              ? 'Moderate risk. Address corrective priorities before increasing training load.'
              : 'Elevated injury risk. Focus on corrective exercises before heavy loading.'}
          </p>
          <p className="text-xs text-text-secondary">
            Threshold ≤14 = elevated injury risk · Cook et al., NAJSPT 2006 · Kiesel et al., NAJSPT 2007
          </p>
        </div>

        {/* Asymmetries alert */}
        {asymmetries.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">Asymmetries Detected</p>
              <p className="text-xs text-yellow-700 mt-1">
                L–R difference ≥1 point: <strong>{asymmetries.join(', ')}</strong>
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Asymmetries increase injury risk even when total score is adequate. Prioritise bilateral balance.
              </p>
            </div>
          </div>
        )}

        {/* Weak links */}
        {weak_links.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-sm font-semibold text-text-primary mb-2">Weak Links (score ≤ 1)</p>
            <div className="flex flex-wrap gap-2">
              {weak_links.map((l) => (
                <span key={l} className="text-xs bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Score breakdown */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">Score Breakdown</p>
          <div className="space-y-2">
            {result.scores.map((s) => {
              const test = FMS_TESTS.find((t) => t.id === s.test_id)
              if (!test) return null
              const eff = s.pain
                ? 0
                : test.bilateral
                ? Math.min(s.score_left ?? 0, s.score_right ?? 0)
                : (s.score ?? 0)
              const effColor =
                eff === 3 ? 'text-green-600' : eff === 2 ? 'text-blue-600' : eff === 1 ? 'text-yellow-600' : 'text-red-600'
              return (
                <div key={s.test_id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm text-text-primary font-medium">{test.name}</p>
                    {test.bilateral && !s.pain && (
                      <p className="text-xs text-text-secondary">L: {s.score_left ?? 0} · R: {s.score_right ?? 0}</p>
                    )}
                    {s.pain && <p className="text-xs text-red-600">Pain — refer to clinician</p>}
                  </div>
                  <span className={cn('text-xl font-bold', effColor)}>{eff}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Corrective exercises */}
        {corrective_priorities.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-text-primary">Corrective Exercise Plan</p>
              <p className="text-xs text-text-secondary mt-0.5">Prioritised by lowest-scoring tests · Reassess in 4–6 weeks</p>
            </div>
            {corrective_priorities.slice(0, 6).map((ex) => (
              <div key={ex.exercise} className="bg-background rounded-xl p-4 border border-border space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{ex.exercise}</p>
                    <p className="text-xs text-text-secondary">{ex.for_test} · {ex.sets_reps}</p>
                  </div>
                </div>
                <p className="text-xs text-text-primary leading-relaxed">
                  <span className="font-medium text-primary">Cue:</span> {ex.cue}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <span className="font-medium">Progression:</span> {ex.progression}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Reassess reminder */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-text-primary">
            <strong>Reassess in 4–6 weeks</strong> to track improvement after corrective programming.
          </p>
        </div>

        {/* Save / Reset */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Retake
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors',
              saved
                ? 'bg-green-500 text-white cursor-default'
                : saving
                ? 'bg-primary/60 text-white cursor-wait'
                : 'bg-primary text-white hover:bg-primary/90'
            )}
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save Assessment'}
          </button>
        </div>
      </div>
    )
  }

  // ─── HISTORY TAB ──────────────────────────────────────────────
  const renderHistoryTab = () => {
    if (historyLoading) {
      return (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )
    }

    if (history.length === 0) {
      return (
        <div className="text-center py-16 space-y-4">
          <Activity className="w-12 h-12 text-text-secondary mx-auto" />
          <p className="text-text-secondary text-sm">No assessments yet. Complete your first FMS to start tracking.</p>
          <button
            onClick={() => setTab('assess')}
            className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-semibold"
          >
            Start Assessment
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        {/* Trend chart */}
        {trend.length > 1 && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-sm font-semibold text-text-primary mb-4">FMS Score Over Time</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis domain={[0, 21]} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v: number) => [v, 'FMS Score']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <ReferenceLine
                  y={14}
                  stroke="#eab308"
                  strokeDasharray="4 4"
                  label={{ value: 'Risk threshold', position: 'right', fontSize: 10, fill: '#eab308' }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Assessments table */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-text-primary">Past Assessments</p>
          </div>
          <div className="divide-y divide-border">
            {history.map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {new Date(a.assessed_at + 'T00:00:00').toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {(a.weak_links ?? []).slice(0, 2).map((l: string) => (
                      <span key={l} className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                        {l}
                      </span>
                    ))}
                    {(a.asymmetries ?? []).length > 0 && (
                      <span className="text-[10px] text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-full">
                        {a.asymmetries.length} asymmetr{a.asymmetries.length === 1 ? 'y' : 'ies'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'text-[11px] font-semibold px-2 py-0.5 rounded-full border',
                      riskBadgeClass(a.risk_level)
                    )}
                  >
                    {a.risk_level}
                  </span>
                  <span
                    className={cn(
                      'text-xl font-bold',
                      a.total_score >= 15 ? 'text-green-600' : a.total_score >= 12 ? 'text-yellow-600' : 'text-red-600'
                    )}
                  >
                    {a.total_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Mobility</h1>
            <p className="text-sm text-text-secondary">Functional Movement Screen (FMS)</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border">
          {(['assess', 'results', 'history'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                tab === t
                  ? 'bg-background text-text-primary shadow-sm border border-border'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'results' && result && (
                <span
                  className={cn(
                    'ml-1.5 text-xs font-bold',
                    result.total >= 15 ? 'text-green-600' : result.total >= 12 ? 'text-yellow-600' : 'text-red-600'
                  )}
                >
                  {result.total}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-28">
        {tab === 'assess' && renderAssessTab()}
        {tab === 'results' && renderResultsTab()}
        {tab === 'history' && renderHistoryTab()}
      </main>

      <BottomNav />
    </div>
  )
}
