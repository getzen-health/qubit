'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  CalendarDays,
  ClipboardList,
  BarChart2,
  Settings,
  ChevronDown,
  ChevronUp,
  Info,
  FlaskConical,
} from 'lucide-react'
import {
  CycleLog,
  CycleSettings,
  CyclePhase,
  CYCLE_PHASE_INFO,
  SYMPTOM_CATEGORIES,
  SYMPTOM_LABELS,
  NATURAL_REMEDIES,
  PMDD_QUESTIONS,
  PERIMENOPAUSE_SYMPTOMS,
  FLOW_LABELS,
  CERVICAL_MUCUS_LABELS,
  getCyclePhase,
  getFertileWindow,
  analyzeCycleRegularity,
  analyzeSymptomPatterns,
  estimateCycleDay,
  scorePMDD,
} from '@/lib/womens-health'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  initialLogs: CycleLog[]
  initialSettings: CycleSettings
}

type Tab = 'cycle' | 'log' | 'insights' | 'settings'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function fmtDateFull(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const PHASE_COLORS: Record<CyclePhase, string> = {
  menstrual: 'bg-red-400/20 text-red-400 border-red-400/30',
  follicular: 'bg-green-400/20 text-green-400 border-green-400/30',
  ovulation: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
  luteal: 'bg-purple-400/20 text-purple-400 border-purple-400/30',
}

const PHASE_DOT: Record<CyclePhase, string> = {
  menstrual: 'bg-red-400',
  follicular: 'bg-green-400',
  ovulation: 'bg-yellow-400',
  luteal: 'bg-purple-400',
}

// ─── Phase Indicator Card ─────────────────────────────────────────────────────

function PhaseCard({
  settings,
}: {
  settings: CycleSettings
}) {
  if (!settings.last_period_start) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-5 text-center space-y-2">
        <p className="text-4xl">🌸</p>
        <p className="text-sm text-text-secondary">
          Set your last period start date in <strong>Settings</strong> to see your cycle phase.
        </p>
      </div>
    )
  }

  const cycleDay = estimateCycleDay(settings.last_period_start)
  const phaseResult = getCyclePhase(cycleDay, settings.avg_cycle_length)
  const phaseInfo = CYCLE_PHASE_INFO[phaseResult.phase]
  const fertile = getFertileWindow(settings.last_period_start, settings.avg_cycle_length)

  const nextPeriod = new Date(settings.last_period_start)
  nextPeriod.setDate(nextPeriod.getDate() + settings.avg_cycle_length)
  const daysToNextPeriod = Math.max(
    0,
    Math.round((nextPeriod.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
  )

  return (
    <div className="space-y-3">
      {/* Phase banner */}
      <div
        className={cn(
          'rounded-2xl border p-5',
          PHASE_COLORS[phaseResult.phase]
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-2xl mr-2">{phaseInfo.emoji}</span>
            <span className="text-lg font-bold capitalize">{phaseResult.phase} Phase</span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">Day {cycleDay}</p>
            <p className="text-xs opacity-70">of {settings.avg_cycle_length}</p>
          </div>
        </div>
        <p className="text-sm opacity-80 leading-relaxed">{phaseResult.description}</p>
      </div>

      {/* Hormone & lifestyle grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Hormones', value: phaseInfo.hormones, icon: '⚗️' },
          { label: 'Energy', value: phaseInfo.energy, icon: '⚡' },
          { label: 'Mood', value: phaseInfo.mood, icon: '🧠' },
          { label: 'Exercise', value: phaseInfo.exercise_recommendation, icon: '🏃' },
          { label: 'Nutrition', value: phaseInfo.nutrition_tip, icon: '🥦' },
          { label: 'Skin', value: phaseInfo.skin_expectation, icon: '✨' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-3">
            <p className="text-xs text-text-secondary mb-1">
              {icon} {label}
            </p>
            <p className="text-xs text-text-primary leading-snug">{value}</p>
          </div>
        ))}
      </div>

      {/* Fertile window + next period */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface rounded-xl border border-border p-3">
          <p className="text-xs text-text-secondary mb-1">🥚 Fertile Window</p>
          {fertile.daysUntilOvulation > 0 ? (
            <>
              <p className="text-sm font-semibold text-text-primary">
                In {fertile.daysUntilOvulation} days
              </p>
              <p className="text-xs text-text-secondary">
                {fmtDate(fertile.fertileStart)} – {fmtDate(fertile.fertileEnd)}
              </p>
            </>
          ) : fertile.daysUntilOvulation === 0 ? (
            <p className="text-sm font-semibold text-yellow-400">Today — peak fertility</p>
          ) : (
            <p className="text-xs text-text-secondary">
              Passed {fmtDate(fertile.ovulationDate)}
            </p>
          )}
        </div>
        <div className="bg-surface rounded-xl border border-border p-3">
          <p className="text-xs text-text-secondary mb-1">📅 Next Period</p>
          <p className="text-sm font-semibold text-text-primary">In {daysToNextPeriod} days</p>
          <p className="text-xs text-text-secondary">{fmtDate(nextPeriod.toISOString().slice(0, 10))}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Calendar Heatmap ─────────────────────────────────────────────────────────

function CalendarHeatmap({
  logs,
  settings,
}: {
  logs: CycleLog[]
  settings: CycleSettings
}) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  const logMap: Record<string, CycleLog> = {}
  for (const log of logs) {
    logMap[log.date] = log
  }

  function getDayColor(dayIso: string): string {
    const log = logMap[dayIso]
    if (!log) return 'bg-surface'
    if (log.period_started || (log.flow_level && log.flow_level > 0)) return 'bg-red-400/70'
    if (!settings.last_period_start) return 'bg-surface'
    const dayNum = estimateCycleDay(settings.last_period_start)
    // approximate fertile window colouring
    const fertile = getFertileWindow(settings.last_period_start, settings.avg_cycle_length)
    if (dayIso >= fertile.fertileStart && dayIso <= fertile.fertileEnd) return 'bg-yellow-400/60'
    const phase = getCyclePhase(dayNum, settings.avg_cycle_length).phase
    if (phase === 'follicular') return 'bg-green-400/40'
    if (phase === 'luteal') return 'bg-purple-400/40'
    return 'bg-surface'
  }

  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <p className="text-sm font-semibold text-text-primary mb-3">{monthName}</p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-[10px] text-text-secondary font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = day === today.getDate()
          return (
            <div
              key={day}
              className={cn(
                'aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium transition-colors',
                getDayColor(dayStr),
                isToday && 'ring-2 ring-accent ring-offset-1 ring-offset-background'
              )}
            >
              {day}
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {[
          { color: 'bg-red-400/70', label: 'Period' },
          { color: 'bg-yellow-400/60', label: 'Fertile' },
          { color: 'bg-green-400/40', label: 'Follicular' },
          { color: 'bg-purple-400/40', label: 'Luteal' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={cn('w-3 h-3 rounded', color)} />
            <span className="text-[10px] text-text-secondary">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Daily Log Form ───────────────────────────────────────────────────────────

function LogForm({ onSaved }: { onSaved: (log: CycleLog) => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [periodStarted, setPeriodStarted] = useState(false)
  const [periodEnded, setPeriodEnded] = useState(false)
  const [flowLevel, setFlowLevel] = useState<number | null>(null)
  const [bbt, setBbt] = useState('')
  const [cm, setCm] = useState<string>('')
  const [symptoms, setSymptoms] = useState<Record<string, number>>({})
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const allSymptoms = [
    ...SYMPTOM_CATEGORIES.physical,
    ...SYMPTOM_CATEGORIES.emotional,
    ...SYMPTOM_CATEGORIES.other,
  ]

  function toggleSymptom(s: string) {
    setSymptoms((prev) => {
      if (prev[s]) {
        const next = { ...prev }
        delete next[s]
        return next
      }
      return { ...prev, [s]: 2 }
    })
  }

  function setSeverity(s: string, v: number) {
    setSymptoms((prev) => ({ ...prev, [s]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/womens-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'log',
          date,
          period_started: periodStarted,
          period_ended: periodEnded,
          flow_level: flowLevel,
          bbt_celsius: bbt ? parseFloat(bbt) : null,
          cervical_mucus: cm || null,
          symptoms,
          mood,
          energy,
          notes: notes || null,
        }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        onSaved(json.data)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date */}
      <div>
        <label className="block text-xs text-text-secondary mb-1">Date</label>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      {/* Period toggles */}
      <div className="flex gap-3">
        {[
          { label: '🩸 Period started', val: periodStarted, set: setPeriodStarted },
          { label: '✅ Period ended', val: periodEnded, set: setPeriodEnded },
        ].map(({ label, val, set }) => (
          <button
            key={label}
            type="button"
            onClick={() => set(!val)}
            className={cn(
              'flex-1 py-2 rounded-xl border text-xs font-medium transition-colors',
              val
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'bg-surface border-border text-text-secondary'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Flow level */}
      <div>
        <label className="block text-xs text-text-secondary mb-2">Flow level</label>
        <div className="flex gap-2">
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFlowLevel(flowLevel === level ? null : level)}
              className={cn(
                'flex-1 py-2 rounded-xl border text-xs font-medium transition-colors',
                flowLevel === level
                  ? 'bg-red-400/20 border-red-400/40 text-red-400'
                  : 'bg-surface border-border text-text-secondary'
              )}
            >
              {FLOW_LABELS[level]}
            </button>
          ))}
        </div>
      </div>

      {/* BBT */}
      <div>
        <label className="block text-xs text-text-secondary mb-1">
          BBT (°C) — take before rising, same time daily
        </label>
        <input
          type="number"
          step="0.01"
          min="35"
          max="38.5"
          value={bbt}
          onChange={(e) => setBbt(e.target.value)}
          placeholder="e.g. 36.45"
          className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      {/* Cervical mucus */}
      <div>
        <label className="block text-xs text-text-secondary mb-2">Cervical mucus</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CERVICAL_MUCUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCm(cm === key ? '' : key)}
              className={cn(
                'px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors',
                cm === key
                  ? 'bg-yellow-400/20 border-yellow-400/40 text-yellow-400'
                  : 'bg-surface border-border text-text-secondary'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Symptoms */}
      <div>
        <label className="block text-xs text-text-secondary mb-2">Symptoms</label>
        <div className="flex flex-wrap gap-2">
          {allSymptoms.map((s) => {
            const active = s in symptoms
            return (
              <div key={s} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleSymptom(s)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors',
                    active
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'bg-surface border-border text-text-secondary'
                  )}
                >
                  {SYMPTOM_LABELS[s] ?? s}
                </button>
                {active && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setSeverity(s, v)}
                        className={cn(
                          'w-4 h-4 rounded-full border text-[9px] font-bold transition-colors',
                          symptoms[s] >= v
                            ? 'bg-accent border-accent text-background'
                            : 'bg-surface border-border text-text-secondary'
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mood & Energy sliders */}
      {[
        { label: '😊 Mood', val: mood, set: setMood, emoji: ['😣', '😕', '😐', '🙂', '😄'] },
        { label: '⚡ Energy', val: energy, set: setEnergy, emoji: ['🪫', '😴', '😐', '💪', '🚀'] },
      ].map(({ label, val, set, emoji }) => (
        <div key={label}>
          <label className="block text-xs text-text-secondary mb-2">
            {label} {val !== null ? `— ${emoji[val - 1]}` : ''}
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => set(val === v ? null : v)}
                className={cn(
                  'flex-1 py-2 rounded-xl border text-base transition-colors',
                  val === v
                    ? 'bg-accent/10 border-accent/30'
                    : 'bg-surface border-border'
                )}
              >
                {emoji[v - 1]}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Notes */}
      <div>
        <label className="block text-xs text-text-secondary mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Anything else to note today..."
          className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-sm transition-colors',
          saving
            ? 'bg-surface text-text-secondary'
            : saved
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-accent text-background hover:opacity-90'
        )}
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Today\'s Log'}
      </button>
    </form>
  )
}

// ─── PMDD Screener ────────────────────────────────────────────────────────────

function PMDDScreener() {
  const [selected, setSelected] = useState<string[]>([])
  const [impairs, setImpairs] = useState<boolean | null>(null)
  const [result, setResult] = useState<ReturnType<typeof scorePMDD> | null>(null)
  const [open, setOpen] = useState(false)

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function assess() {
    if (impairs === null) return
    setResult(scorePMDD(selected, impairs))
  }

  const SCORE_COLORS: Record<string, string> = {
    no_pms: 'text-green-400',
    pms: 'text-yellow-400',
    possible_pmdd: 'text-orange-400',
    likely_pmdd: 'text-red-400',
  }

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-text-secondary" />
          <span className="text-sm font-semibold text-text-primary">PMS / PMDD Screener</span>
          <span className="text-[10px] bg-surface-secondary text-text-secondary px-2 py-0.5 rounded-full">DSM-5</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-text-secondary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-secondary" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            Rate symptoms you experience in the week <strong>before</strong> your period that
            resolve within a few days of onset. Based on DSM-5 PMDD criteria (Yonkers 2008
            Lancet).
          </p>

          <div className="space-y-2">
            {PMDD_QUESTIONS.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => toggle(q.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-colors leading-snug',
                  selected.includes(q.id)
                    ? 'bg-accent/10 border-accent/30 text-text-primary'
                    : 'bg-background border-border text-text-secondary'
                )}
              >
                <span
                  className={cn(
                    'inline-block w-3 h-3 rounded-sm border mr-2 align-middle',
                    selected.includes(q.id) ? 'bg-accent border-accent' : 'border-border'
                  )}
                />
                {q.text}
                {q.category === 'core' && (
                  <span className="ml-1 text-[9px] text-accent opacity-70">(core)</span>
                )}
              </button>
            ))}
          </div>

          <div>
            <p className="text-xs text-text-secondary mb-2">
              Do these symptoms impair work, relationships, or daily functioning?
            </p>
            <div className="flex gap-2">
              {[
                { val: true, label: 'Yes' },
                { val: false, label: 'No' },
              ].map(({ val, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setImpairs(val)}
                  className={cn(
                    'flex-1 py-2 rounded-xl border text-xs font-medium transition-colors',
                    impairs === val
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'bg-background border-border text-text-secondary'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={assess}
            disabled={impairs === null}
            className="w-full py-2.5 rounded-xl bg-accent text-background text-sm font-semibold disabled:opacity-40"
          >
            Assess
          </button>

          {result && (
            <div
              className={cn(
                'rounded-xl border p-3 space-y-1',
                result.score === 'likely_pmdd'
                  ? 'bg-red-400/10 border-red-400/30'
                  : result.score === 'possible_pmdd'
                  ? 'bg-orange-400/10 border-orange-400/30'
                  : result.score === 'pms'
                  ? 'bg-yellow-400/10 border-yellow-400/30'
                  : 'bg-green-400/10 border-green-400/30'
              )}
            >
              <p className={cn('text-sm font-bold', SCORE_COLORS[result.score])}>
                {result.label}
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {result.description}
              </p>
              <p className="text-[10px] text-text-secondary opacity-60 mt-1">
                This screener is informational only. Consult a healthcare provider for diagnosis.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Symptom Heatmap (simplified grid) ───────────────────────────────────────

function SymptomHeatmap({ logs, cycleLength }: { logs: CycleLog[]; cycleLength: number }) {
  const patterns = analyzeSymptomPatterns(logs, cycleLength)
  const allSymptoms = Array.from(
    new Set(patterns.heatmapData.map((d) => d.symptom))
  ).slice(0, 10)

  if (allSymptoms.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-5 text-center">
        <p className="text-2xl mb-2">📋</p>
        <p className="text-sm text-text-secondary">
          Log symptoms for a few cycles to see patterns here.
        </p>
      </div>
    )
  }

  function getSeverity(symptom: string, day: number): number {
    const match = patterns.heatmapData.find((d) => d.symptom === symptom && d.day === day)
    return match ? match.severity : 0
  }

  function severityColor(s: number): string {
    if (s === 0) return 'bg-surface'
    if (s < 2) return 'bg-accent/20'
    if (s < 3) return 'bg-accent/40'
    if (s < 4) return 'bg-accent/60'
    return 'bg-accent/80'
  }

  const days = Array.from({ length: cycleLength }, (_, i) => i + 1)

  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <p className="text-sm font-semibold text-text-primary mb-3">Symptom × Cycle Day</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr>
              <th className="text-left text-text-secondary pr-2 font-normal w-24">Symptom</th>
              {days.map((d) => (
                <th key={d} className="text-center text-text-secondary font-normal px-px">
                  {d % 7 === 0 || d === 1 ? d : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allSymptoms.map((symptom) => (
              <tr key={symptom}>
                <td className="text-text-secondary pr-2 py-0.5 truncate max-w-[6rem]">
                  {SYMPTOM_LABELS[symptom] ?? symptom}
                </td>
                {days.map((d) => (
                  <td key={d} className="px-px py-0.5">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-sm mx-auto',
                        severityColor(getSeverity(symptom, d))
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] text-text-secondary">Intensity:</span>
        {['None', 'Low', 'Mid', 'High', 'Peak'].map((l, i) => (
          <div key={l} className="flex items-center gap-0.5">
            <div className={cn('w-3 h-3 rounded-sm', severityColor(i))} />
            <span className="text-[9px] text-text-secondary">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Natural Remedies Panel ───────────────────────────────────────────────────

function RemediesPanel({ currentPhase }: { currentPhase: CyclePhase | null }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  // Show all remedies; flag ones relevant to current phase symptoms
  const phaseSymptoms: Record<CyclePhase, string[]> = {
    menstrual: ['cramping', 'back_pain', 'headache', 'fatigue', 'bloating'],
    follicular: [],
    ovulation: [],
    luteal: ['mood_swings', 'anxiety', 'bloating', 'breast_tenderness', 'depression'],
  }
  const relevantSymptoms = currentPhase ? phaseSymptoms[currentPhase] : []

  const sorted = [...NATURAL_REMEDIES].sort((a, b) => {
    const aRelevant = relevantSymptoms.includes(a.symptom) ? 0 : 1
    const bRelevant = relevantSymptoms.includes(b.symptom) ? 0 : 1
    return aRelevant - bRelevant
  })

  const GRADE_COLORS: Record<string, string> = {
    A: 'bg-green-400/20 text-green-400',
    B: 'bg-yellow-400/20 text-yellow-400',
    C: 'bg-orange-400/20 text-orange-400',
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-text-secondary" />
        <p className="text-xs text-text-secondary">
          Evidence grades: A = strong RCT evidence · B = moderate · C = limited
        </p>
      </div>
      {sorted.map((r) => {
        const isRelevant = relevantSymptoms.includes(r.symptom)
        const key = `${r.symptom}-${r.remedy}`
        return (
          <div
            key={key}
            className={cn(
              'bg-surface rounded-xl border transition-colors',
              isRelevant ? 'border-accent/30' : 'border-border'
            )}
          >
            <button
              className="w-full flex items-center justify-between p-3"
              onClick={() => setExpanded(expanded === key ? null : key)}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isRelevant && (
                  <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full shrink-0">
                    Now
                  </span>
                )}
                <span className="text-xs font-medium text-text-primary truncate">{r.remedy}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    GRADE_COLORS[r.evidence_grade]
                  )}
                >
                  {r.evidence_grade}
                </span>
                {expanded === key ? (
                  <ChevronUp className="w-3 h-3 text-text-secondary" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-text-secondary" />
                )}
              </div>
            </button>
            {expanded === key && (
              <div className="px-3 pb-3 space-y-1.5 text-xs text-text-secondary border-t border-border pt-2">
                <p>
                  <strong className="text-text-primary">For:</strong>{' '}
                  {SYMPTOM_LABELS[r.symptom] ?? r.symptom}
                </p>
                <p>
                  <strong className="text-text-primary">Dose:</strong> {r.dose}
                </p>
                <p className="leading-relaxed opacity-70">{r.citations}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Perimenopause Info ───────────────────────────────────────────────────────

function PerimenopauseSection() {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4"
      >
        <span className="text-sm font-semibold text-text-primary">
          🌿 Perimenopause & Menopause Guide
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-text-secondary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-secondary" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-text-secondary">
            Based on STRAW+10 staging (Harlow 2012). Perimenopause typically begins in mid-40s.
          </p>
          {PERIMENOPAUSE_SYMPTOMS.map((s) => (
            <div key={s.symptom} className="bg-background rounded-xl border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-text-primary">{s.symptom}</p>
                <span className="text-[10px] bg-surface text-text-secondary px-2 py-0.5 rounded-full border border-border">
                  {s.straw_stage}
                </span>
              </div>
              <p className="text-xs text-text-secondary mb-1">{s.description}</p>
              <p className="text-[11px] text-accent">💡 {s.management}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Settings Form ────────────────────────────────────────────────────────────

function SettingsForm({
  settings,
  onSaved,
}: {
  settings: CycleSettings
  onSaved: (s: CycleSettings) => void
}) {
  const [cycleLength, setCycleLength] = useState(settings.avg_cycle_length)
  const [periodLength, setPeriodLength] = useState(settings.avg_period_length)
  const [lastPeriod, setLastPeriod] = useState(settings.last_period_start ?? '')
  const [goal, setGoal] = useState<'health' | 'pregnancy' | 'avoid'>(settings.tracking_goal)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/womens-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'settings',
          avg_cycle_length: cycleLength,
          avg_period_length: periodLength,
          last_period_start: lastPeriod || null,
          tracking_goal: goal,
        }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        onSaved(json.data)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const GOALS = [
    { val: 'health', label: '💜 General health', desc: 'Monitor patterns and hormonal health' },
    { val: 'pregnancy', label: '🤰 Trying to conceive', desc: 'Optimise fertile window timing' },
    { val: 'avoid', label: '🚫 Avoid pregnancy', desc: 'FAM — track fertile days to avoid' },
  ] as const

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Last period start */}
      <div>
        <label className="block text-xs text-text-secondary mb-1">Last period start date</label>
        <input
          type="date"
          value={lastPeriod}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setLastPeriod(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      {/* Cycle length */}
      <div>
        <label className="block text-xs text-text-secondary mb-1">
          Average cycle length: <strong className="text-text-primary">{cycleLength} days</strong>
          <span className="ml-2 text-[10px] opacity-60">
            {cycleLength < 21 ? '⚠️ Shorter than typical range' : cycleLength > 35 ? '⚠️ Longer than typical range' : '✓ Normal range (21–35)'}
          </span>
        </label>
        <input
          type="range"
          min={14}
          max={50}
          value={cycleLength}
          onChange={(e) => setCycleLength(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
        />
        <div className="flex justify-between text-[10px] text-text-secondary mt-0.5">
          <span>14</span>
          <span>28</span>
          <span>50</span>
        </div>
      </div>

      {/* Period length */}
      <div>
        <label className="block text-xs text-text-secondary mb-1">
          Average period length: <strong className="text-text-primary">{periodLength} days</strong>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={periodLength}
          onChange={(e) => setPeriodLength(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
        />
        <div className="flex justify-between text-[10px] text-text-secondary mt-0.5">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      {/* Tracking goal */}
      <div>
        <label className="block text-xs text-text-secondary mb-2">Tracking goal</label>
        <div className="space-y-2">
          {GOALS.map(({ val, label, desc }) => (
            <button
              key={val}
              type="button"
              onClick={() => setGoal(val)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-xl border transition-colors',
                goal === val
                  ? 'bg-accent/10 border-accent/30'
                  : 'bg-surface border-border'
              )}
            >
              <p className="text-xs font-medium text-text-primary">{label}</p>
              <p className="text-[11px] text-text-secondary">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-sm transition-colors',
          saving
            ? 'bg-surface text-text-secondary'
            : saved
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-accent text-background hover:opacity-90'
        )}
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Settings'}
      </button>

      <div className="bg-surface rounded-xl border border-border p-3">
        <p className="text-xs text-text-secondary leading-relaxed">
          <strong className="text-text-primary">Privacy:</strong> All cycle data is stored in
          your private Supabase account and never shared. Row-level security ensures only you can
          access your logs.
        </p>
      </div>
    </form>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function WomensHealthClient({
  initialLogs,
  initialSettings,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('cycle')
  const [logs, setLogs] = useState<CycleLog[]>(initialLogs)
  const [settings, setSettings] = useState<CycleSettings>(initialSettings)

  const handleLogSaved = useCallback((log: CycleLog) => {
    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.date === log.date)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = log
        return next
      }
      return [log, ...prev]
    })
  }, [])

  const handleSettingsSaved = useCallback((s: CycleSettings) => {
    setSettings(s)
  }, [])

  const currentPhase: CyclePhase | null = settings.last_period_start
    ? getCyclePhase(
        estimateCycleDay(settings.last_period_start),
        settings.avg_cycle_length
      ).phase
    : null

  // Derive cycle lengths from logs that have period_started = true
  const periodStarts = logs
    .filter((l) => l.period_started)
    .map((l) => l.date)
    .sort()

  const cycleLengths: number[] = []
  for (let i = 1; i < periodStarts.length; i++) {
    const a = new Date(periodStarts[i - 1])
    const b = new Date(periodStarts[i])
    const diff = Math.round((b.getTime() - a.getTime()) / 86400000)
    if (diff >= 14 && diff <= 60) cycleLengths.push(diff)
  }
  const regularity = analyzeCycleRegularity(cycleLengths)

  const TABS = [
    { id: 'cycle' as Tab, label: 'Cycle', icon: CalendarDays },
    { id: 'log' as Tab, label: 'Log', icon: ClipboardList },
    { id: 'insights' as Tab, label: 'Insights', icon: BarChart2 },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="grid grid-cols-4 gap-1 bg-surface rounded-2xl p-1 border border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-colors',
              activeTab === id
                ? 'bg-background text-text-primary shadow-sm border border-border'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Cycle Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'cycle' && (
        <div className="space-y-4">
          <PhaseCard settings={settings} />
          <CalendarHeatmap logs={logs} settings={settings} />

          {/* Regularity summary */}
          {cycleLengths.length > 0 && (
            <div
              className={cn(
                'rounded-2xl border p-4',
                regularity.isRegular
                  ? 'bg-green-400/10 border-green-400/30'
                  : 'bg-yellow-400/10 border-yellow-400/30'
              )}
            >
              <p className="text-sm font-semibold text-text-primary mb-1">
                {regularity.isRegular ? '✓ Regular cycles' : '⚠️ Cycle variability detected'}
              </p>
              <p className="text-xs text-text-secondary mb-2">{regularity.notes}</p>
              <div className="flex gap-4 text-xs">
                <div>
                  <span className="text-text-secondary">Avg length: </span>
                  <strong className="text-text-primary">{regularity.avgLength} days</strong>
                </div>
                <div>
                  <span className="text-text-secondary">Std dev: </span>
                  <strong className="text-text-primary">±{regularity.stdDev} days</strong>
                </div>
              </div>
            </div>
          )}

          {/* Quick log prompt */}
          <div className="bg-surface rounded-2xl border border-border p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">Log today</p>
              <p className="text-xs text-text-secondary">Track your symptoms and mood</p>
            </div>
            <button
              onClick={() => setActiveTab('log')}
              className="px-4 py-2 rounded-xl bg-accent text-background text-xs font-semibold"
            >
              + Log
            </button>
          </div>
        </div>
      )}

      {/* ── Log Tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'log' && (
        <LogForm onSaved={handleLogSaved} />
      )}

      {/* ── Insights Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {/* Cycle length bar chart (simple) */}
          {cycleLengths.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold text-text-primary mb-3">Cycle Length History</p>
              <div className="flex items-end gap-1 h-20">
                {cycleLengths.slice(-12).map((len, i) => {
                  const pct = Math.min(100, (len / 45) * 100)
                  const isNormal = len >= 21 && len <= 35
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-0.5"
                    >
                      <div
                        className={cn(
                          'w-full rounded-t-sm',
                          isNormal ? 'bg-accent/60' : 'bg-orange-400/60'
                        )}
                        style={{ height: `${pct}%` }}
                      />
                      <span className="text-[9px] text-text-secondary">{len}</span>
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-text-secondary mt-1">Days (last {Math.min(12, cycleLengths.length)} cycles)</p>
            </div>
          )}

          {/* Symptom heatmap */}
          <SymptomHeatmap logs={logs} cycleLength={settings.avg_cycle_length} />

          {/* PMDD Screener */}
          <PMDDScreener />

          {/* Natural remedies */}
          <div>
            <p className="text-sm font-semibold text-text-primary mb-2">
              Evidence-Based Remedies
              {currentPhase && (
                <span className="text-xs font-normal text-text-secondary ml-2">
                  — {currentPhase} phase highlights shown
                </span>
              )}
            </p>
            <RemediesPanel currentPhase={currentPhase} />
          </div>

          {/* Perimenopause guide */}
          <PerimenopauseSection />
        </div>
      )}

      {/* ── Settings Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <SettingsForm settings={settings} onSaved={handleSettingsSaved} />
      )}
    </div>
  )
}
