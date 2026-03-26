'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Legend, CartesianGrid,
} from 'recharts'
import {
  Brain, AlertTriangle, ChevronDown, ChevronUp, Activity,
  BookOpen, TrendingUp, Save, CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type PainScienceLog,
  type PainScienceAnalysis,
  PAIN_QUALITIES,
  PAIN_LOCATIONS,
  HELPFUL_STRATEGIES,
  TSK4_QUESTIONS,
  CSI9_SYMPTOMS,
  TSK_SCALE_LABELS,
  CSI_SCALE_LABELS,
  PCS_SCALE_LABELS,
  PAIN_EDUCATION_MODULES,
  getFearAvoidanceBadge,
  DEFAULT_LOG,
  getGradedActivityPlan,
} from '@/lib/pain-science'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendPoint {
  date: string
  value?: number
  biological?: number
  psychological?: number
  social?: number
  moved?: number
  minutes?: number
}

interface ApiData {
  todayLog: PainScienceLog | null
  analysis: PainScienceAnalysis | null
  trends: {
    painLevel: TrendPoint[]
    catastrophizing: TrendPoint[]
    kinesiophobia: TrendPoint[]
    biopsychosocial: TrendPoint[]
    movement: TrendPoint[]
  }
  topLocations: { location: string; count: number }[]
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function Disclaimer() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 mb-6">
      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
      <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
        <span className="font-semibold">Educational purposes only.</span> This tool provides pain
        science education and self-tracking. It does not constitute medical advice. Always consult a
        qualified healthcare provider for diagnosis, treatment, and before changing any pain
        management plan.
      </p>
    </div>
  )
}

function ScoreCard({
  label,
  score,
  maxScore,
  threshold,
  highLabel,
  lowLabel,
}: {
  label: string
  score: number
  maxScore: number
  threshold: number
  highLabel: string
  lowLabel: string
}) {
  const pct = Math.round((score / maxScore) * 100)
  const isHigh = score >= threshold
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span
          className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            isHigh
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
          )}
        >
          {isHigh ? highLabel : lowLabel}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-text-primary">{score}</span>
        <span className="text-text-secondary text-sm mb-0.5">/ {maxScore}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-surface-secondary overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', isHigh ? 'bg-red-500' : 'bg-green-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm border transition-colors',
            selected.includes(opt)
              ? 'bg-accent/10 border-accent/40 text-accent font-medium'
              : 'bg-surface border-border text-text-secondary hover:border-border/60',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function RatingRow({
  label,
  value,
  max,
  labels,
  onChange,
}: {
  label: string
  value: number
  max: number
  labels: string[]
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm text-text-primary">{label}</span>
        <span className="text-sm font-semibold text-accent">{value}</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: max + 1 }, (_, i) => i).map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            title={labels[i]}
            className={cn(
              'flex-1 h-8 rounded text-xs font-medium border transition-colors',
              value === i
                ? 'bg-accent text-white border-accent'
                : 'bg-surface border-border text-text-secondary hover:border-accent/40',
            )}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[10px] text-text-tertiary">{labels[0]}</span>
        <span className="text-[10px] text-text-tertiary">{labels[labels.length - 1]}</span>
      </div>
    </div>
  )
}

function LikertRow({
  label,
  value,
  min,
  max,
  labels,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  labels: string[]
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-4">
      <p className="text-sm text-text-primary mb-2 leading-relaxed">{label}</p>
      <div className="flex gap-1">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            title={labels[i - min]}
            className={cn(
              'flex-1 py-2 rounded text-xs font-semibold border transition-colors',
              value === i
                ? 'bg-accent text-white border-accent'
                : 'bg-surface border-border text-text-secondary hover:border-accent/40',
            )}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[10px] text-text-tertiary">{labels[0]}</span>
        <span className="text-[10px] text-text-tertiary">{labels[labels.length - 1]}</span>
      </div>
    </div>
  )
}

function AccordionModule({ mod }: { mod: (typeof PAIN_EDUCATION_MODULES)[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 bg-surface hover:bg-surface-secondary transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{mod.emoji}</span>
          <div>
            <p className="font-semibold text-text-primary text-sm">
              Module {mod.id}: {mod.title}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">{mod.concept}</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-text-secondary shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
        )}
      </button>
      {open && (
        <div className="p-4 bg-surface-secondary border-t border-border space-y-3">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Explanation</p>
            <p className="text-sm text-text-primary leading-relaxed">{mod.explanation}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Real-world example</p>
            <p className="text-sm text-text-primary leading-relaxed italic">{mod.example}</p>
          </div>
          <p className="text-xs text-text-tertiary">{mod.citation}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function PainClient() {
  const today = new Date().toISOString().slice(0, 10)

  const [tab, setTab] = useState<'today' | 'learn' | 'trends'>('today')
  const [apiData, setApiData] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [log, setLog] = useState<PainScienceLog>({ ...DEFAULT_LOG, date: today })

  const fetch30 = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pain-science')
      if (res.ok) {
        const d: ApiData = await res.json()
        setApiData(d)
        if (d.todayLog) {
          setLog(d.todayLog)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch30()
  }, [fetch30])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/pain-science', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      })
      if (res.ok) {
        const d = await res.json()
        setApiData((prev) => prev ? { ...prev, todayLog: d.log, analysis: d.analysis } : prev)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  const set = <K extends keyof PainScienceLog>(key: K, value: PainScienceLog[K]) =>
    setLog((l) => ({ ...l, [key]: value }))

  const toggleChip = (field: 'pain_locations' | 'pain_quality' | 'avoided_activities' | 'helpful_strategies', val: string) => {
    setLog((l) => {
      const arr = l[field] as string[]
      return {
        ...l,
        [field]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
      }
    })
  }

  const setCsiSymptom = (idx: number, val: number) =>
    setLog((l) => {
      const arr = [...(l.csi_symptoms || [0, 0, 0, 0, 0, 0, 0, 0, 0])]
      arr[idx] = val
      return { ...l, csi_symptoms: arr }
    })

  const tskScore = log.tsk_q1 + log.tsk_q2 + log.tsk_q3 + log.tsk_q4
  const csiScore = (log.csi_symptoms || []).reduce((s, v) => s + v, 0)
  const pcsScore = log.pcs_rumination + log.pcs_magnification + log.pcs_helplessness
  const activityPlan = getGradedActivityPlan(log.pain_level)

  const analysis = apiData?.analysis

  const PAIN_NRS_LABELS: Record<number, string> = {
    0: '😌 None', 1: '🙂 Minimal', 2: '😐 Mild', 3: '😕 Uncomfortable',
    4: '😟 Moderate', 5: '😣 Distressing', 6: '😰 Very Distressing',
    7: '😱 Severe', 8: '😭 Intense', 9: '🤯 Very Intense', 10: '💀 Worst',
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Pain Science</h1>
              <p className="text-xs text-text-secondary">Education & biopsychosocial tracking</p>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 bg-surface-secondary rounded-xl p-1">
            {(['today', 'learn', 'trends'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors capitalize',
                  tab === t
                    ? 'bg-background text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {t === 'today' && <Activity className="w-3.5 h-3.5" />}
                {t === 'learn' && <BookOpen className="w-3.5 h-3.5" />}
                {t === 'trends' && <TrendingUp className="w-3.5 h-3.5" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-5">
        <Disclaimer />

        {/* ──────────────── TODAY TAB ──────────────── */}
        {tab === 'today' && (
          <>
            {/* Pain Level */}
            <section className="bg-surface border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-text-primary mb-4">Pain Level (NRS 0–10)</h2>
              <div className="text-center mb-3">
                <span className="text-4xl font-bold text-text-primary">{log.pain_level}</span>
                <span className="text-text-secondary">/10</span>
                <p className="text-text-secondary text-sm mt-1">{PAIN_NRS_LABELS[log.pain_level]}</p>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={log.pain_level}
                onChange={(e) => set('pain_level', Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                <span>0 – No Pain</span>
                <span>5 – Moderate</span>
                <span>10 – Worst</span>
              </div>
            </section>

            {/* Pain Locations */}
            <section className="bg-surface border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-text-primary mb-3">Pain Locations</h2>
              <ChipGroup
                options={PAIN_LOCATIONS}
                selected={log.pain_locations}
                onToggle={(v) => toggleChip('pain_locations', v)}
              />
            </section>

            {/* Pain Quality */}
            <section className="bg-surface border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-text-primary mb-3">Pain Quality</h2>
              <ChipGroup
                options={PAIN_QUALITIES}
                selected={log.pain_quality}
                onToggle={(v) => toggleChip('pain_quality', v)}
              />
            </section>

            {/* Biopsychosocial Contributors */}
            <section className="bg-surface border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-text-primary mb-1">Biopsychosocial Contributors</h2>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                Rate how much each domain feels like it is contributing to your pain today. These are not blame labels — all three domains influence pain through the nervous system.
              </p>
              <div className="space-y-2">
                {[
                  { key: 'biological_contributors' as const, label: '🔬 Biological (tissue, inflammation, injury)', color: 'bg-blue-500' },
                  { key: 'psychological_contributors' as const, label: '🧠 Psychological (stress, fear, mood, beliefs)', color: 'bg-purple-500' },
                  { key: 'social_contributors' as const, label: '👥 Social (work, relationships, finances)', color: 'bg-orange-500' },
                ].map(({ key, label, color }) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-text-primary">{label}</span>
                      <span className="text-sm font-bold text-text-primary">{log[key]}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={log[key]}
                      onChange={(e) => set(key, Number(e.target.value))}
                      className="w-full accent-[var(--accent)]"
                    />
                    <div className="h-1.5 rounded-full bg-surface-secondary mt-1 overflow-hidden">
                      <div className={cn('h-full rounded-full', color)} style={{ width: `${((log[key] - 1) / 9) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* PCS-3 Catastrophizing */}
            <section className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex justify-between items-start mb-1">
                <h2 className="font-semibold text-text-primary">Catastrophizing Check (PCS-3)</h2>
                <span className="text-sm font-bold text-accent">{pcsScore}/12</span>
              </div>
              <p className="text-xs text-text-secondary mb-4">
                Rate how much these thoughts apply right now. Catastrophizing amplifies pain — awareness is the first step.
              </p>
              <RatingRow
                label={"\"I can't stop thinking about how much it hurts.\""}
                value={log.pcs_rumination}
                max={4}
                labels={PCS_SCALE_LABELS}
                onChange={(v) => set('pcs_rumination', v)}
              />
              <RatingRow
                label={'"I wonder whether something serious may happen."'}
                value={log.pcs_magnification}
                max={4}
                labels={PCS_SCALE_LABELS}
                onChange={(v) => set('pcs_magnification', v)}
              />
              <RatingRow
                label={"\"There's nothing I can do to reduce the intensity.\""}
                value={log.pcs_helplessness}
                max={4}
                labels={PCS_SCALE_LABELS}
                onChange={(v) => set('pcs_helplessness', v)}
              />
              {pcsScore >= 8 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 mt-2">
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    High catastrophizing (≥8) is associated with greater pain and disability. Consider speaking with a pain psychologist or trying CBT-based coping strategies.
                  </p>
                </div>
              )}
            </section>

            {/* Movement */}
            <section className="bg-surface border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-text-primary mb-4">Movement Today</h2>
              <div className="flex items-center gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => set('movement_today', !log.movement_today)}
                  className={cn(
                    'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                    log.movement_today ? 'bg-accent' : 'bg-surface-secondary border border-border',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                      log.movement_today ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
                <span className="text-sm text-text-primary">{log.movement_today ? 'Yes — I moved today' : 'No movement yet'}</span>
              </div>
              {log.movement_today && (
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">
                    Minutes of movement: <strong className="text-text-primary">{log.movement_minutes}</strong>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={120}
                    step={5}
                    value={log.movement_minutes}
                    onChange={(e) => set('movement_minutes', Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                </div>
              )}

              {/* Graded Activity Guidance */}
              <div className={cn(
                'mt-4 rounded-xl p-3 border',
                log.pain_level <= 3 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' :
                log.pain_level <= 6 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' :
                'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
              )}>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">{activityPlan.phase}</p>
                <p className="text-sm text-text-primary leading-relaxed">{activityPlan.recommendation}</p>
                <p className="text-xs text-text-secondary mt-2">
                  <strong>Next step:</strong> {activityPlan.nextStep}
                </p>
              </div>
            </section>

            {/* Avoided Activities */}
            <section className="bg-surface border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-text-primary mb-2">Activities Avoided Today</h2>
              <p className="text-xs text-text-secondary mb-3">
                Tracking avoidance helps identify fear-avoidance patterns. Avoidance maintains pain over time.
              </p>
              <ChipGroup
                options={['Walking', 'Exercise', 'Work tasks', 'Social activities', 'Bending', 'Lifting', 'Sitting', 'Standing', 'Driving']}
                selected={log.avoided_activities}
                onToggle={(v) => toggleChip('avoided_activities', v)}
              />
            </section>

            {/* Helpful Strategies */}
            <section className="bg-surface border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-text-primary mb-3">Helpful Strategies Used</h2>
              <ChipGroup
                options={HELPFUL_STRATEGIES}
                selected={log.helpful_strategies}
                onToggle={(v) => toggleChip('helpful_strategies', v)}
              />
            </section>

            {/* Notes */}
            <section className="bg-surface border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-text-primary mb-3">Notes</h2>
              <textarea
                value={log.notes ?? ''}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Any observations about your pain today, what helped or made it worse..."
                className="w-full bg-surface-secondary border border-border rounded-xl p-3 text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:border-accent/40"
                rows={3}
              />
            </section>

            {/* Analysis cards (if saved today) */}
            {analysis && (
              <section>
                <h2 className="font-semibold text-text-primary mb-3">Today&apos;s Analysis</h2>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <ScoreCard
                    label="Catastrophizing"
                    score={analysis.catastrophizingScore}
                    maxScore={12}
                    threshold={8}
                    highLabel="High"
                    lowLabel="OK"
                  />
                  <ScoreCard
                    label="Kinesiophobia"
                    score={analysis.kinesiophobiaScore}
                    maxScore={16}
                    threshold={14}
                    highLabel="High"
                    lowLabel="OK"
                  />
                  <ScoreCard
                    label="Central Sensitization"
                    score={analysis.centralSensitizationScore}
                    maxScore={36}
                    threshold={30}
                    highLabel="Likely"
                    lowLabel="Low"
                  />
                  <div className="bg-surface border border-border rounded-2xl p-4">
                    <p className="text-sm font-medium text-text-primary mb-1">Fear-Avoidance Risk</p>
                    {(() => {
                      const b = getFearAvoidanceBadge(analysis.fearAvoidanceRisk)
                      return (
                        <span className={cn('text-sm font-bold px-2 py-1 rounded-lg', b.bg, b.color)}>
                          {b.label}
                        </span>
                      )
                    })()}
                  </div>
                </div>
                <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-text-primary mb-2">Recommendations</p>
                  {analysis.recommendations.map((r, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <p className="text-sm text-text-secondary leading-relaxed">{r}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-colors',
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-accent text-white hover:opacity-90 disabled:opacity-60',
              )}
            >
              {saved ? (
                <><CheckCircle className="w-4 h-4" /> Saved!</>
              ) : saving ? (
                'Saving...'
              ) : (
                <><Save className="w-4 h-4" /> Save Today&apos;s Log</>
              )}
            </button>
          </>
        )}

        {/* ──────────────── LEARN TAB ──────────────── */}
        {tab === 'learn' && (
          <>
            {/* Education Modules */}
            <section>
              <h2 className="font-semibold text-text-primary mb-3">Pain Neuroscience Education</h2>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                Pain neuroscience education (PNE) reduces chronic pain by ~50% (Moseley & Butler 2017). These 5 modules cover the key concepts.
              </p>
              <div className="space-y-3">
                {PAIN_EDUCATION_MODULES.map((mod) => (
                  <AccordionModule key={mod.id} mod={mod} />
                ))}
              </div>
            </section>

            {/* Fear-Avoidance Cycle */}
            <section className="bg-surface border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-text-primary mb-3">The Fear-Avoidance Cycle</h2>
              <p className="text-xs text-text-secondary mb-4">
                Vlaeyen & Linton 2000 — understanding this cycle is the first step to breaking it.
              </p>
              <div className="flex flex-col items-center gap-2 text-sm">
                {[
                  { emoji: '⚡', text: 'Pain Experience' },
                  { emoji: '💭', text: 'Pain Catastrophizing (magnification, rumination, helplessness)' },
                  { emoji: '😨', text: 'Fear of Movement (Kinesiophobia)' },
                  { emoji: '🚫', text: 'Avoidance of Activity' },
                  { emoji: '📉', text: 'Disuse, Deconditioning, Depression' },
                  { emoji: '🔄', text: 'More Pain → Cycle continues' },
                ].map((item, i, arr) => (
                  <React.Fragment key={item.emoji}>
                    <div className="flex items-center gap-3 w-full bg-surface-secondary rounded-xl px-4 py-3">
                      <span className="text-xl">{item.emoji}</span>
                      <span className="text-text-primary text-sm">{item.text}</span>
                    </div>
                    {i < arr.length - 1 && <span className="text-text-tertiary text-lg">↓</span>}
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3">
                <p className="text-xs font-semibold text-green-800 dark:text-green-300 mb-1">Breaking the cycle:</p>
                <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
                  Pain neuroscience education → reduced catastrophizing → reduced fear → graded exposure → increased activity → reduced sensitization → less pain.
                </p>
              </div>
            </section>

            {/* TSK-4 Screener */}
            <section className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex justify-between items-start mb-1">
                <h2 className="font-semibold text-text-primary">Kinesiophobia Screener (TSK-4)</h2>
                <span className="text-sm font-bold text-accent">{tskScore}/16</span>
              </div>
              <p className="text-xs text-text-secondary mb-1">
                Tampa Scale of Kinesiophobia — short form (Roelofs et al. 2007). Score ≥14 = high kinesiophobia.
              </p>
              <p className="text-xs text-text-tertiary mb-4">Rate 1 = Strongly Disagree → 4 = Strongly Agree</p>
              {TSK4_QUESTIONS.map((q, i) => (
                <LikertRow
                  key={i}
                  label={`${i + 1}. "${q}"`}
                  value={(log as Record<string, number>)[`tsk_q${i + 1}`] || 1}
                  min={1}
                  max={4}
                  labels={TSK_SCALE_LABELS}
                  onChange={(v) => set(`tsk_q${i + 1}` as keyof PainScienceLog, v as never)}
                />
              ))}
              <div className={cn(
                'rounded-xl p-3 mt-2 border',
                tskScore >= 14
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                  : tskScore >= 10
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
              )}>
                <p className="text-xs font-semibold mb-1">
                  Score: {tskScore}/16 —{' '}
                  {tskScore >= 14 ? '⚠️ High kinesiophobia' : tskScore >= 10 ? '⚡ Moderate' : '✅ Low kinesiophobia'}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {tskScore >= 14
                    ? 'High fear of movement detected. Graded exposure therapy under a pain physiotherapist can retrain the nervous system to feel safe with movement.'
                    : tskScore >= 10
                    ? 'Some fear of movement present. Gentle graded activity and pain neuroscience education are recommended.'
                    : 'Low kinesiophobia. Keep moving with confidence — activity is generally protective for chronic pain.'}
                </p>
              </div>
            </section>

            {/* CSI-9 */}
            <section className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex justify-between items-start mb-1">
                <h2 className="font-semibold text-text-primary">Central Sensitization (CSI-9)</h2>
                <span className="text-sm font-bold text-accent">{csiScore}/36</span>
              </div>
              <p className="text-xs text-text-secondary mb-1">
                Central Sensitization Inventory short form. Score ≥30 = central sensitization likely.
              </p>
              <p className="text-xs text-text-tertiary mb-4">Rate each symptom over the past week: 0 = Never → 4 = Always</p>
              {CSI9_SYMPTOMS.map((symptom, i) => (
                <RatingRow
                  key={i}
                  label={symptom}
                  value={(log.csi_symptoms || [])[i] ?? 0}
                  max={4}
                  labels={CSI_SCALE_LABELS}
                  onChange={(v) => setCsiSymptom(i, v)}
                />
              ))}
              <div className={cn(
                'rounded-xl p-3 mt-2 border',
                csiScore >= 30
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                  : csiScore >= 20
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
              )}>
                <p className="text-xs font-semibold mb-1">
                  Score: {csiScore}/36 —{' '}
                  {csiScore >= 30 ? '⚠️ Central sensitization likely' : csiScore >= 20 ? '⚡ Moderate' : '✅ Low'}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {csiScore >= 30
                    ? 'Central sensitization likely. This means your nervous system may be amplifying signals. Pain neuroscience education, pacing strategies, sleep improvement, and stress management are key priorities. Discuss with your healthcare provider.'
                    : csiScore >= 20
                    ? 'Moderate central sensitization features. Focus on sleep quality, stress management, and pacing activities to reduce nervous system load.'
                    : 'Low central sensitization indicators. Your nervous system appears to be processing pain signals within normal range.'}
                </p>
              </div>
            </section>

            {/* Graded Activity Plan */}
            <section className="bg-surface border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-text-primary mb-1">Graded Activity Plan</h2>
              <p className="text-xs text-text-secondary mb-4">Based on your current pain level ({log.pain_level}/10)</p>
              <div className="space-y-3">
                {[0, 4, 7].map((level) => {
                  const plan = getGradedActivityPlan(level)
                  const isActive = (level === 0 && log.pain_level <= 3) || (level === 4 && log.pain_level >= 4 && log.pain_level <= 6) || (level === 7 && log.pain_level >= 7)
                  return (
                    <div key={level} className={cn('rounded-xl p-4 border', isActive ? 'border-accent/40 bg-accent/5' : 'border-border bg-surface-secondary')}>
                      <p className={cn('text-sm font-semibold mb-1', isActive ? 'text-accent' : 'text-text-primary')}>
                        {isActive && '→ '}{plan.phase}
                        {level === 0 && ' (Pain 0–3)'}
                        {level === 4 && ' (Pain 4–6)'}
                        {level === 7 && ' (Pain 7–10)'}
                      </p>
                      <p className="text-xs text-text-secondary leading-relaxed">{plan.recommendation}</p>
                      <p className="text-xs text-text-tertiary mt-2"><strong>Next:</strong> {plan.nextStep}</p>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 bg-surface-secondary border border-border rounded-xl p-3">
                <p className="text-xs font-semibold text-text-secondary mb-1">Pain Pacing Model</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Alternate <strong>10–15 min activity</strong> with <strong>5–10 min rest</strong>. Stop before pain spikes — not after. Build capacity gradually, not boom-bust.
                </p>
              </div>
            </section>
          </>
        )}

        {/* ──────────────── TRENDS TAB ──────────────── */}
        {tab === 'trends' && (
          <>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading trends...</div>
            ) : !apiData || (apiData.trends.painLevel.length === 0) ? (
              <div className="text-center py-12 text-text-secondary">
                <Brain className="w-10 h-10 mx-auto mb-3 text-text-tertiary" />
                <p>No data yet. Start logging daily pain to see trends.</p>
              </div>
            ) : (
              <>
                {/* Pain Level Chart */}
                <section className="bg-surface border border-border rounded-2xl p-5">
                  <h2 className="font-semibold text-text-primary mb-4">30-Day Pain Level</h2>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={apiData.trends.painLevel}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => [`${v}/10`, 'Pain']} labelFormatter={(l) => `Date: ${l}`} />
                      <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </section>

                {/* Catastrophizing + Kinesiophobia */}
                <section className="bg-surface border border-border rounded-2xl p-5">
                  <h2 className="font-semibold text-text-primary mb-4">Catastrophizing & Kinesiophobia Trends</h2>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} allowDuplicatedCategory={false} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line data={apiData.trends.catastrophizing} type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} name="Catastrophizing (0-12)" />
                      <Line data={apiData.trends.kinesiophobia} type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} name="Kinesiophobia (4-16)" />
                    </LineChart>
                  </ResponsiveContainer>
                </section>

                {/* Biopsychosocial Balance */}
                <section className="bg-surface border border-border rounded-2xl p-5">
                  <h2 className="font-semibold text-text-primary mb-4">Biopsychosocial Balance</h2>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={apiData.trends.biopsychosocial}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis domain={[1, 10]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="biological" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Biological" />
                      <Area type="monotone" dataKey="psychological" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} name="Psychological" />
                      <Area type="monotone" dataKey="social" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.3} name="Social" />
                    </AreaChart>
                  </ResponsiveContainer>
                </section>

                {/* Movement */}
                <section className="bg-surface border border-border rounded-2xl p-5">
                  <h2 className="font-semibold text-text-primary mb-4">Movement Consistency</h2>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={apiData.trends.movement}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v, n) => [n === 'minutes' ? `${v} min` : v === 1 ? 'Yes' : 'No', n === 'minutes' ? 'Minutes' : 'Moved']} />
                      <Bar dataKey="minutes" fill="var(--accent)" opacity={0.8} radius={[3, 3, 0, 0]} name="minutes" />
                    </BarChart>
                  </ResponsiveContainer>
                </section>

                {/* Top Pain Locations */}
                {apiData.topLocations.length > 0 && (
                  <section className="bg-surface border border-border rounded-2xl p-5">
                    <h2 className="font-semibold text-text-primary mb-4">Pain Location Frequency (30 days)</h2>
                    <div className="space-y-2">
                      {apiData.topLocations.map(({ location, count }) => (
                        <div key={location} className="flex items-center gap-3">
                          <span className="text-sm text-text-primary w-28 shrink-0">{location}</span>
                          <div className="flex-1 h-5 bg-surface-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent/60 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (count / 30) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-secondary w-8 text-right">{count}d</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
