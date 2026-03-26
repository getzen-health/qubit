'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Cell, PieChart, Pie,
} from 'recharts'
import { Crosshair, Zap, BarChart2, TrendingUp, Play, Pause, Square,
         AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Star, Flame } from 'lucide-react'
import {
  FocusSession, DeepWorkAnalysis, PomodoroMode, TaskType, DistractionCategory,
  DistractionEntry, POMODORO_MODES, TASK_TYPES, DISTRACTION_CATEGORIES,
  analyzeDeepWork, formatDuration, formatHour,
} from '@/lib/deep-work'

// ─── Types ──────────────────────────────────────────────────────────────────

interface TrendDay {
  date: string
  focusScore: number
  totalDeepWorkMin: number
  avgQuality: number
  flowSessions: number
  distractionsPerHour: number
}

interface HourBucket {
  hour: number
  avgQuality: number
  sessionCount: number
}

interface DistractionBreakdownItem {
  category: DistractionCategory
  label: string
  icon: string
  count: number
  pct: number
}

interface FlowWeek { week: string; count: number }
interface DowDay { day: string; avgQuality: number; count: number }

interface Props {
  initialSessions: FocusSession[]
  initialAnalysis: DeepWorkAnalysis
  trend: TrendDay[]
  hourlyHeatmap: HourBucket[]
  distractionBreakdown: DistractionBreakdownItem[]
  flowByWeek: FlowWeek[]
  dowData: DowDay[]
  today: string
}

// ─── Timer state machine ─────────────────────────────────────────────────────
type TimerPhase = 'idle' | 'working' | 'break' | 'post_session'

interface ActiveSession {
  mode: PomodoroMode
  workMin: number
  breakMin: number
  taskType: TaskType
  taskDescription: string
  energyLevel: number
  startTime: Date
  startTimeStr: string
  distractions: DistractionEntry[]
  flowState: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const GRADE_COLOR: Record<DeepWorkAnalysis['grade'], string> = {
  Elite:    '#34d399',
  Strong:   '#818cf8',
  Moderate: '#f59e0b',
  Scattered:'#f87171',
}
const GRADE_BG: Record<DeepWorkAnalysis['grade'], string> = {
  Elite:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Strong:   'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  Moderate: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Scattered:'bg-red-500/10 text-red-400 border-red-500/30',
}
const PIE_COLORS = ['#818cf8','#34d399','#f59e0b','#f472b6','#60a5fa','#a78bfa','#4ade80','#94a3b8']

function fmtTime(d: Date) {
  return d.toTimeString().slice(0, 5)
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function fmtCountdown(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${pad2(m)}:${pad2(s)}`
}

// ─── Focus Score Ring ────────────────────────────────────────────────────────
function ScoreRing({ score, grade }: { score: number; grade: DeepWorkAnalysis['grade'] }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = GRADE_COLOR[grade]
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none" />
          <circle
            cx="60" cy="60" r={r}
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-text-primary">{score}</span>
          <span className="text-[10px] text-text-secondary">/ 100</span>
        </div>
      </div>
      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${GRADE_BG[grade]}`}>
        {grade}
      </span>
    </div>
  )
}

// ─── Star Rating ─────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 'md' }: { value: number; onChange: (v: number) => void; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} onClick={() => onChange(i)} type="button">
          <Star className={`${sz} transition-colors ${i <= value ? 'fill-amber-400 text-amber-400' : 'text-text-muted'}`} />
        </button>
      ))}
    </div>
  )
}

// ─── Distraction Logger Modal ─────────────────────────────────────────────────
function DistractionLogger({ onLog, onClose }: {
  onLog: (d: DistractionEntry) => void
  onClose: () => void
}) {
  const [type, setType] = useState<'internal' | 'external'>('external')
  const [cat, setCat] = useState<DistractionCategory>('phone')
  const [recovery, setRecovery] = useState(23) // Mark et al. 2008 default

  function handleSave() {
    const now = new Date()
    onLog({ time: fmtTime(now), type, category: cat, recovery_min: recovery })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-2xl bg-background border-t border-border rounded-t-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-text-primary">Log Distraction</span>
          <button onClick={onClose} className="text-text-secondary text-sm">Cancel</button>
        </div>
        <div className="flex gap-2">
          {(['external','internal'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${type === t ? 'bg-accent/20 border-accent text-accent' : 'bg-surface border-border text-text-secondary'}`}>
              {t === 'external' ? '🌍 External' : '💭 Internal'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(Object.entries(DISTRACTION_CATEGORIES) as [DistractionCategory, { label: string; icon: string }][]).map(([k, v]) => (
            <button key={k} onClick={() => setCat(k)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs transition-colors ${cat === k ? 'bg-accent/20 border-accent text-accent' : 'bg-surface border-border text-text-secondary'}`}>
              <span className="text-lg">{v.icon}</span>
              <span className="leading-tight text-center">{v.label}</span>
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs text-text-secondary mb-1 block">
            Recovery time (min) — avg 23 min to fully refocus (Mark et al. 2008)
          </label>
          <input
            type="number" min={1} max={60} value={recovery}
            onChange={e => setRecovery(Number(e.target.value))}
            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-text-primary text-sm"
          />
        </div>
        <button onClick={handleSave}
          className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold">
          Log Distraction
        </button>
      </div>
    </div>
  )
}

// ─── Post-Session Form ────────────────────────────────────────────────────────
function PostSessionForm({ session, onSubmit, onDiscard }: {
  session: ActiveSession
  onSubmit: (quality: number, flowDepth: number | undefined, notes: string) => void
  onDiscard: () => void
}) {
  const [quality, setQuality] = useState(3)
  const [isFlow, setIsFlow] = useState(session.flowState)
  const [flowDepth, setFlowDepth] = useState(3)
  const [notes, setNotes] = useState('')

  const endTime = new Date()
  const actualMin = Math.round((endTime.getTime() - session.startTime.getTime()) / 60000)

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-24">
        <div className="text-center pt-4">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-text-primary">Session Complete!</h2>
          <p className="text-text-secondary text-sm mt-1">
            {TASK_TYPES[session.taskType].icon} {TASK_TYPES[session.taskType].label} · {formatDuration(actualMin)}
          </p>
          {session.distractions.length > 0 && (
            <p className="text-xs text-amber-400 mt-1">
              {session.distractions.length} distraction{session.distractions.length > 1 ? 's' : ''} logged
              · {session.distractions.reduce((s, d) => s + d.recovery_min, 0)} min recovery time
            </p>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-text-primary mb-2 block">Session Quality</label>
            <div className="flex items-center justify-between">
              <StarRating value={quality} onChange={setQuality} />
              <span className="text-text-secondary text-sm">{quality}/5</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-text-primary mb-2 block">Flow State?</label>
            <p className="text-xs text-text-secondary mb-2">
              Fully absorbed · time flew · effortless · intrinsically rewarding (Csikszentmihalyi 1990)
            </p>
            <div className="flex gap-2">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setIsFlow(v)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${isFlow === v ? 'bg-accent/20 border-accent text-accent' : 'bg-surface border-border text-text-secondary'}`}>
                  {v ? '⚡ Yes, I was in flow' : '❌ No flow state'}
                </button>
              ))}
            </div>
          </div>

          {isFlow && (
            <div>
              <label className="text-sm font-semibold text-text-primary mb-2 block">Flow Depth (1–5)</label>
              <StarRating value={flowDepth} onChange={setFlowDepth} />
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-text-primary mb-1 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="What went well? Blockers? Insights?"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-text-primary text-sm resize-none"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border flex gap-3 max-w-2xl mx-auto">
        <button onClick={onDiscard} className="px-5 py-3 rounded-2xl border border-border text-text-secondary text-sm">
          Discard
        </button>
        <button onClick={() => onSubmit(quality, isFlow ? flowDepth : undefined, notes)}
          className="flex-1 py-3 rounded-2xl bg-accent text-accent-foreground font-semibold">
          Save Session
        </button>
      </div>
    </div>
  )
}

// ─── Active Timer Screen ──────────────────────────────────────────────────────
function ActiveTimerScreen({ session, phase, secondsLeft, paused, onPause, onEnd, onDistraction, onToggleFlow }: {
  session: ActiveSession
  phase: TimerPhase
  secondsLeft: number
  paused: boolean
  onPause: () => void
  onEnd: () => void
  onDistraction: () => void
  onToggleFlow: () => void
}) {
  const isWork = phase === 'working'
  const totalSecs = (isWork ? session.workMin : session.breakMin) * 60
  const progress = (secondsLeft / totalSecs) * 100

  const r = 100
  const circ = 2 * Math.PI * r
  const dash = ((100 - progress) / 100) * circ

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-between py-8 px-4">
      {/* Phase label */}
      <div className="text-center">
        <span className={`text-sm font-semibold px-4 py-1.5 rounded-full border ${isWork ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
          {isWork ? '🎯 Deep Work' : '☕ Break'}
        </span>
        <p className="text-text-secondary text-xs mt-2">
          {TASK_TYPES[session.taskType].icon} {session.taskDescription || TASK_TYPES[session.taskType].label}
        </p>
      </div>

      {/* Ring + countdown */}
      <div className="relative w-64 h-64">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r={r} stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
          <circle
            cx="120" cy="120" r={r}
            stroke={isWork ? '#818cf8' : '#34d399'}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={dash}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-5xl font-mono font-bold text-text-primary tracking-tight">
            {fmtCountdown(secondsLeft)}
          </span>
          {paused && <span className="text-xs text-amber-400 font-medium">PAUSED</span>}
          {session.distractions.length > 0 && (
            <span className="text-xs text-text-secondary">{session.distractions.length} interruption{session.distractions.length > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs space-y-3">
        {isWork && (
          <div className="flex gap-2">
            <button onClick={onDistraction}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              Distracted
            </button>
            <button onClick={onToggleFlow}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-medium transition-colors ${session.flowState ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-surface border-border text-text-secondary'}`}>
              <Zap className="w-4 h-4" />
              {session.flowState ? 'In Flow ⚡' : 'Flow?'}
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onPause}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-surface border border-border text-text-secondary text-sm font-medium">
            {paused ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Pause</>}
          </button>
          <button onClick={onEnd}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
            <Square className="w-4 h-4" />
            End Session
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Today's Session Card ─────────────────────────────────────────────────────
function SessionCard({ s }: { s: FocusSession }) {
  const [open, setOpen] = useState(false)
  const tt = TASK_TYPES[s.task_type]
  const totalRecovery = s.distractions.reduce((sum, d) => sum + d.recovery_min, 0)

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setOpen(o => !o)}>
        <span className="text-2xl">{tt.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-primary">{tt.label}</span>
            {s.flow_state && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-medium">⚡ Flow</span>
            )}
            <span className="text-xs text-text-secondary">{s.start_time}–{s.end_time}</span>
          </div>
          {s.task_description && (
            <p className="text-xs text-text-secondary truncate mt-0.5">{s.task_description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-sm font-medium text-text-primary">{formatDuration(s.duration_min)}</span>
          <div className="flex">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-3 h-3 ${i <= s.quality_rating ? 'fill-amber-400 text-amber-400' : 'text-text-muted'}`} />
            ))}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-text-secondary shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-xs text-text-secondary">Energy</p><p className="text-sm font-semibold text-text-primary">{s.energy_level}/5</p></div>
            <div><p className="text-xs text-text-secondary">Distractions</p><p className="text-sm font-semibold text-text-primary">{s.distractions.length}</p></div>
            <div><p className="text-xs text-text-secondary">Recovery Lost</p><p className="text-sm font-semibold text-text-primary">{totalRecovery}m</p></div>
          </div>
          {s.flow_state && s.flow_depth && (
            <p className="text-xs text-indigo-400">Flow depth: {s.flow_depth}/5</p>
          )}
          {s.notes && <p className="text-xs text-text-secondary italic">"{s.notes}"</p>}
          {s.distractions.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-text-secondary font-medium">Distractions:</p>
              {s.distractions.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                  <span>{DISTRACTION_CATEGORIES[d.category].icon}</span>
                  <span>{DISTRACTION_CATEGORIES[d.category].label}</span>
                  <span className="text-text-muted">@ {d.time}</span>
                  <span className="text-amber-400 ml-auto">{d.recovery_min}m recovery</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'focus',     label: 'Focus',     icon: Crosshair },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'trends',    label: 'Trends',    icon: TrendingUp },
] as const
type TabId = typeof TABS[number]['id']

// ─── Main Component ───────────────────────────────────────────────────────────
export function DeepWorkClient({
  initialSessions, initialAnalysis, trend, hourlyHeatmap,
  distractionBreakdown, flowByWeek, dowData, today,
}: Props) {
  const [tab, setTab] = useState<TabId>('focus')
  const [sessions, setSessions] = useState<FocusSession[]>(initialSessions)
  const [analysis, setAnalysis] = useState<DeepWorkAnalysis>(initialAnalysis)

  // Timer state
  const [phase, setPhase] = useState<TimerPhase>('idle')
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [paused, setPaused] = useState(false)
  const [showDistractionLogger, setShowDistractionLogger] = useState(false)
  const [showPostSession, setShowPostSession] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Setup form state
  const [mode, setMode] = useState<PomodoroMode>('deep')
  const [customWork, setCustomWork] = useState(25)
  const [customBreak, setCustomBreak] = useState(5)
  const [taskType, setTaskType] = useState<TaskType>('coding')
  const [taskDesc, setTaskDesc] = useState('')
  const [energyLevel, setEnergyLevel] = useState(3)
  const [saving, setSaving] = useState(false)

  // Timer tick
  useEffect(() => {
    if ((phase === 'working' || phase === 'break') && !paused) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            if (phase === 'working') {
              // Auto-start break
              const breakSecs = (activeSession?.breakMin ?? 5) * 60
              setPhase('break')
              return breakSecs
            } else {
              // Break done → post session
              setPhase('post_session')
              setShowPostSession(true)
              return 0
            }
          }
          return s - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [phase, paused, activeSession])

  function startTimer() {
    const pm = POMODORO_MODES[mode]
    const workMin = mode === 'custom' ? customWork : pm.workMin
    const breakMin = mode === 'custom' ? customBreak : pm.breakMin
    const now = new Date()
    const s: ActiveSession = {
      mode, workMin, breakMin, taskType,
      taskDescription: taskDesc,
      energyLevel,
      startTime: now,
      startTimeStr: fmtTime(now),
      distractions: [],
      flowState: false,
    }
    setActiveSession(s)
    setSecondsLeft(workMin * 60)
    setPhase('working')
    setPaused(false)
  }

  function handleToggleFlow() {
    if (!activeSession) return
    setActiveSession(prev => prev ? { ...prev, flowState: !prev.flowState } : null)
  }

  function handleDistraction(d: DistractionEntry) {
    setActiveSession(prev => prev ? { ...prev, distractions: [...prev.distractions, d] } : null)
  }

  function handleEndSession() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPhase('post_session')
    setShowPostSession(true)
    setSecondsLeft(0)
  }

  async function handleSaveSession(quality: number, flowDepth: number | undefined, notes: string) {
    if (!activeSession) return
    setSaving(true)
    const endTime = new Date()
    const actualMin = Math.max(1, Math.round((endTime.getTime() - activeSession.startTime.getTime()) / 60000))
    const newSession: Omit<FocusSession, 'id' | 'user_id' | 'created_at'> = {
      date: today,
      start_time: activeSession.startTimeStr,
      end_time: fmtTime(endTime),
      duration_min: actualMin,
      task_type: activeSession.taskType,
      task_description: activeSession.taskDescription || undefined,
      mode: activeSession.mode,
      quality_rating: quality,
      flow_state: activeSession.flowState,
      flow_depth: flowDepth,
      distractions: activeSession.distractions,
      energy_level: activeSession.energyLevel,
      notes: notes || undefined,
    }
    try {
      const res = await fetch('/api/deep-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession),
      })
      if (res.ok) {
        const { session } = await res.json()
        const updated = [...sessions, session as FocusSession]
        setSessions(updated)
        setAnalysis(analyzeDeepWork(updated))
      }
    } finally {
      setSaving(false)
      setPhase('idle')
      setActiveSession(null)
      setShowPostSession(false)
      setTaskDesc('')
    }
  }

  function handleDiscard() {
    setPhase('idle')
    setActiveSession(null)
    setShowPostSession(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--surface))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '12px',
    color: 'hsl(var(--text-primary))',
    fontSize: '12px',
  }

  // ── Focus Tab ──────────────────────────────────────────────────────────────
  const FocusTab = () => {
    const goalMin = 240
    const pct = Math.min(100, Math.round((analysis.totalDeepWorkMin / goalMin) * 100))
    const pm = mode === 'custom' ? { workMin: customWork, breakMin: customBreak } : POMODORO_MODES[mode]

    return (
      <div className="space-y-5">
        {/* Score + stats */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-6">
            <ScoreRing score={analysis.focusScore} grade={analysis.grade} />
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex justify-between text-xs text-text-secondary mb-1">
                  <span>Deep Work Today</span>
                  <span className="text-text-primary font-medium">{formatDuration(analysis.totalDeepWorkMin)} / 4h</span>
                </div>
                <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface-secondary rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-text-primary">{sessions.length}</p>
                  <p className="text-[10px] text-text-secondary">Sessions</p>
                </div>
                <div className="bg-surface-secondary rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-indigo-400">{analysis.flowSessions}</p>
                  <p className="text-[10px] text-text-secondary">Flow</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timer setup */}
        {phase === 'idle' && (
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-text-primary text-sm">New Focus Session</h2>

            {/* Mode selector */}
            <div>
              <label className="text-xs text-text-secondary mb-2 block">Pomodoro Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(POMODORO_MODES) as [PomodoroMode, typeof POMODORO_MODES[PomodoroMode]][]).map(([k, v]) => (
                  <button key={k} onClick={() => setMode(k)}
                    className={`p-2.5 rounded-xl border text-left transition-colors ${mode === k ? 'bg-accent/20 border-accent' : 'bg-surface border-border'}`}>
                    <p className={`text-xs font-semibold ${mode === k ? 'text-accent' : 'text-text-primary'}`}>{v.label}</p>
                    <p className="text-[10px] text-text-secondary">{v.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom intervals */}
            {mode === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Work (min)</label>
                  <input type="number" min={5} max={180} value={customWork}
                    onChange={e => setCustomWork(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-text-primary text-sm" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Break (min)</label>
                  <input type="number" min={1} max={60} value={customBreak}
                    onChange={e => setCustomBreak(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-text-primary text-sm" />
                </div>
              </div>
            )}

            {/* Task type */}
            <div>
              <label className="text-xs text-text-secondary mb-2 block">Task Type</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.entries(TASK_TYPES) as [TaskType, typeof TASK_TYPES[TaskType]][]).map(([k, v]) => (
                  <button key={k} onClick={() => setTaskType(k)}
                    className={`flex flex-col items-center py-2 px-1 rounded-xl border text-xs transition-colors ${taskType === k ? 'bg-accent/20 border-accent text-accent' : 'bg-surface border-border text-text-secondary'}`}>
                    <span className="text-base">{v.icon}</span>
                    <span className="mt-0.5 leading-tight">{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Task description */}
            <div>
              <label className="text-xs text-text-secondary mb-1 block">What are you working on? (optional)</label>
              <input type="text" value={taskDesc} onChange={e => setTaskDesc(e.target.value)}
                placeholder="e.g. Refactor auth module..."
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-text-primary text-sm" />
            </div>

            {/* Energy level */}
            <div>
              <label className="text-xs text-text-secondary mb-2 block">Energy Level</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setEnergyLevel(n)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-colors ${energyLevel === n ? 'bg-accent/20 border-accent text-accent' : 'bg-surface border-border text-text-secondary'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>Drained</span><span>Peak</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-surface-secondary rounded-xl px-4 py-2">
              <span className="text-xs text-text-secondary">Work: {pm.workMin}m · Break: {pm.breakMin}m</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>

            <button onClick={startTimer}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-accent text-accent-foreground font-semibold text-sm">
              <Play className="w-4 h-4" />
              Start Deep Work
            </button>
          </div>
        )}

        {/* Today's sessions */}
        {sessions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Today's Sessions</h3>
            {sessions.map(s => <SessionCard key={s.id ?? s.start_time} s={s} />)}
          </div>
        )}

        {sessions.length === 0 && phase === 'idle' && (
          <div className="text-center py-8 text-text-secondary text-sm">
            <Crosshair className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No sessions today. Start your first deep work block.</p>
            <p className="text-xs text-text-muted mt-1">Newport recommends 4h of deep work per day.</p>
          </div>
        )}

        {/* Newport ritual card */}
        {analysis.recommendations.length > 0 && (
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Deep Work Recommendations
            </h3>
            {analysis.recommendations.map((r, i) => (
              <p key={i} className="text-xs text-text-secondary">• {r}</p>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Analytics Tab ──────────────────────────────────────────────────────────
  const AnalyticsTab = () => {
    const allDistractions = sessions.flatMap(s => s.distractions)
    const totalRecovery = allDistractions.reduce((s, d) => s + d.recovery_min, 0)
    const todayDistrBreakdown = (() => {
      const c: Partial<Record<DistractionCategory, number>> = {}
      for (const d of allDistractions) c[d.category] = (c[d.category] ?? 0) + 1
      return Object.entries(c).map(([k, v]) => ({ name: DISTRACTION_CATEGORIES[k as DistractionCategory].label, value: v }))
    })()

    const heatmapActive = hourlyHeatmap.filter(h => h.sessionCount > 0)
    const maxQ = Math.max(...hourlyHeatmap.map(h => h.avgQuality), 1)

    return (
      <div className="space-y-5">
        {/* Today's distraction stats */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Today's Distractions</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-surface-secondary rounded-xl p-3">
              <p className="text-xl font-bold text-amber-400">{allDistractions.length}</p>
              <p className="text-[10px] text-text-secondary">Total</p>
            </div>
            <div className="bg-surface-secondary rounded-xl p-3">
              <p className="text-xl font-bold text-text-primary">
                {analysis.totalDeepWorkMin > 0 ? (allDistractions.length / (analysis.totalDeepWorkMin / 60)).toFixed(1) : '0'}
              </p>
              <p className="text-[10px] text-text-secondary">Per Hour</p>
            </div>
            <div className="bg-surface-secondary rounded-xl p-3">
              <p className="text-xl font-bold text-red-400">{totalRecovery}m</p>
              <p className="text-[10px] text-text-secondary">Lost</p>
            </div>
          </div>
          {totalRecovery > 0 && (
            <p className="text-xs text-text-secondary mt-3">
              ⚠️ Mark et al. 2008: each interruption costs ~23 min of full focus recovery.
            </p>
          )}
        </div>

        {/* Today's distraction category (donut) */}
        {todayDistrBreakdown.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Distraction Breakdown (Today)</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={todayDistrBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={32} outerRadius={52}>
                    {todayDistrBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1">
                {todayDistrBreakdown.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-text-secondary flex-1">{d.name}</span>
                    <span className="text-text-primary font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Best focus hour heatmap */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Best Focus Hours</h3>
          <p className="text-xs text-text-secondary mb-3">14-day rolling avg quality by hour</p>
          {heatmapActive.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-4">No data yet. Complete more sessions to see your peak hours.</p>
          ) : (
            <div className="grid grid-cols-6 gap-1">
              {hourlyHeatmap.filter((_, i) => i >= 5 && i <= 22).map(h => {
                const intensity = h.sessionCount > 0 ? h.avgQuality / maxQ : 0
                return (
                  <div key={h.hour} className="flex flex-col items-center gap-0.5">
                    <div
                      className="w-full h-8 rounded-lg transition-all"
                      style={{ background: `rgba(129,140,248,${intensity})`, border: '1px solid rgba(129,140,248,0.1)' }}
                      title={`${formatHour(h.hour)}: ${h.avgQuality} avg quality (${h.sessionCount} sessions)`}
                    />
                    <span className="text-[9px] text-text-muted">{h.hour < 12 ? `${h.hour}A` : `${h.hour - 12 || 12}P`}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 30-day distraction breakdown */}
        {distractionBreakdown.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">30-Day Distraction Sources</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={distractionBreakdown} dataKey="count" cx="50%" cy="50%" innerRadius={32} outerRadius={52}>
                    {distractionBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1">
                {distractionBreakdown.slice(0, 5).map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-lg leading-none">{d.icon}</span>
                    <span className="text-text-secondary flex-1">{d.label}</span>
                    <span className="text-text-primary font-medium">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Newport Deep Work Ritual Card */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">🏛️ Newport's Deep Work Rituals</h3>
          {[
            { title: 'Fixed Schedule', desc: 'Same time, same place. Ritual reduces cognitive start-up cost.' },
            { title: 'Pre-Work Routine', desc: '5-min routine: clear desk, make tea, write today\'s goal. Habit loop cue.' },
            { title: 'No Internet Rule', desc: 'During work blocks, disconnect all communication tools.' },
            { title: 'Shutdown Ritual', desc: 'Review tomorrow\'s plan. Symbolic end: "Shutdown complete." Prevents rumination.' },
          ].map((r, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
              <div>
                <p className="text-xs font-semibold text-text-primary">{r.title}</p>
                <p className="text-xs text-text-secondary">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Trends Tab ─────────────────────────────────────────────────────────────
  const TrendsTab = () => {
    const last14 = trend.slice(-14)
    const last30 = trend.slice(-30)

    const bestDow = [...dowData].sort((a, b) => b.avgQuality - a.avgQuality)[0]
    const bestHour = hourlyHeatmap.reduce((best, h) => (h.avgQuality > (best?.avgQuality ?? 0) ? h : best), hourlyHeatmap[0])

    return (
      <div className="space-y-5">
        {/* Productivity patterns summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface border border-border rounded-2xl p-4 text-center">
            <p className="text-xs text-text-secondary mb-1">Best Day</p>
            <p className="text-xl font-bold text-text-primary">{bestDow?.count > 0 ? bestDow.day : '–'}</p>
            <p className="text-xs text-indigo-400">{bestDow?.count > 0 ? `${bestDow.avgQuality}/5 avg` : 'No data'}</p>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-4 text-center">
            <p className="text-xs text-text-secondary mb-1">Peak Hour</p>
            <p className="text-xl font-bold text-text-primary">{bestHour?.sessionCount > 0 ? formatHour(bestHour.hour) : '–'}</p>
            <p className="text-xs text-indigo-400">{bestHour?.sessionCount > 0 ? `${bestHour.avgQuality}/5 avg` : 'No data'}</p>
          </div>
        </div>

        {/* 30-day Focus Score */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Focus Score (30 Days)</h3>
          {last30.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-6">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={last30}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Score']} labelFormatter={l => l} />
                <ReferenceLine y={85} stroke="#34d399" strokeDasharray="4 2" label={{ value: 'Elite', fontSize: 9, fill: '#34d399' }} />
                <ReferenceLine y={65} stroke="#818cf8" strokeDasharray="4 2" label={{ value: 'Strong', fontSize: 9, fill: '#818cf8' }} />
                <Line type="monotone" dataKey="focusScore" stroke="#818cf8" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily deep work minutes */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Daily Deep Work (30 Days)</h3>
          {last30.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-6">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={last30}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => `${Math.floor(v / 60)}h`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatDuration(v), 'Deep Work']} />
                <ReferenceLine y={240} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: '4h goal', fontSize: 9, fill: '#f59e0b' }} />
                <Bar dataKey="totalDeepWorkMin" fill="#818cf8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Avg quality trend */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Avg Session Quality (14 Days)</h3>
          {last14.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-6">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={last14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Quality']} />
                <Line type="monotone" dataKey="avgQuality" stroke="#34d399" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distraction rate trend */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Distraction Rate Trend</h3>
          <p className="text-xs text-text-secondary mb-3">Lower is better — target &lt;2/hour</p>
          {last14.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-6">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={last14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}/hr`, 'Distractions']} />
                <ReferenceLine y={2} stroke="#34d399" strokeDasharray="4 2" label={{ value: 'Target', fontSize: 9, fill: '#34d399' }} />
                <Line type="monotone" dataKey="distractionsPerHour" stroke="#f87171" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Flow sessions per week */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Flow Sessions per Week</h3>
          {flowByWeek.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-6">No flow data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={flowByWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="week" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Flow Sessions']} />
                <Bar dataKey="count" fill="#a78bfa" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Best day of week */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Quality by Day of Week</h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={dowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Avg Quality']} />
              <Bar dataKey="avgQuality" fill="#60a5fa" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Active timer overlay */}
      {(phase === 'working' || phase === 'break') && activeSession && (
        <ActiveTimerScreen
          session={activeSession}
          phase={phase}
          secondsLeft={secondsLeft}
          paused={paused}
          onPause={() => setPaused(p => !p)}
          onEnd={handleEndSession}
          onDistraction={() => setShowDistractionLogger(true)}
          onToggleFlow={handleToggleFlow}
        />
      )}

      {/* Distraction logger */}
      {showDistractionLogger && (
        <DistractionLogger
          onLog={handleDistraction}
          onClose={() => setShowDistractionLogger(false)}
        />
      )}

      {/* Post-session form */}
      {showPostSession && activeSession && (
        <PostSessionForm
          session={activeSession}
          onSubmit={handleSaveSession}
          onDiscard={handleDiscard}
        />
      )}

      {saving && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
          <div className="bg-surface border border-border rounded-2xl px-8 py-5 text-text-primary text-sm font-medium">
            Saving session…
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 bg-surface border border-border rounded-2xl p-1 mb-5">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors ${tab === t.id ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:text-text-primary'}`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'focus'     && <FocusTab />}
      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'trends'    && <TrendsTab />}
    </>
  )
}
