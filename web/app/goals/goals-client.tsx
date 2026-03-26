'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  Target, Plus, X, ChevronRight, ChevronLeft, CheckCircle2, TrendingUp,
  Calendar, Flame, Zap, Star, BarChart2, Eye, RotateCcw, Pause, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  GOAL_CATEGORY_CONFIG, analyzeGoal, getDailyQuote,
  type GoalCategory, type GoalStatus, type HealthGoal, type GoalCheckin, type GoalAnalysis,
} from '@/lib/health-goals'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GoalWithAnalysis extends HealthGoal {
  checkins: GoalCheckin[]
  analysis: GoalAnalysis
}

interface Stats {
  total: number
  active: number
  completed: number
  completedThisYear: number
  totalThisYear: number
}

// ─── Progress ring ────────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 52, color }: { pct: number; size?: number; color: string }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(100, pct) / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={5}
        fill="none" className="text-border" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={5}
        fill="none" strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  )
}

// ─── Motivation stars ─────────────────────────────────────────────────────────

function MotivationStars({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Star key={i} className={cn('w-2.5 h-2.5', i < level ? 'fill-amber-400 text-amber-400' : 'text-border')} />
      ))}
    </div>
  )
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onCheckin,
  onStatusChange,
}: {
  goal: GoalWithAnalysis
  onCheckin: (g: GoalWithAnalysis) => void
  onStatusChange: (id: string, status: GoalStatus) => void
}) {
  const cfg = GOAL_CATEGORY_CONFIG[goal.category]
  const { analysis } = goal
  const daysLabel = analysis.daysRemaining === 0 ? 'Due today' :
    analysis.daysRemaining === 1 ? '1 day left' : `${analysis.daysRemaining} days left`

  return (
    <div className={cn('bg-surface border border-border rounded-2xl p-4 space-y-3')}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: cfg.color + '22' }}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: cfg.color + '22', color: cfg.color }}>
              {cfg.label}
            </span>
            {goal.status !== 'active' && (
              <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full',
                goal.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                goal.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                'bg-rose-500/20 text-rose-400')}>
                {goal.status}
              </span>
            )}
            {analysis.onTrack && goal.status === 'active' && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                On track
              </span>
            )}
          </div>
          <h3 className="font-semibold text-text-primary mt-1 truncate">{goal.title}</h3>
          <p className="text-xs text-text-secondary mt-0.5">{goal.specific}</p>
        </div>
        <ProgressRing pct={analysis.progressPct} color={cfg.color} />
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-text-secondary">
          <span>{goal.current_value} {goal.unit}</span>
          <span>{goal.target_value} {goal.unit} · {Math.round(analysis.progressPct)}%</span>
        </div>
        <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${analysis.progressPct}%`, backgroundColor: cfg.color }} />
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-text-secondary">
            <Calendar className="w-3 h-3" />
            <span>{daysLabel}</span>
          </div>
          <MotivationStars level={goal.motivation_level} />
        </div>
        {goal.status === 'active' && (
          <button onClick={() => onCheckin(goal)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-medium hover:bg-primary/20 transition-colors">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Check in
          </button>
        )}
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && goal.status === 'active' && (
        <div className="text-xs text-text-secondary bg-surface-secondary rounded-xl px-3 py-2 space-y-0.5">
          {analysis.recommendations.slice(0, 1).map((r, i) => (
            <p key={i}>{r}</p>
          ))}
        </div>
      )}

      {/* Status actions */}
      {goal.status === 'active' && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => onStatusChange(goal.id!, 'completed')}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            <CheckCircle2 className="w-3.5 h-3.5" /> Complete
          </button>
          <button onClick={() => onStatusChange(goal.id!, 'paused')}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors">
            <Pause className="w-3.5 h-3.5" /> Pause
          </button>
          <button onClick={() => onStatusChange(goal.id!, 'abandoned')}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Abandon
          </button>
        </div>
      )}
      {(goal.status === 'paused' || goal.status === 'abandoned') && (
        <button onClick={() => onStatusChange(goal.id!, 'active')}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> Reactivate
        </button>
      )}
    </div>
  )
}

// ─── Check-in Modal ───────────────────────────────────────────────────────────

function CheckinModal({
  goal,
  onClose,
  onSave,
}: {
  goal: GoalWithAnalysis
  onClose: () => void
  onSave: (data: Partial<GoalCheckin>) => Promise<void>
}) {
  const cfg = GOAL_CATEGORY_CONFIG[goal.category]
  const [currentValue, setCurrentValue] = useState(goal.current_value)
  const [progressRating, setProgressRating] = useState(3)
  const [obstacleEncountered, setObstacleEncountered] = useState('')
  const [planExecuted, setPlanExecuted] = useState(false)
  const [motivationLevel, setMotivationLevel] = useState(goal.motivation_level)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave({
      goal_id: goal.id!,
      date: new Date().toISOString().slice(0, 10),
      current_value: currentValue,
      progress_rating: progressRating,
      obstacle_encountered: obstacleEncountered || undefined,
      plan_executed: planExecuted,
      motivation_level: motivationLevel,
      notes: notes || undefined,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-2xl bg-background rounded-t-2xl border-t border-border p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{cfg.icon}</span>
            <h3 className="font-semibold text-text-primary">Check In</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-secondary">
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
        <p className="text-sm text-text-secondary">{goal.title}</p>

        {/* Current value */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">
            Current {goal.metric || 'value'} ({goal.unit})
          </label>
          <input type="number" value={currentValue} onChange={(e) => setCurrentValue(Number(e.target.value))}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Start: {goal.current_value} {goal.unit}</span>
            <span>Target: {goal.target_value} {goal.unit}</span>
          </div>
        </div>

        {/* Progress rating */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Progress this period (1–5)</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button key={v} onClick={() => setProgressRating(v)}
                className={cn('flex-1 py-2 rounded-xl text-sm font-medium border transition-colors',
                  progressRating === v ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-text-secondary hover:border-primary/50')}>
                {v}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Poor</span><span>Excellent</span>
          </div>
        </div>

        {/* Obstacle (from WOOP) */}
        {goal.obstacle && (
          <div className="bg-surface-secondary rounded-xl p-3 space-y-2">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Your WOOP obstacle</p>
            <p className="text-sm text-text-primary italic">&ldquo;{goal.obstacle}&rdquo;</p>
            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary">Did you encounter this obstacle?</label>
              <textarea value={obstacleEncountered} onChange={(e) => setObstacleEncountered(e.target.value)}
                placeholder="What happened? (optional)"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-text-primary text-sm resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="plan-exec" checked={planExecuted} onChange={(e) => setPlanExecuted(e.target.checked)}
                className="rounded border-border accent-primary" />
              <label htmlFor="plan-exec" className="text-xs text-text-secondary">
                I executed my if-then plan: <span className="italic">{goal.plan}</span>
              </label>
            </div>
          </div>
        )}

        {/* Motivation */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Motivation level: {motivationLevel}/10</label>
          <input type="range" min={1} max={10} value={motivationLevel}
            onChange={(e) => setMotivationLevel(Number(e.target.value))}
            className="w-full accent-primary" />
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Low 😔</span><span>High 🔥</span>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Reflections, wins, learnings..."
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-text-primary text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Check-in'}
        </button>
      </div>
    </div>
  )
}

// ─── Goal Wizard ──────────────────────────────────────────────────────────────

const WIZARD_STEPS = ['Category', 'SMART', 'WOOP', 'Review']

function GoalWizard({ onClose, onSave }: { onClose: () => void; onSave: (g: Partial<HealthGoal>) => Promise<void> }) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<HealthGoal>>({
    category: 'custom',
    status: 'active',
    motivation_level: 7,
    start_date: new Date().toISOString().slice(0, 10),
    current_value: 0,
    target_value: 0,
    specific: '',
    metric: '',
    unit: '',
    wish: '',
    outcome: '',
    obstacle: '',
    plan: '',
    title: '',
    target_date: '',
  })

  const update = (patch: Partial<HealthGoal>) => setDraft((d) => ({ ...d, ...patch }))

  async function handleSave() {
    setSaving(true)
    await onSave(draft)
    setSaving(false)
    onClose()
  }

  const canNext = (() => {
    if (step === 0) return !!draft.category
    if (step === 1) return !!(draft.title && draft.target_date && draft.metric && draft.target_value)
    if (step === 2) return !!(draft.wish && draft.outcome && draft.obstacle && draft.plan)
    return true
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-2xl bg-background rounded-t-2xl border-t border-border max-h-[90vh] overflow-y-auto">
        {/* Progress bar */}
        <div className="h-1 bg-surface-secondary">
          <div className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / WIZARD_STEPS.length) * 100}%` }} />
        </div>

        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary">Step {step + 1} of {WIZARD_STEPS.length}</p>
              <h3 className="font-bold text-text-primary text-lg">{WIZARD_STEPS[step]}</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-secondary">
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>

          {/* Step 0: Category picker */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(GOAL_CATEGORY_CONFIG) as [GoalCategory, typeof GOAL_CATEGORY_CONFIG[GoalCategory]][]).map(([cat, cfg]) => (
                <button key={cat} onClick={() => update({ category: cat })}
                  className={cn('flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
                    draft.category === cat ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:border-primary/30')}>
                  <span className="text-2xl">{cfg.icon}</span>
                  <div>
                    <p className="font-medium text-text-primary text-sm">{cfg.label}</p>
                    <p className="text-xs text-text-secondary line-clamp-1">{cfg.examples[0]}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 1: SMART fields */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-primary/5 rounded-xl p-3 text-xs text-text-secondary space-y-1">
                <p className="font-semibold text-primary">SMART Framework</p>
                <p>Specific · Measurable · Achievable · Relevant · Time-bound</p>
              </div>

              <Field label="Title *" placeholder="e.g. Run a 5K in under 25 minutes">
                <input value={draft.title ?? ''} onChange={(e) => update({ title: e.target.value })}
                  placeholder="e.g. Run a 5K in under 25 minutes" className={inputCls} />
              </Field>

              <Field label="Specific — What exactly will you do?" placeholder="">
                <textarea value={draft.specific ?? ''} onChange={(e) => update({ specific: e.target.value })}
                  placeholder="I will run 3× per week and follow a C25K program"
                  className={cn(inputCls, 'h-20 resize-none')} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Metric (what to measure) *" placeholder="">
                  <input value={draft.metric ?? ''} onChange={(e) => update({ metric: e.target.value })}
                    placeholder="5K time" className={inputCls} />
                </Field>
                <Field label="Unit *" placeholder="">
                  <input value={draft.unit ?? ''} onChange={(e) => update({ unit: e.target.value })}
                    placeholder="minutes" className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Target value *" placeholder="">
                  <input type="number" value={draft.target_value ?? ''} onChange={(e) => update({ target_value: Number(e.target.value) })}
                    placeholder="25" className={inputCls} />
                </Field>
                <Field label="Starting value" placeholder="">
                  <input type="number" value={draft.current_value ?? ''} onChange={(e) => update({ current_value: Number(e.target.value) })}
                    placeholder="0" className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Start date" placeholder="">
                  <input type="date" value={draft.start_date ?? ''} onChange={(e) => update({ start_date: e.target.value })}
                    className={inputCls} />
                </Field>
                <Field label="Target date *" placeholder="">
                  <input type="date" value={draft.target_date ?? ''} onChange={(e) => update({ target_date: e.target.value })}
                    className={inputCls} />
                </Field>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Motivation level: {draft.motivation_level}/10</label>
                <input type="range" min={1} max={10} value={draft.motivation_level ?? 7}
                  onChange={(e) => update({ motivation_level: Number(e.target.value) })}
                  className="w-full accent-primary" />
              </div>
            </div>
          )}

          {/* Step 2: WOOP */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-xs space-y-1">
                <p className="font-semibold text-violet-400">WOOP Framework (Oettingen 2012)</p>
                <p className="text-text-secondary">Mental contrasting doubles goal achievement rates by connecting your wish to real obstacles and concrete plans.</p>
              </div>

              <Field label="Wish — What health outcome do you want? *" placeholder="">
                <textarea value={draft.wish ?? ''} onChange={(e) => update({ wish: e.target.value })}
                  placeholder="I want to run a 5K without stopping"
                  className={cn(inputCls, 'h-20 resize-none')} />
              </Field>

              <Field label="Outcome — Best result if you achieve it? *" placeholder="">
                <textarea value={draft.outcome ?? ''} onChange={(e) => update({ outcome: e.target.value })}
                  placeholder="I'll feel proud, energized, and know I can tackle any challenge"
                  className={cn(inputCls, 'h-20 resize-none')} />
              </Field>

              <Field label="Obstacle — Main internal obstacle? *" placeholder="">
                <textarea value={draft.obstacle ?? ''} onChange={(e) => update({ obstacle: e.target.value })}
                  placeholder="I feel too tired after work and skip training"
                  className={cn(inputCls, 'h-20 resize-none')} />
              </Field>

              <Field label="Plan — If [obstacle] then I will [action] *" placeholder="">
                <textarea value={draft.plan ?? ''} onChange={(e) => update({ plan: e.target.value })}
                  placeholder="If I feel tired after work, then I will lay out my running shoes the night before and run first thing in the morning"
                  className={cn(inputCls, 'h-24 resize-none')} />
              </Field>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              {draft.category && (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface">
                  <span className="text-3xl">{GOAL_CATEGORY_CONFIG[draft.category].icon}</span>
                  <div>
                    <p className="font-bold text-text-primary">{draft.title}</p>
                    <p className="text-sm text-text-secondary">{GOAL_CATEGORY_CONFIG[draft.category].label}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <ReviewRow label="Metric" value={`${draft.target_value} ${draft.unit} (from ${draft.current_value})`} />
                <ReviewRow label="Deadline" value={draft.target_date ?? ''} />
                <ReviewRow label="Specific" value={draft.specific ?? ''} />
              </div>

              <div className="border border-violet-500/20 bg-violet-500/5 rounded-xl p-4 space-y-2 text-sm">
                <p className="font-semibold text-violet-400 text-xs uppercase tracking-wide">WOOP</p>
                <ReviewRow label="W — Wish" value={draft.wish ?? ''} />
                <ReviewRow label="O — Outcome" value={draft.outcome ?? ''} />
                <ReviewRow label="O — Obstacle" value={draft.obstacle ?? ''} />
                <ReviewRow label="P — Plan" value={draft.plan ?? ''} />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Motivation level</span>
                <span className="font-medium text-text-primary">{draft.motivation_level}/10</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 px-4 py-2.5 border border-border rounded-xl text-sm text-text-secondary hover:bg-surface-secondary transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < WIZARD_STEPS.length - 1 ? (
              <button onClick={() => setStep((s) => s + 1)} disabled={!canNext}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : '🎯 Create Goal'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 bg-surface border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-secondary/50'

function Field({ label, children }: { label: string; children: React.ReactNode; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      {children}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="text-text-secondary flex-shrink-0 w-24">{label}</span>
      <span className="text-text-primary flex-1">{value}</span>
    </div>
  )
}

// ─── Vision Board Card ────────────────────────────────────────────────────────

function VisionCard({ goal }: { goal: GoalWithAnalysis }) {
  const cfg = GOAL_CATEGORY_CONFIG[goal.category]
  const { analysis } = goal
  return (
    <div className={cn('relative rounded-2xl p-4 border border-border bg-gradient-to-br overflow-hidden', cfg.gradient)}>
      <div className="absolute top-3 right-3 opacity-30 text-4xl pointer-events-none">{cfg.icon}</div>
      <div className="relative z-10 space-y-3">
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: cfg.color + '22', color: cfg.color }}>
          {cfg.label}
        </span>
        <h3 className="font-bold text-text-primary text-base leading-snug">{goal.title}</h3>
        {goal.wish && (
          <p className="text-xs text-text-secondary italic line-clamp-2">&ldquo;{goal.wish}&rdquo;</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ProgressRing pct={analysis.progressPct} size={40} color={cfg.color} />
            <div>
              <p className="text-sm font-bold text-text-primary">{Math.round(analysis.progressPct)}%</p>
              <p className="text-xs text-text-secondary">{analysis.daysRemaining}d left</p>
            </div>
          </div>
          {goal.status === 'completed' && <span className="text-2xl">🎉</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Progress Tab ─────────────────────────────────────────────────────────────

function ProgressTab({ goals }: { goals: GoalWithAnalysis[] }) {
  const activeGoals = goals.filter((g) => g.status === 'active' || g.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Goal timeline */}
      <section>
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Goal Timeline</h3>
        <div className="space-y-3">
          {activeGoals.map((goal) => {
            const cfg = GOAL_CATEGORY_CONFIG[goal.category]
            const start = new Date(goal.start_date)
            const end = new Date(goal.target_date)
            const today = new Date()
            const total = Math.max(1, end.getTime() - start.getTime())
            const elapsed = Math.min(total, Math.max(0, today.getTime() - start.getTime()))
            const todayPct = (elapsed / total) * 100
            return (
              <div key={goal.id} className="bg-surface border border-border rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{cfg.icon}</span>
                    <span className="text-sm font-medium text-text-primary truncate">{goal.title}</span>
                  </div>
                  <span className="text-xs text-text-secondary">{Math.round(goal.analysis.progressPct)}%</span>
                </div>
                <div className="relative h-3 bg-surface-secondary rounded-full overflow-hidden">
                  {/* Goal progress */}
                  <div className="absolute h-full rounded-full transition-all duration-500"
                    style={{ width: `${goal.analysis.progressPct}%`, backgroundColor: cfg.color + '88' }} />
                  {/* Today marker */}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-white/80"
                    style={{ left: `${todayPct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>{goal.start_date}</span>
                  <span>{goal.target_date}</span>
                </div>
              </div>
            )
          })}
          {activeGoals.length === 0 && (
            <p className="text-sm text-text-secondary text-center py-6">No active goals to display.</p>
          )}
        </div>
      </section>

      {/* Check-in history per goal */}
      {activeGoals.filter((g) => g.checkins.length > 0).map((goal) => {
        const cfg = GOAL_CATEGORY_CONFIG[goal.category]
        const chartData = [...goal.checkins]
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((c) => ({ date: c.date.slice(5), value: c.current_value }))
        return (
          <section key={goal.id}>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
              {cfg.icon} {goal.title}
            </h3>
            <div className="bg-surface border border-border rounded-2xl p-4">
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--border)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--border)" />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [`${v} ${goal.unit}`, goal.metric]}
                  />
                  <ReferenceLine y={goal.target_value} stroke={cfg.color} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="value" stroke={cfg.color} strokeWidth={2} dot={{ r: 3, fill: cfg.color }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )
      })}

      {/* Motivation trend */}
      {(() => {
        const allCheckins = goals.flatMap((g) => g.checkins)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-30)
        if (allCheckins.length < 2) return null
        const data = allCheckins.map((c) => ({ date: c.date.slice(5), motivation: c.motivation_level }))
        return (
          <section>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Motivation Trend</h3>
            <div className="bg-surface border border-border rounded-2xl p-4">
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={data}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--border)" />
                  <YAxis domain={[1, 10]} tick={{ fontSize: 10 }} stroke="var(--border)" />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="motivation" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )
      })()}
    </div>
  )
}

// ─── Main Client ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'goals', label: 'My Goals', icon: Target },
  { id: 'vision', label: 'Vision Board', icon: Eye },
  { id: 'progress', label: 'Progress', icon: BarChart2 },
] as const

type TabId = typeof TABS[number]['id']

export function GoalsClient() {
  const [tab, setTab] = useState<TabId>('goals')
  const [goals, setGoals] = useState<GoalWithAnalysis[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, completed: 0, completedThisYear: 0, totalThisYear: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active')
  const [showWizard, setShowWizard] = useState(false)
  const [checkinGoal, setCheckinGoal] = useState<GoalWithAnalysis | null>(null)
  const [whyStatement, setWhyStatement] = useState('')
  const dailyQuote = getDailyQuote()

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/health-goals')
      if (res.ok) {
        const json = await res.json()
        setGoals(json.goals ?? [])
        setStats(json.stats ?? { total: 0, active: 0, completed: 0, completedThisYear: 0, totalThisYear: 0 })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  async function createGoal(draft: Partial<HealthGoal>) {
    await fetch('/api/health-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'goal', ...draft }),
    })
    await fetchGoals()
  }

  async function submitCheckin(data: Partial<GoalCheckin>) {
    await fetch('/api/health-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'checkin', ...data }),
    })
    await fetchGoals()
  }

  async function handleStatusChange(goalId: string, status: GoalStatus) {
    await fetch('/api/health-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'update_status', goal_id: goalId, status }),
    })
    await fetchGoals()
  }

  const filteredGoals = goals.filter((g) => {
    if (filter === 'active') return g.status === 'active' || g.status === 'paused'
    if (filter === 'completed') return g.status === 'completed' || g.status === 'abandoned'
    return true
  })

  const activeGoals = goals.filter((g) => g.status === 'active')
  const completedGoals = goals.filter((g) => g.status === 'completed')

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-2xl p-1 mb-5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium transition-colors',
              tab === id ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary')}>
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: My Goals ── */}
      {tab === 'goals' && (
        <div className="space-y-4">
          {/* Stats row */}
          {stats.total > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface border border-border rounded-2xl p-3 text-center">
                <p className="text-xl font-bold text-text-primary">{stats.active}</p>
                <p className="text-xs text-text-secondary">Active</p>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-3 text-center">
                <p className="text-xl font-bold text-emerald-400">{stats.completed}</p>
                <p className="text-xs text-text-secondary">Completed</p>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-3 text-center">
                <p className="text-xl font-bold text-primary">
                  {stats.totalThisYear > 0 ? Math.round((stats.completedThisYear / stats.totalThisYear) * 100) : 0}%
                </p>
                <p className="text-xs text-text-secondary">This year</p>
              </div>
            </div>
          )}

          {/* Filter + New Goal */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 flex-1 bg-surface border border-border rounded-xl p-1">
              {(['active', 'completed', 'all'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                    filter === f ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary')}>
                  {f}
                </button>
              ))}
            </div>
            <button onClick={() => setShowWizard(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex-shrink-0">
              <Plus className="w-4 h-4" /> New Goal
            </button>
          </div>

          {/* Goal list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-surface border border-border rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="text-4xl">🎯</div>
              <p className="font-semibold text-text-primary">No goals yet</p>
              <p className="text-sm text-text-secondary">Create your first SMART health goal with the WOOP framework.</p>
              <button onClick={() => setShowWizard(true)}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                Create First Goal
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal}
                  onCheckin={setCheckinGoal}
                  onStatusChange={handleStatusChange} />
              ))}
              {filter === 'completed' && completedGoals.length > 0 && (
                <div className="text-center py-4 text-text-secondary text-sm">
                  🎉 {completedGoals.length} goal{completedGoals.length !== 1 ? 's' : ''} achieved — incredible work!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Vision Board ── */}
      {tab === 'vision' && (
        <div className="space-y-5">
          {/* Daily quote */}
          <div className="bg-gradient-to-br from-primary/10 to-violet-500/10 border border-primary/20 rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-text-primary italic">&ldquo;{dailyQuote.quote}&rdquo;</p>
                <p className="text-xs text-text-secondary mt-1">— {dailyQuote.author}</p>
              </div>
            </div>
          </div>

          {/* Year stat */}
          {stats.totalThisYear > 0 && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
              <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-sm text-text-primary">
                <span className="font-bold text-emerald-400">{stats.completedThisYear} of {stats.totalThisYear}</span>{' '}
                goals completed this year
              </p>
            </div>
          )}

          {/* Your Why */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-text-primary text-sm">Your Why</h3>
            </div>
            <textarea value={whyStatement} onChange={(e) => setWhyStatement(e.target.value)}
              placeholder="Write your personal motivation statement — why does your health matter to you?"
              className="w-full px-4 py-3 bg-surface border border-border rounded-2xl text-text-primary text-sm resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-secondary/50" />
          </div>

          {/* Goal cards masonry */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-surface border border-border rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="text-4xl">🌟</div>
              <p className="font-semibold text-text-primary">Vision board is empty</p>
              <p className="text-sm text-text-secondary">Add goals to populate your vision board.</p>
              <button onClick={() => { setTab('goals'); setShowWizard(true) }}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                Add First Goal
              </button>
            </div>
          ) : (
            <div className="columns-2 gap-3 space-y-3">
              {goals.filter((g) => g.status !== 'abandoned').map((goal) => (
                <div key={goal.id} className="break-inside-avoid mb-3">
                  <VisionCard goal={goal} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Progress ── */}
      {tab === 'progress' && (
        loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <div key={i} className="h-40 bg-surface border border-border rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <ProgressTab goals={goals} />
        )
      )}

      {/* Modals */}
      {showWizard && (
        <GoalWizard onClose={() => setShowWizard(false)} onSave={createGoal} />
      )}
      {checkinGoal && (
        <CheckinModal goal={checkinGoal} onClose={() => setCheckinGoal(null)} onSave={submitCheckin} />
      )}
    </>
  )
}
