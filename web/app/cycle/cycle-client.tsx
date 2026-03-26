'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Save,
  Droplets,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
  FlowerIcon,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MenstrualCycle {
  id: string
  start_date: string
  end_date?: string | null
  cycle_length?: number | null
  computed_cycle_length?: number | null
  flow_intensity?: 'light' | 'moderate' | 'heavy' | null
  symptoms: string[]
  notes?: string | null
  created_at?: string
}

type FlowIntensity = 'light' | 'moderate' | 'heavy'
type DayType = 'menstrual' | 'ovulation' | 'fertile' | 'luteal' | 'follicular'

// ─── Constants ────────────────────────────────────────────────────────────────

const STANDARD_SYMPTOMS = [
  { id: 'cramps', label: 'Cramps', emoji: '😣' },
  { id: 'mood_changes', label: 'Mood changes', emoji: '😤' },
  { id: 'energy_low', label: 'Low energy', emoji: '😴' },
  { id: 'bloating', label: 'Bloating', emoji: '🫃' },
  { id: 'headache', label: 'Headache', emoji: '🤕' },
] as const

const FLOW_OPTIONS: { value: FlowIntensity; label: string; color: string }[] = [
  { value: 'light', label: 'Light', color: 'text-rose-300' },
  { value: 'moderate', label: 'Moderate', color: 'text-rose-500' },
  { value: 'heavy', label: 'Heavy', color: 'text-rose-700' },
]

const DAY_COLORS: Record<DayType, string> = {
  menstrual: 'bg-rose-500 text-white',
  ovulation: 'bg-pink-400 text-white',
  fertile: 'bg-orange-400 text-white',
  luteal: 'bg-violet-400/30 text-violet-300',
  follicular: 'bg-purple-400/20 text-purple-300',
}

const PHASE_META: Record<
  string,
  { label: string; color: string; bgColor: string; description: string }
> = {
  menstrual: {
    label: 'Menstrual',
    color: '#f43f5e',
    bgColor: 'bg-rose-500/10',
    description: 'Rest & gentle movement. Low energy is normal.',
  },
  follicular: {
    label: 'Follicular',
    color: '#a855f7',
    bgColor: 'bg-purple-500/10',
    description: 'Rising energy & strength. Great for new challenges.',
  },
  ovulation: {
    label: 'Ovulation',
    color: '#ec4899',
    bgColor: 'bg-pink-500/10',
    description: "Peak energy window. You're at your best.",
  },
  luteal: {
    label: 'Luteal',
    color: '#8b5cf6',
    bgColor: 'bg-violet-500/10',
    description: 'Slowing down is natural. Favor steady, calm activities.',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function fmtShortDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function computePhase(dayOfCycle: number): string {
  if (dayOfCycle <= 5) return 'menstrual'
  if (dayOfCycle <= 13) return 'follicular'
  if (dayOfCycle <= 16) return 'ovulation'
  return 'luteal'
}

/** Build a map from date string → DayType for all known cycles */
function buildDayMap(cycles: MenstrualCycle[], avgLength: number): Map<string, DayType> {
  const map = new Map<string, DayType>()
  for (const cycle of cycles) {
    const startMs = new Date(cycle.start_date).getTime()
    // Period end: use end_date if present, else assume ~5 days
    const periodEndMs = cycle.end_date
      ? new Date(cycle.end_date).getTime()
      : startMs + 4 * MS_PER_DAY

    // Mark menstrual days
    for (let ms = startMs; ms <= periodEndMs; ms += MS_PER_DAY) {
      const key = new Date(ms).toISOString().slice(0, 10)
      map.set(key, 'menstrual')
    }

    // Mark follicular (days 6–11 from start, i.e. offsets 5–10)
    for (let offset = 5; offset <= 10; offset++) {
      const key = addDays(cycle.start_date, offset)
      if (!map.has(key)) map.set(key, 'follicular')
    }

    // Mark fertile window (days 12–13, 15–16)
    for (const offset of [11, 12, 14, 15]) {
      const key = addDays(cycle.start_date, offset)
      if (!map.has(key)) map.set(key, 'fertile')
    }

    // Ovulation day (day 14 = offset 13)
    const ovKey = addDays(cycle.start_date, 13)
    map.set(ovKey, 'ovulation')

    // Luteal (days 17 to cycle end, offsets 16 to avgLength-2)
    for (let offset = 16; offset < avgLength - 1; offset++) {
      const key = addDays(cycle.start_date, offset)
      if (!map.has(key)) map.set(key, 'luteal')
    }
  }
  return map
}

// ─── Log Period Modal ─────────────────────────────────────────────────────────

interface LogPeriodModalProps {
  onClose: () => void
  onSaved: () => void
  initialSymptoms?: string[]
  initialStartDate?: string
}

function LogPeriodModal({
  onClose,
  onSaved,
  initialSymptoms = [],
  initialStartDate,
}: LogPeriodModalProps) {
  const [startDate, setStartDate] = useState(initialStartDate ?? todayStr())
  const [endDate, setEndDate] = useState('')
  const [flowIntensity, setFlowIntensity] = useState<FlowIntensity | ''>('')
  const [symptoms, setSymptoms] = useState<string[]>(initialSymptoms)
  const [customSymptom, setCustomSymptom] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleSymptom = (id: string) => {
    setSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  const addCustomSymptom = () => {
    const trimmed = customSymptom.trim().toLowerCase().replace(/\s+/g, '_')
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms((prev) => [...prev, trimmed])
      setCustomSymptom('')
    }
  }

  const handleSave = async () => {
    if (!startDate) {
      setError('Start date is required')
      return
    }
    if (endDate && endDate < startDate) {
      setError('End date must be on or after start date')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate || null,
          flow_intensity: flowIntensity || null,
          symptoms,
          notes: notes.trim() || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Request failed (${res.status})`)
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-border sticky top-0 bg-surface rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-text-primary">Log Period</h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 hover:bg-surface-secondary rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={todayStr()}
                className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={todayStr()}
                className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>
          </div>

          {/* Flow intensity */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-2">
              Flow Intensity
            </label>
            <div className="flex gap-2">
              {FLOW_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setFlowIntensity((prev) => (prev === opt.value ? '' : opt.value))
                  }
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    flowIntensity === opt.value
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                      : 'border-border text-text-secondary hover:bg-surface-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-2">
              Symptoms
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STANDARD_SYMPTOMS.map((s) => {
                const active = symptoms.includes(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSymptom(s.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border ${
                      active
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                        : 'border-border text-text-secondary hover:bg-surface-secondary'
                    }`}
                  >
                    <span>{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Custom symptoms */}
            {symptoms
              .filter((s) => !STANDARD_SYMPTOMS.find((std) => std.id === s))
              .map((sym) => (
                <div
                  key={sym}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 mt-2 text-sm text-rose-400"
                >
                  <span>{sym.replace(/_/g, ' ')}</span>
                  <button
                    onClick={() => setSymptoms((prev) => prev.filter((s) => s !== sym))}
                    className="hover:text-rose-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomSymptom()}
                placeholder="Add custom symptom…"
                className="flex-1 bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
              <button
                onClick={addCustomSymptom}
                disabled={!customSymptom.trim()}
                className="px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-text-secondary hover:bg-rose-500/10 hover:text-rose-400 transition-colors disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you feeling?"
              rows={3}
              maxLength={500}
              className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-rose-500/40 resize-none"
            />
            <p className="text-xs text-text-secondary text-right mt-0.5">{notes.length}/500</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-5 pt-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !startDate}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving…' : 'Log Period'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Cycle Prediction Card ────────────────────────────────────────────────────

interface PredictionCardProps {
  cycles: MenstrualCycle[]
  avgCycleLength: number
  onLogPeriod: () => void
}

function CyclePredictionCard({ cycles, avgCycleLength, onLogPeriod }: PredictionCardProps) {
  const today = todayStr()
  const latest = cycles[0]

  if (!latest) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlowerIcon className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-semibold text-text-primary">Cycle Overview</h2>
          </div>
          <button
            onClick={onLogPeriod}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Period
          </button>
        </div>
        <p className="text-sm text-text-secondary">Log your first period to see cycle predictions.</p>
      </div>
    )
  }

  const startMs = new Date(latest.start_date).getTime()
  const todayMs = new Date(today).getTime()
  const dayOfCycle = Math.max(1, Math.floor((todayMs - startMs) / MS_PER_DAY) + 1)
  const phase = computePhase(dayOfCycle)
  const phaseMeta = PHASE_META[phase]
  const nextPeriodDate = addDays(latest.start_date, avgCycleLength)
  const daysUntilNext = Math.round(
    (new Date(nextPeriodDate).getTime() - todayMs) / MS_PER_DAY,
  )

  return (
    <div
      className="rounded-2xl border p-5 space-y-4"
      style={{ borderColor: phaseMeta.color, background: phaseMeta.color + '10' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-0.5">
            Current Phase
          </p>
          <p className="text-2xl font-black" style={{ color: phaseMeta.color }}>
            {phaseMeta.label}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">{phaseMeta.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-text-secondary">Day of cycle</p>
          <p className="text-4xl font-black leading-tight" style={{ color: phaseMeta.color }}>
            {dayOfCycle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-background/40 rounded-xl p-3 text-center">
          <p className="text-xs text-text-secondary mb-0.5">Next Period</p>
          <p className="text-sm font-bold text-text-primary">
            {daysUntilNext > 0
              ? `in ${daysUntilNext}d`
              : daysUntilNext === 0
                ? 'Today'
                : `${Math.abs(daysUntilNext)}d ago`}
          </p>
          <p className="text-xs text-text-secondary opacity-70">{fmtShortDate(nextPeriodDate)}</p>
        </div>
        <div className="bg-background/40 rounded-xl p-3 text-center">
          <p className="text-xs text-text-secondary mb-0.5">Avg Length</p>
          <p className="text-sm font-bold text-text-primary">{avgCycleLength} days</p>
          <p className="text-xs text-text-secondary opacity-70">per cycle</p>
        </div>
        <div className="bg-background/40 rounded-xl p-3 text-center">
          <p className="text-xs text-text-secondary mb-0.5">Cycles</p>
          <p className="text-sm font-bold text-text-primary">{cycles.length}</p>
          <p className="text-xs text-text-secondary opacity-70">tracked</p>
        </div>
      </div>

      <button
        onClick={onLogPeriod}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors text-sm"
      >
        <Droplets className="w-4 h-4" />
        Log Period
      </button>
    </div>
  )
}

// ─── Cycle Calendar ───────────────────────────────────────────────────────────

interface CycleCalendarProps {
  dayMap: Map<string, DayType>
  onDayClick?: (date: string) => void
}

const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function MonthGrid({
  year,
  month,
  dayMap,
  today,
  onDayClick,
}: {
  year: number
  month: number // 0-indexed
  dayMap: Map<string, DayType>
  today: string
  onDayClick?: (date: string) => void
}) {
  const monthName = new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = Array(firstDow).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-text-primary">{monthName}</p>
      <div className="grid grid-cols-7 gap-0.5">
        {DOW_LABELS.map((d) => (
          <div key={d} className="text-center text-xs text-text-secondary py-1 font-medium">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const mm = String(month + 1).padStart(2, '0')
          const dd = String(day).padStart(2, '0')
          const dateStr = `${year}-${mm}-${dd}`
          const dtype = dayMap.get(dateStr)
          const isToday = dateStr === today
          const isFuture = dateStr > today

          return (
            <button
              key={i}
              onClick={() => onDayClick?.(dateStr)}
              disabled={isFuture}
              title={dtype ? `${dateStr}: ${dtype}` : dateStr}
              className={[
                'relative aspect-square flex items-center justify-center rounded-full text-xs font-medium transition-colors',
                dtype && !isFuture ? DAY_COLORS[dtype] : 'text-text-secondary hover:bg-surface-secondary',
                isToday ? 'ring-2 ring-offset-1 ring-offset-surface ring-accent' : '',
                isFuture ? 'opacity-30 cursor-default' : 'cursor-pointer',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CycleCalendar({ dayMap, onDayClick }: CycleCalendarProps) {
  const today = todayStr()
  const now = new Date()
  const [offsetMonths, setOffsetMonths] = useState(0)

  // Show 4 months: offset controls which 4 months to view
  // Default: 3 months ago → current month
  const months: { year: number; month: number }[] = []
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i + offsetMonths * 4)
    months.push({ year: d.getFullYear(), month: d.getMonth() })
  }

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">Calendar</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffsetMonths((p) => p - 1)}
            className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Previous months"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setOffsetMonths(0)}
            disabled={offsetMonths === 0}
            className="px-2 py-1 text-xs rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary disabled:opacity-40"
          >
            Today
          </button>
          <button
            onClick={() => setOffsetMonths((p) => p + 1)}
            disabled={offsetMonths >= 0}
            className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary disabled:opacity-30"
            aria-label="Next months"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {months.map(({ year, month }) => (
          <MonthGrid
            key={`${year}-${month}`}
            year={year}
            month={month}
            dayMap={dayMap}
            today={today}
            onDayClick={onDayClick}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {(
          [
            { type: 'menstrual', label: 'Period' },
            { type: 'ovulation', label: 'Ovulation' },
            { type: 'fertile', label: 'Fertile' },
            { type: 'luteal', label: 'Luteal' },
          ] as { type: DayType; label: string }[]
        ).map(({ type, label }) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${DAY_COLORS[type].split(' ')[0]}`} />
            <span className="text-xs text-text-secondary">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Symptom Logger ───────────────────────────────────────────────────────────

interface SymptomLoggerProps {
  currentCycle: MenstrualCycle | undefined
  onUpdated: () => void
}

function SymptomLogger({ currentCycle, onUpdated }: SymptomLoggerProps) {
  const [symptoms, setSymptoms] = useState<string[]>(currentCycle?.symptoms ?? [])
  const [customInput, setCustomInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!currentCycle) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-2">Symptom Log</h3>
        <p className="text-sm text-text-secondary">Log a period to track symptoms.</p>
      </div>
    )
  }

  const toggleSymptom = (id: string) => {
    setSaved(false)
    setSymptoms((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  const addCustom = () => {
    const trimmed = customInput.trim().toLowerCase().replace(/\s+/g, '_')
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms((prev) => [...prev, trimmed])
      setSaved(false)
    }
    setCustomInput('')
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: currentCycle.start_date,
          end_date: currentCycle.end_date ?? null,
          flow_intensity: currentCycle.flow_intensity ?? null,
          symptoms,
          notes: currentCycle.notes ?? null,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      onUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const customSymptoms = symptoms.filter((s) => !STANDARD_SYMPTOMS.find((std) => std.id === s))

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Symptom Log</h3>
        <p className="text-xs text-text-secondary">
          Current cycle · {fmtShortDate(currentCycle.start_date)}
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {STANDARD_SYMPTOMS.map((s) => {
          const active = symptoms.includes(s.id)
          return (
            <button
              key={s.id}
              onClick={() => toggleSymptom(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border ${
                active
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                  : 'border-border text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              {active ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{s.emoji}</span>
              <span className="truncate">{s.label}</span>
            </button>
          )
        })}
      </div>

      {customSymptoms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customSymptoms.map((sym) => (
            <span
              key={sym}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400"
            >
              {sym.replace(/_/g, ' ')}
              <button onClick={() => toggleSymptom(sym)} className="hover:text-rose-300">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          placeholder="Add custom symptom…"
          className="flex-1 bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-rose-500/40"
        />
        <button
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-text-secondary hover:bg-rose-500/10 hover:text-rose-400 transition-colors disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 transition-colors text-sm font-medium disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Update Symptoms'}
      </button>
    </div>
  )
}

// ─── Period History ───────────────────────────────────────────────────────────

const FLOW_DOTS: Record<FlowIntensity, string> = {
  light: 'bg-rose-300',
  moderate: 'bg-rose-500',
  heavy: 'bg-rose-700',
}

function PeriodHistory({ cycles }: { cycles: MenstrualCycle[] }) {
  const displayCycles = cycles.slice(0, 6)

  if (displayCycles.length === 0) return null

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <TrendingUp className="w-4 h-4 text-text-secondary" />
        <h3 className="text-sm font-semibold text-text-primary">Period History</h3>
        <span className="ml-auto text-xs text-text-secondary">Last {displayCycles.length} cycles</span>
      </div>
      <div className="divide-y divide-border">
        {displayCycles.map((cycle) => {
          const periodDays =
            cycle.end_date
              ? Math.round(
                  (new Date(cycle.end_date).getTime() - new Date(cycle.start_date).getTime()) /
                    MS_PER_DAY,
                ) + 1
              : null
          const flow = cycle.flow_intensity as FlowIntensity | null | undefined

          return (
            <div key={cycle.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{fmtDate(cycle.start_date)}</p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  {periodDays && (
                    <span className="text-xs text-text-secondary">{periodDays}d period</span>
                  )}
                  {cycle.computed_cycle_length && (
                    <span className="text-xs text-text-secondary">
                      {cycle.computed_cycle_length}d cycle
                    </span>
                  )}
                  {cycle.symptoms.length > 0 && (
                    <span className="text-xs text-text-secondary">
                      {cycle.symptoms.length} symptom{cycle.symptoms.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              {flow && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${FLOW_DOTS[flow]}`} />
                  <span className="text-xs text-text-secondary capitalize">{flow}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface CyclePageClientProps {
  cycles: MenstrualCycle[]
}

export function CyclePageClient({ cycles: initialCycles }: CyclePageClientProps) {
  const router = useRouter()
  const [showLogModal, setShowLogModal] = useState(false)

  const handleSaved = useCallback(() => {
    router.refresh()
  }, [router])

  const cycles = initialCycles

  // Compute average cycle length
  const lengths = cycles
    .map((c) => c.computed_cycle_length ?? c.cycle_length)
    .filter((l): l is number => l !== null && l !== undefined && l > 0)
  const avgCycleLength = lengths.length > 0
    ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
    : 28

  const dayMap = buildDayMap(cycles, avgCycleLength)
  const currentCycle = cycles[0]

  return (
    <div className="space-y-5">
      {showLogModal && (
        <LogPeriodModal
          onClose={() => setShowLogModal(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Prediction card */}
      <CyclePredictionCard
        cycles={cycles}
        avgCycleLength={avgCycleLength}
        onLogPeriod={() => setShowLogModal(true)}
      />

      {/* Calendar */}
      <CycleCalendar dayMap={dayMap} />

      {/* Symptom logger */}
      <SymptomLogger currentCycle={currentCycle} onUpdated={handleSaved} />

      {/* Period history */}
      <PeriodHistory cycles={cycles} />
    </div>
  )
}

