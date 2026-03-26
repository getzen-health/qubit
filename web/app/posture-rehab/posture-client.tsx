'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  DEVIATIONS,
  EXERCISES,
  ERGONOMIC_CHECKLIST,
  PAIN_AREAS,
  buildCorrectionRoutine,
  calculatePostureScore,
  getExercisesForDeviation,
  type PosturalDeviation,
  type PostureAssessment,
  type PostureExercise,
  type PostureRoutine,
} from '@/lib/posture-rehab'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { PersonStanding, ChevronDown, ChevronUp, Play, Square, CheckCircle2, Clock, Dumbbell, Flame, RotateCcw, BookOpen, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface InitialData {
  assessments: AssessmentRow[]
  exerciseLogs: ExerciseLogRow[]
  logsByDate: Record<string, number>
  topExercises: { id: string; count: number }[]
}

interface AssessmentRow {
  id: string
  date: string
  deviations: Record<PosturalDeviation, number>
  pain_areas: string[]
  ergonomic_score: number
  notes?: string
  created_at: string
}

interface ExerciseLogRow {
  id: string
  date: string
  exercise_id: string
  sets_completed: number
  reps_completed?: number
  duration_sec?: number
  deviation_focus?: string
  notes?: string
  created_at: string
}

// ── Constants ─────────────────────────────────────────────────────────────

const SEVERITY_LABELS = ['None', 'Mild', 'Moderate', 'Severe']
const SEVERITY_COLORS = [
  'bg-surface text-text-secondary border-border',
  'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
  'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
]
const SEVERITY_RING = ['stroke-border', 'stroke-yellow-400', 'stroke-orange-400', 'stroke-red-500']
const TYPE_BADGE: Record<PostureExercise['type'], string> = {
  release: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  stretch: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  activate: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  strengthen: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
}
const DIFFICULTY_BADGE: Record<PostureExercise['difficulty'], string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

// ── Posture Score Ring ─────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = ((100 - score) / 100) * circumference
  const color =
    score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : score >= 25 ? '#f97316' : '#ef4444'
  const label =
    score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 25 ? 'Fair' : 'Needs Work'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="130" height="130" className="-rotate-90">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="-mt-[90px] flex flex-col items-center">
        <span className="text-3xl font-bold text-text-primary">{score}</span>
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <div className="mt-[56px] text-sm font-medium text-text-secondary">Posture Score</div>
    </div>
  )
}

// ── Exercise Card ──────────────────────────────────────────────────────────

function ExerciseCard({
  exercise,
  isActive,
  isCompleted,
  onLog,
}: {
  exercise: PostureExercise
  isActive?: boolean
  isCompleted?: boolean
  onLog?: (ex: PostureExercise) => void
}) {
  const [open, setOpen] = useState(false)
  const volume = exercise.duration_sec
    ? `${exercise.sets} × ${exercise.duration_sec}s`
    : `${exercise.sets} × ${exercise.reps} reps`

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface p-4 transition-all',
        isActive && 'ring-2 ring-primary',
        isCompleted && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', TYPE_BADGE[exercise.type])}>
              {exercise.type}
            </span>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', DIFFICULTY_BADGE[exercise.difficulty])}>
              {exercise.difficulty}
            </span>
          </div>
          <h4 className="font-semibold text-text-primary text-sm">{exercise.name}</h4>
          <p className="text-xs text-text-secondary mt-0.5">
            {volume} · rest {exercise.rest_sec}s · {exercise.equipment}
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 text-text-secondary hover:text-text-primary p-1"
          aria-label="Toggle instructions"
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          <ol className="space-y-1.5">
            {exercise.instructions.map((step, i) => (
              <li key={i} className="flex gap-2 text-xs text-text-secondary">
                <span className="shrink-0 w-5 h-5 rounded-full bg-surface-secondary flex items-center justify-center text-text-primary font-semibold">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs font-medium text-primary">💬 {exercise.cue}</p>
          </div>
        </div>
      )}

      {onLog && (
        <button
          onClick={() => onLog(exercise)}
          disabled={isCompleted}
          className={cn(
            'mt-3 w-full text-xs font-medium py-1.5 rounded-lg transition-colors',
            isCompleted
              ? 'bg-surface-secondary text-text-muted cursor-not-allowed'
              : 'bg-primary text-white hover:opacity-90',
          )}
        >
          {isCompleted ? '✓ Logged' : 'Log Completion'}
        </button>
      )}
    </div>
  )
}

// ── Timer Mode ─────────────────────────────────────────────────────────────

function RoutineTimer({
  routine,
  onComplete,
  onLog,
}: {
  routine: PostureRoutine
  onComplete: () => void
  onLog: (ex: PostureExercise) => void
}) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase] = useState<'work' | 'rest'>('work')
  const [timeLeft, setTimeLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [currentSet, setCurrentSet] = useState(1)

  const exercise = routine.exercises[currentIdx]

  const getWorkTime = useCallback(
    (ex: PostureExercise) => ex.duration_sec ?? (ex.reps ?? 10) * 3,
    [],
  )

  useEffect(() => {
    if (exercise) setTimeLeft(getWorkTime(exercise))
    setCurrentSet(1)
    setPhase('work')
  }, [currentIdx, exercise, getWorkTime])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (phase === 'work') {
            if (currentSet < exercise.sets) {
              setPhase('rest')
              return exercise.rest_sec
            } else {
              // Exercise done
              onLog(exercise)
              clearInterval(intervalRef.current!)
              setRunning(false)
              if (currentIdx + 1 < routine.exercises.length) {
                setTimeout(() => {
                  setCurrentIdx((i) => i + 1)
                }, 500)
              } else {
                onComplete()
              }
              return 0
            }
          } else {
            setPhase('work')
            setCurrentSet((s) => s + 1)
            return getWorkTime(exercise)
          }
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [running, phase, currentSet, exercise, currentIdx, routine.exercises.length, onLog, onComplete, getWorkTime])

  if (!exercise) return null

  const totalTime = getWorkTime(exercise)
  const progressPct = phase === 'work' ? ((totalTime - timeLeft) / totalTime) * 100 : ((exercise.rest_sec - timeLeft) / exercise.rest_sec) * 100

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-secondary">
            Exercise {currentIdx + 1} / {routine.exercises.length}
          </span>
          <span className="text-xs text-text-secondary">
            Set {currentSet} / {exercise.sets}
          </span>
        </div>
        <h3 className="text-lg font-bold text-text-primary mb-1">{exercise.name}</h3>
        <div className={cn('text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-3', TYPE_BADGE[exercise.type])}>
          {exercise.type}
        </div>

        {/* Timer display */}
        <div className="flex flex-col items-center gap-2 my-4">
          <div
            className={cn(
              'text-5xl font-mono font-bold',
              phase === 'rest' ? 'text-blue-500' : 'text-primary',
            )}
          >
            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
          <span className={cn('text-sm font-medium', phase === 'rest' ? 'text-blue-500' : 'text-text-secondary')}>
            {phase === 'rest' ? '⏸ Rest' : '▶ Work'}
          </span>
          {/* Progress bar */}
          <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-1000', phase === 'rest' ? 'bg-blue-400' : 'bg-primary')}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="p-2 rounded-lg bg-primary/10 mb-4">
          <p className="text-xs font-medium text-primary">💬 {exercise.cue}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-medium text-sm"
          >
            {running ? <Square size={16} /> : <Play size={16} />}
            {running ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={() => {
              setRunning(false)
              if (currentIdx + 1 < routine.exercises.length) {
                setCurrentIdx((i) => i + 1)
              } else {
                onComplete()
              }
            }}
            className="px-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm hover:bg-surface-secondary"
          >
            Skip
          </button>
        </div>
      </div>

      {/* Upcoming */}
      {currentIdx + 1 < routine.exercises.length && (
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-xs text-text-secondary mb-1">Next up</p>
          <p className="text-sm font-medium text-text-primary">{routine.exercises[currentIdx + 1].name}</p>
        </div>
      )}
    </div>
  )
}

// ── Main Client Component ──────────────────────────────────────────────────

export function PostureClient({ initialData }: { initialData: InitialData | null }) {
  const [tab, setTab] = useState<'assess' | 'routine' | 'progress'>('assess')

  // Assessment state
  const [deviations, setDeviations] = useState<Record<PosturalDeviation, number>>({
    fhp: 0,
    rounded_shoulders: 0,
    apt: 0,
    knee_valgus: 0,
    flat_feet: 0,
  })
  const [painAreas, setPainAreas] = useState<string[]>([])
  const [ergonomicChecked, setErgonomicChecked] = useState<boolean[]>(
    Array(ERGONOMIC_CHECKLIST.length).fill(false),
  )
  const [assessmentNotes, setAssessmentNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Routine state
  const [routine, setRoutine] = useState<PostureRoutine | null>(null)
  const [timerMode, setTimerMode] = useState(false)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [logSuccess, setLogSuccess] = useState<string | null>(null)

  // Data
  const [data, setData] = useState(initialData)

  const ergonomicScore = ergonomicChecked.filter(Boolean).length
  const assessment: PostureAssessment = {
    date: new Date().toISOString().split('T')[0],
    deviations,
    pain_areas: painAreas,
    ergonomic_score: ergonomicScore,
    notes: assessmentNotes || undefined,
  }
  const score = calculatePostureScore(assessment)

  // Pre-populate from latest assessment if available
  useEffect(() => {
    if (data?.assessments?.[0]) {
      const latest = data.assessments[0]
      setDeviations(latest.deviations)
      setPainAreas(latest.pain_areas)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleBuildRoutine() {
    const r = buildCorrectionRoutine(assessment, 30)
    setRoutine(r)
    setCompletedIds(new Set())
    setTimerMode(false)
    setTab('routine')
  }

  async function handleSaveAssessment() {
    setSaving(true)
    try {
      const res = await fetch('/api/posture-rehab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'assessment', ...assessment }),
      })
      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
        // Refresh data
        const refreshed = await fetch('/api/posture-rehab')
        if (refreshed.ok) setData(await refreshed.json())
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleLogExercise(ex: PostureExercise) {
    const res = await fetch('/api/posture-rehab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'exercise_log',
        date: new Date().toISOString().split('T')[0],
        exercise_id: ex.id,
        sets_completed: ex.sets,
        reps_completed: ex.reps ?? null,
        duration_sec: ex.duration_sec ?? null,
        deviation_focus: ex.deviations[0] ?? null,
      }),
    })
    if (res.ok) {
      setCompletedIds((s) => new Set([...s, ex.id]))
      setLogSuccess(ex.name)
      setTimeout(() => setLogSuccess(null), 3000)
      // Refresh
      const refreshed = await fetch('/api/posture-rehab')
      if (refreshed.ok) setData(await refreshed.json())
    }
  }

  // ── Heatmap helpers ──────────────────────────────────────────────────────

  function getLast30Days(): string[] {
    const days: string[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }
    return days
  }

  function heatColor(count: number): string {
    if (count === 0) return 'bg-surface-secondary'
    if (count <= 2) return 'bg-primary/30'
    if (count <= 4) return 'bg-primary/60'
    return 'bg-primary'
  }

  // ── Assessment history chart data ────────────────────────────────────────
  const scoreChartData = (data?.assessments ?? [])
    .slice()
    .reverse()
    .map((a) => ({
      date: a.date.slice(5), // MM-DD
      score: calculatePostureScore({
        date: a.date,
        deviations: a.deviations,
        pain_areas: a.pain_areas,
        ergonomic_score: a.ergonomic_score,
      }),
    }))

  const last30Days = getLast30Days()

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <PersonStanding size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Posture Rehab</h1>
          <p className="text-xs text-text-secondary">Janda-based corrective exercise</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-secondary rounded-xl p-1">
        {(['assess', 'routine', 'progress'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors',
              tab === t ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {t === 'assess' ? '📋 Assess' : t === 'routine' ? '🏋️ Routine' : '📈 Progress'}
          </button>
        ))}
      </div>

      {/* ── TAB: ASSESS ──────────────────────────────────────────────────── */}
      {tab === 'assess' && (
        <div className="space-y-6">
          {/* Score Ring */}
          <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col items-center">
            <ScoreRing score={score} />
            <p className="text-xs text-text-secondary mt-3 text-center max-w-xs">
              Score updates live as you fill in the assessment below. Save to track trends over time.
            </p>
          </div>

          {/* Deviation Cards */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-3">Postural Deviations</h2>
            <div className="space-y-3">
              {DEVIATIONS.map((dev) => (
                <div key={dev.id} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm text-text-primary">{dev.name}</h3>
                      <p className="text-xs text-text-secondary mt-0.5">{dev.selfTest}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 ml-2 px-2 py-0.5 rounded-full text-xs font-medium border',
                        SEVERITY_COLORS[deviations[dev.id]],
                      )}
                    >
                      {SEVERITY_LABELS[deviations[dev.id]]}
                    </span>
                  </div>

                  {/* Severity Selector */}
                  <div className="flex gap-1.5 mt-2">
                    {[0, 1, 2, 3].map((s) => (
                      <button
                        key={s}
                        onClick={() => setDeviations((d) => ({ ...d, [dev.id]: s }))}
                        className={cn(
                          'flex-1 py-1 rounded-lg text-xs font-medium border transition-all',
                          deviations[dev.id] === s
                            ? SEVERITY_COLORS[s].replace('bg-', 'bg-').replace('text-', 'text-') + ' ring-2 ring-offset-1'
                            : 'bg-surface-secondary border-border text-text-secondary hover:border-border',
                          s === 0 && deviations[dev.id] === 0 && 'ring-primary/40',
                          s === 1 && deviations[dev.id] === 1 && 'ring-yellow-400',
                          s === 2 && deviations[dev.id] === 2 && 'ring-orange-400',
                          s === 3 && deviations[dev.id] === 3 && 'ring-red-500',
                        )}
                      >
                        {SEVERITY_LABELS[s]}
                      </button>
                    ))}
                  </div>

                  {/* Expanded detail for non-zero */}
                  {deviations[dev.id] > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-surface-secondary">
                        <p className="font-medium text-text-primary mb-1">Tight / Overactive</p>
                        {dev.tightMuscles.map((m) => (
                          <p key={m} className="text-text-secondary">• {m}</p>
                        ))}
                      </div>
                      <div className="p-2 rounded-lg bg-surface-secondary">
                        <p className="font-medium text-text-primary mb-1">Weak / Inhibited</p>
                        {dev.weakMuscles.map((m) => (
                          <p key={m} className="text-text-secondary">• {m}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pain Areas */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Pain Areas</h2>
            <div className="flex flex-wrap gap-2">
              {PAIN_AREAS.map((area) => (
                <button
                  key={area}
                  onClick={() =>
                    setPainAreas((prev) =>
                      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
                    )
                  }
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    painAreas.includes(area)
                      ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-surface-secondary border-border text-text-secondary hover:border-border',
                  )}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Ergonomic Checklist */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">Ergonomic Checklist</h2>
              <span className="text-xs font-semibold text-primary">
                {ergonomicScore} / 8
              </span>
            </div>
            <div className="space-y-2.5">
              {ERGONOMIC_CHECKLIST.map((item, i) => (
                <label key={i} className="flex items-start gap-3 cursor-pointer group">
                  <div
                    className={cn(
                      'shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
                      ergonomicChecked[i]
                        ? 'bg-primary border-primary'
                        : 'border-border group-hover:border-primary/60',
                    )}
                    onClick={() =>
                      setErgonomicChecked((prev) => {
                        const next = [...prev]
                        next[i] = !next[i]
                        return next
                      })
                    }
                  >
                    {ergonomicChecked[i] && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={cn('text-xs leading-relaxed', ergonomicChecked[i] ? 'text-text-primary' : 'text-text-secondary')}>
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <label className="text-xs font-semibold text-text-primary block mb-2">Notes (optional)</label>
            <textarea
              value={assessmentNotes}
              onChange={(e) => setAssessmentNotes(e.target.value)}
              rows={3}
              placeholder="How does your posture feel today? Any specific discomfort?"
              className="w-full text-sm bg-surface-secondary border border-border rounded-xl p-3 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-4">
            <button
              onClick={handleSaveAssessment}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-surface border border-border text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : saveSuccess ? '✓ Saved' : 'Save Assessment'}
            </button>
            <button
              onClick={handleBuildRoutine}
              className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Build My Routine →
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: ROUTINE ─────────────────────────────────────────────────── */}
      {tab === 'routine' && (
        <div className="space-y-4 pb-4">
          {!routine && (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <PersonStanding size={40} className="mx-auto text-text-muted mb-3" />
              <p className="text-text-secondary text-sm">
                Complete your posture assessment first, then tap{' '}
                <strong className="text-text-primary">Build My Routine</strong> to generate a personalised
                corrective exercise plan.
              </p>
              <button
                onClick={() => setTab('assess')}
                className="mt-4 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium"
              >
                Go to Assessment
              </button>
            </div>
          )}

          {routine && routine.exercises.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6 text-center">
              <CheckCircle2 size={36} className="mx-auto text-activity mb-2" />
              <p className="font-semibold text-text-primary">No corrections needed!</p>
              <p className="text-xs text-text-secondary mt-1">
                Your assessment shows no active postural deviations. Keep up the great work.
              </p>
            </div>
          )}

          {routine && routine.exercises.length > 0 && (
            <>
              {/* Routine Summary */}
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-text-primary">Your Corrective Routine</h2>
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    <Clock size={12} /> ~{routine.totalMinutes} min
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {routine.focusDeviations.map((d) => {
                    const dev = DEVIATIONS.find((x) => x.id === d)
                    return (
                      <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {dev?.name ?? d}
                      </span>
                    )
                  })}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <span>{routine.exercises.length} exercises</span>
                  <span>·</span>
                  <span>
                    {routine.exercises.filter((e) => e.type === 'release').length} release →{' '}
                    {routine.exercises.filter((e) => e.type === 'stretch').length} stretch →{' '}
                    {routine.exercises.filter((e) => e.type === 'activate').length} activate →{' '}
                    {routine.exercises.filter((e) => e.type === 'strengthen').length} strengthen
                  </span>
                </div>
              </div>

              {/* Toast */}
              {logSuccess && (
                <div className="rounded-xl bg-activity/10 border border-activity/30 px-4 py-2.5 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-activity" />
                  <span className="text-sm text-activity font-medium">{logSuccess} logged!</span>
                </div>
              )}

              {timerMode ? (
                <>
                  <RoutineTimer
                    routine={routine}
                    onComplete={() => setTimerMode(false)}
                    onLog={handleLogExercise}
                  />
                  <button
                    onClick={() => setTimerMode(false)}
                    className="w-full py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-surface-secondary"
                  >
                    Exit Timer Mode
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setTimerMode(true)}
                    className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90"
                  >
                    <Play size={16} /> Start Routine (Timer Mode)
                  </button>

                  <div className="space-y-3">
                    {routine.exercises.map((ex) => (
                      <ExerciseCard
                        key={ex.id}
                        exercise={ex}
                        isCompleted={completedIds.has(ex.id)}
                        onLog={handleLogExercise}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setRoutine(null)
                      setCompletedIds(new Set())
                    }}
                    className="w-full py-2.5 rounded-xl border border-border text-xs text-text-secondary hover:bg-surface-secondary flex items-center justify-center gap-1"
                  >
                    <RotateCcw size={12} /> Clear Routine
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB: PROGRESS ────────────────────────────────────────────────── */}
      {tab === 'progress' && (
        <div className="space-y-6 pb-4">
          {/* Posture Score Trend */}
          {scoreChartData.length > 1 && (
            <div className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <BarChart2 size={16} className="text-primary" /> Posture Score Trend
              </h2>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={scoreChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--text-secondary))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--text-secondary))" />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Assessment History */}
          {(data?.assessments ?? []).length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Assessment History</h2>
              <div className="space-y-2">
                {(data?.assessments ?? []).map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-xs text-text-secondary">{a.date}</span>
                    <div className="flex gap-1.5">
                      {(Object.entries(a.deviations) as [PosturalDeviation, number][]).map(([k, v]) => {
                        if (v === 0) return null
                        return (
                          <span
                            key={k}
                            className={cn('text-xs px-1.5 py-0.5 rounded-md border', SEVERITY_COLORS[v])}
                            title={`${k}: ${SEVERITY_LABELS[v]}`}
                          >
                            {k.replace('_', ' ').slice(0, 3).toUpperCase()} {v}
                          </span>
                        )
                      })}
                    </div>
                    <span className="text-xs font-semibold text-primary">
                      {calculatePostureScore({
                        date: a.date,
                        deviations: a.deviations,
                        pain_areas: a.pain_areas,
                        ergonomic_score: a.ergonomic_score,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exercise Heatmap */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">30-Day Exercise Activity</h2>
            <div className="flex flex-wrap gap-1">
              {last30Days.map((d) => (
                <div
                  key={d}
                  title={`${d}: ${data?.logsByDate?.[d] ?? 0} exercises`}
                  className={cn('w-6 h-6 rounded-md', heatColor(data?.logsByDate?.[d] ?? 0))}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
              <div className="w-3 h-3 rounded-sm bg-surface-secondary" /> Less
              <div className="w-3 h-3 rounded-sm bg-primary/30" />
              <div className="w-3 h-3 rounded-sm bg-primary/60" />
              <div className="w-3 h-3 rounded-sm bg-primary" /> More
            </div>
          </div>

          {/* Top Exercises */}
          {(data?.topExercises ?? []).length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Dumbbell size={16} className="text-primary" /> Most Practiced
              </h2>
              <div className="space-y-2">
                {(data?.topExercises ?? []).map((t) => {
                  const ex = EXERCISES.find((e) => e.id === t.id)
                  return (
                    <div key={t.id} className="flex items-center justify-between">
                      <span className="text-xs text-text-primary">{ex?.name ?? t.id}</span>
                      <span className="text-xs font-semibold text-primary">{t.count}×</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Educational: Janda Patterns */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <BookOpen size={16} className="text-primary" /> Understanding Janda Patterns
            </h2>

            <div className="space-y-4 text-xs text-text-secondary leading-relaxed">
              <div className="p-3 rounded-xl bg-surface-secondary">
                <p className="font-semibold text-text-primary mb-1">Upper Crossed Syndrome (UCS)</p>
                <p>
                  Described by Vladimir Janda (1987), UCS is defined by two intersecting patterns of muscle imbalance
                  in the cervical and thoracic region. Tight muscles (anterior: pec minor, SCM; posterior: suboccipitals,
                  upper traps) cross with weak muscles (anterior: deep neck flexors; posterior: lower traps, serratus
                  anterior). The result is forward head posture, rounded shoulders, and a protracted scapula. Every
                  1 inch of forward head posture adds ~10 lbs of effective load on the cervical spine (Kapandji 2008).
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <p className="font-medium text-red-600 dark:text-red-400">Tight (inhibit first)</p>
                    <p>• Suboccipitals</p>
                    <p>• Upper trapezius</p>
                    <p>• Pec major / minor</p>
                    <p>• SCM</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <p className="font-medium text-green-600 dark:text-green-400">Weak (activate after)</p>
                    <p>• Deep neck flexors</p>
                    <p>• Lower trapezius</p>
                    <p>• Serratus anterior</p>
                    <p>• Rhomboids</p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-secondary">
                <p className="font-semibold text-text-primary mb-1">Lower Crossed Syndrome (LCS)</p>
                <p>
                  LCS presents as anterior pelvic tilt and lumbar hyperlordosis. Tight muscles (anterior: hip flexors,
                  rectus femoris; posterior: lumbar erectors) cross with weak muscles (anterior: transversus abdominis,
                  deep abs; posterior: gluteus maximus, hamstrings). The correction sequence follows the Janda approach
                  (Page, Frank & Lardner 2010): release overactive tissues → lengthen shortened muscles → activate
                  inhibited muscles → integrate into functional patterns.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <p className="font-medium text-red-600 dark:text-red-400">Tight (inhibit first)</p>
                    <p>• Iliopsoas / hip flexors</p>
                    <p>• Rectus femoris</p>
                    <p>• Lumbar erectors</p>
                    <p>• TFL</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <p className="font-medium text-green-600 dark:text-green-400">Weak (activate after)</p>
                    <p>• Gluteus maximus</p>
                    <p>• Transversus abdominis</p>
                    <p>• Hamstrings</p>
                    <p>• Deep abs</p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-secondary">
                <p className="font-semibold text-text-primary mb-1">McGill Spine Rehabilitation Principles</p>
                <p>
                  Stuart McGill (2015) emphasises that spinal rehabilitation should prioritise endurance over strength,
                  and that the spine must be loaded in a neutral position. The "Big 3" (McGill curl-up, bird-dog, side
                  plank) build a muscular corset around the spine without generating excessive compressive forces. Avoid
                  end-range spinal flexion under load and ensure the bracing sequence (breathe → brace → move) before
                  any exercise.
                </p>
              </div>
            </div>
          </div>

          {(data?.assessments ?? []).length === 0 && (data?.exerciseLogs ?? []).length === 0 && (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <Flame size={36} className="mx-auto text-text-muted mb-3" />
              <p className="text-text-secondary text-sm">
                No data yet. Complete an assessment and log some exercises to see your progress here.
              </p>
              <button
                onClick={() => setTab('assess')}
                className="mt-4 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium"
              >
                Start Assessment
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
