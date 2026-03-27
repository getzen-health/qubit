'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  scoreReactionTime,
  scoreGoNoGo,
  scoreDigitSpan,
  compositeScore,
  compositeGrade,
  timeOfDay,
  type ReactionTimeResult,
  type GoNoGoResult,
  type DigitSpanResult,
} from '@/lib/cognitive-tests'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Brain, Zap, Shield, Hash, Coffee, Leaf, ChevronRight, RotateCcw } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'reaction' | 'gonogo' | 'digitspan'
type RTPhase = 'idle' | 'waiting' | 'ready' | 'done' | 'false_start' | 'summary'
type GNGPhase = 'idle' | 'running' | 'summary'
type DSMode = 'forward' | 'backward'
type DSPhase = 'idle' | 'showing' | 'input' | 'feedback' | 'summary'

interface TrendPoint {
  date: string
  score: number | null
}

interface StackEntry {
  caffeine_mg: number
  theanine_mg: number
  lion_mane: boolean
  bacopa: boolean
  ashwagandha: boolean
  focus_rating: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function gradeBadgeColor(grade: string) {
  if (grade === 'A') return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (grade === 'B') return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  if (grade === 'C') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  if (grade === 'D') return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

function scoreRingColor(score: number) {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#3b82f6'
  if (score >= 40) return '#eab308'
  if (score >= 20) return '#f97316'
  return '#ef4444'
}

function generateDigits(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1)
}

// ---------------------------------------------------------------------------
// Score Ring SVG
// ---------------------------------------------------------------------------

function ScoreRing({ score, label }: { score: number; label: string }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = scoreRingColor(score)
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={r} stroke="#ffffff10" strokeWidth={10} fill="none" />
        <circle
          cx={50}
          cy={50}
          r={r}
          stroke={color}
          strokeWidth={10}
          fill="none"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text x={50} y={54} textAnchor="middle" fontSize={20} fontWeight={700} fill={color}>
          {score}
        </text>
      </svg>
      <span className="text-[11px] text-text-secondary">{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reaction Time Test
// ---------------------------------------------------------------------------

const RT_TRIALS = 12
const RT_DISCARD = 2

function ReactionTimeTest({
  onComplete,
}: {
  onComplete: (result: ReactionTimeResult) => void
}) {
  const [phase, setPhase] = useState<RTPhase>('idle')
  const [trialIndex, setTrialIndex] = useState(0)
  const [trials, setTrials] = useState<number[]>([])
  const [dotColor, setDotColor] = useState('bg-gray-700')
  const [lastRT, setLastRT] = useState<number | null>(null)
  const [falseStarts, setFalseStarts] = useState(0)

  const startRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const startTrial = useCallback(() => {
    setPhase('waiting')
    setDotColor('bg-gray-700')
    setLastRT(null)
    const delay = 1500 + Math.random() * 2500
    timerRef.current = setTimeout(() => {
      setPhase('ready')
      setDotColor('bg-green-400')
      startRef.current = performance.now()
    }, delay)
  }, [])

  const handleTap = useCallback(() => {
    if (phase === 'waiting') {
      clearTimer()
      setFalseStarts((f) => f + 1)
      setPhase('false_start')
      setDotColor('bg-red-500')
      timerRef.current = setTimeout(startTrial, 1500)
      return
    }
    if (phase === 'ready') {
      const rt = Math.round(performance.now() - startRef.current)
      setLastRT(rt)
      const updated = [...trials, rt]
      setTrials(updated)
      const next = trialIndex + 1
      if (next >= RT_TRIALS) {
        setPhase('summary')
        setDotColor('bg-gray-700')
        const effective = updated.slice(RT_DISCARD)
        onComplete(scoreReactionTime(effective))
      } else {
        setTrialIndex(next)
        setPhase('done')
        setDotColor('bg-gray-700')
        timerRef.current = setTimeout(startTrial, 1000)
      }
    }
  }, [phase, trials, trialIndex, startTrial, onComplete])

  useEffect(() => () => clearTimer(), [])

  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-center space-y-2">
          <p className="text-text-secondary text-sm">Tap as fast as possible when the dot turns green.</p>
          <p className="text-text-secondary text-xs">12 trials · First 2 are practice · False starts add a penalty</p>
        </div>
        <button
          onClick={() => { setTrialIndex(0); setTrials([]); startTrial() }}
          className="px-6 py-3 bg-accent text-white rounded-2xl font-semibold text-sm"
        >
          Start Test
        </button>
      </div>
    )
  }

  if (phase === 'summary') {
    return (
      <div className="text-center py-6 space-y-2">
        <p className="text-green-400 font-semibold">All trials done!</p>
        <p className="text-text-secondary text-xs">Calculating results…</p>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center gap-6 py-6 select-none"
      onClick={handleTap}
      style={{ cursor: 'pointer' }}
    >
      <div className="text-xs text-text-secondary">
        Trial {Math.min(trialIndex + 1, RT_TRIALS)} / {RT_TRIALS}
        {trialIndex < RT_DISCARD && (
          <span className="ml-2 text-yellow-400">(practice)</span>
        )}
      </div>

      <div
        className={`w-24 h-24 rounded-full transition-colors duration-100 ${dotColor}`}
      />

      {phase === 'false_start' && (
        <p className="text-red-400 text-sm font-medium">Too early! Wait for green.</p>
      )}
      {phase === 'done' && lastRT && (
        <p className="text-text-secondary text-sm">{lastRT} ms</p>
      )}
      {phase === 'waiting' && (
        <p className="text-text-secondary text-xs">Wait for green…</p>
      )}
      {phase === 'ready' && (
        <p className="text-green-400 font-semibold text-sm animate-pulse">TAP!</p>
      )}
      <p className="text-text-secondary text-[11px]">False starts: {falseStarts}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Go / No-Go Test
// ---------------------------------------------------------------------------

const GNG_TRIALS = 30
const GNG_STIMULUS_MS = 800
const GNG_ISI_MS = 600

function GoNoGoTest({ onComplete }: { onComplete: (result: GoNoGoResult) => void }) {
  const [phase, setPhase] = useState<GNGPhase>('idle')
  const [trialNum, setTrialNum] = useState(0)
  const [stimulus, setStimulus] = useState<'go' | 'nogo' | 'blank'>('blank')
  const [results, setResults] = useState<
    { wasGo: boolean; responded: boolean; rt_ms?: number }[]
  >([])
  const [responded, setResponded] = useState(false)

  const trialStartRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultsRef = useRef(results)
  resultsRef.current = results

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const runTrial = useCallback((index: number) => {
    const isGo = Math.random() < 0.7
    setStimulus(isGo ? 'go' : 'nogo')
    setResponded(false)
    trialStartRef.current = performance.now()

    timerRef.current = setTimeout(() => {
      const didRespond = resultsRef.current.length > index
      const entry = resultsRef.current[index]
      if (!entry) {
        // no response recorded yet — record miss
        resultsRef.current = [
          ...resultsRef.current,
          { wasGo: isGo, responded: false },
        ]
      }
      setStimulus('blank')
      const next = index + 1
      if (next >= GNG_TRIALS) {
        setPhase('summary')
        onComplete(scoreGoNoGo(resultsRef.current))
      } else {
        timerRef.current = setTimeout(() => runTrial(next), GNG_ISI_MS)
      }
      setTrialNum(next)
    }, GNG_STIMULUS_MS)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete])

  const handleResponse = useCallback(() => {
    if (phase !== 'running' || stimulus === 'blank' || responded) return
    const rt_ms = Math.round(performance.now() - trialStartRef.current)
    const isGo = stimulus === 'go'
    setResponded(true)
    setResults((prev) => [...prev, { wasGo: isGo, responded: true, rt_ms }])
  }, [phase, stimulus, responded])

  useEffect(() => () => clearTimer(), [])

  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-center space-y-2">
          <p className="text-text-secondary text-sm">Tap on <span className="text-green-400 font-semibold">green</span> circles. Ignore <span className="text-red-400 font-semibold">red</span> circles.</p>
          <p className="text-text-secondary text-xs">30 trials · 70% green (GO) · 30% red (NO-GO)</p>
        </div>
        <button
          onClick={() => {
            setTrialNum(0)
            setResults([])
            resultsRef.current = []
            setPhase('running')
            runTrial(0)
          }}
          className="px-6 py-3 bg-accent text-white rounded-2xl font-semibold text-sm"
        >
          Start Test
        </button>
      </div>
    )
  }

  if (phase === 'summary') {
    return (
      <div className="text-center py-6 space-y-2">
        <p className="text-green-400 font-semibold">Complete!</p>
        <p className="text-text-secondary text-xs">Scoring results…</p>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center gap-6 py-6 select-none"
      onClick={handleResponse}
      style={{ cursor: 'pointer' }}
    >
      <div className="text-xs text-text-secondary">Trial {trialNum + 1} / {GNG_TRIALS}</div>
      <div
        className={`w-24 h-24 rounded-full transition-colors duration-75 ${
          stimulus === 'go'
            ? 'bg-green-400'
            : stimulus === 'nogo'
            ? 'bg-red-400'
            : 'bg-transparent border-2 border-border'
        }`}
      />
      <p className="text-text-secondary text-xs">
        {stimulus === 'go' && 'TAP!'}
        {stimulus === 'nogo' && 'HOLD!'}
        {stimulus === 'blank' && 'Get ready…'}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Digit Span Test
// ---------------------------------------------------------------------------

function DigitSpanTest({ onComplete }: { onComplete: (result: DigitSpanResult) => void }) {
  const [phase, setPhase] = useState<DSPhase>('idle')
  const [mode, setMode] = useState<DSMode>('forward')
  const [spanLength, setSpanLength] = useState(3)
  const [sequence, setSequence] = useState<number[]>([])
  const [showIndex, setShowIndex] = useState(-1)
  const [inputValue, setInputValue] = useState('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [consecutiveFails, setConsecutiveFails] = useState(0)
  const [maxForward, setMaxForward] = useState(0)
  const [maxBackward, setMaxBackward] = useState(0)
  const [forwardDone, setForwardDone] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const showSequence = useCallback((seq: number[]) => {
    setSequence(seq)
    setShowIndex(0)
    setPhase('showing')
    let i = 0
    const showNext = () => {
      if (i < seq.length) {
        setShowIndex(i)
        i++
        timerRef.current = setTimeout(showNext, 1000)
      } else {
        setShowIndex(-1)
        setPhase('input')
        setInputValue('')
      }
    }
    timerRef.current = setTimeout(showNext, 800)
  }, [])

  const startRound = useCallback(
    (length: number, currentMode: DSMode) => {
      const seq = generateDigits(length)
      showSequence(seq)
    },
    [showSequence]
  )

  const handleSubmit = useCallback(() => {
    const answer = inputValue.replace(/\s/g, '').split('').map(Number)
    const expected = mode === 'backward' ? [...sequence].reverse() : sequence
    const correct = answer.length === expected.length && answer.every((d, i) => d === expected[i])

    setIsCorrect(correct)
    setPhase('feedback')

    if (correct) {
      if (mode === 'forward') setMaxForward(spanLength)
      else setMaxBackward(spanLength)
      setConsecutiveFails(0)
      timerRef.current = setTimeout(() => {
        startRound(spanLength + 1, mode)
        setSpanLength((s) => s + 1)
        setConsecutiveFails(0)
      }, 1200)
    } else {
      const newFails = consecutiveFails + 1
      setConsecutiveFails(newFails)
      if (newFails >= 2) {
        if (mode === 'forward' && !forwardDone) {
          setForwardDone(true)
          setMode('backward')
          setSpanLength(3)
          setConsecutiveFails(0)
          timerRef.current = setTimeout(() => startRound(3, 'backward'), 1500)
        } else {
          setPhase('summary')
          onComplete(
            scoreDigitSpan(
              mode === 'forward' ? spanLength - 1 : maxForward,
              mode === 'backward' ? spanLength - 1 : maxBackward
            )
          )
        }
      } else {
        timerRef.current = setTimeout(() => startRound(spanLength, mode), 1200)
      }
    }
  }, [inputValue, sequence, mode, spanLength, consecutiveFails, forwardDone, maxForward, maxBackward, startRound, onComplete])

  useEffect(() => () => clearTimer(), [])

  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-center space-y-2">
          <p className="text-text-secondary text-sm">Digits appear one per second. Then type them in order.</p>
          <p className="text-text-secondary text-xs">Forward mode first, then backward (reverse order).</p>
          <p className="text-text-secondary text-xs">Test stops after 2 consecutive failures per mode.</p>
        </div>
        <button
          onClick={() => {
            setSpanLength(3)
            setConsecutiveFails(0)
            setForwardDone(false)
            setMode('forward')
            setMaxForward(0)
            setMaxBackward(0)
            startRound(3, 'forward')
          }}
          className="px-6 py-3 bg-accent text-white rounded-2xl font-semibold text-sm"
        >
          Start Test
        </button>
      </div>
    )
  }

  if (phase === 'summary') {
    return (
      <div className="text-center py-6 space-y-2">
        <p className="text-green-400 font-semibold">Complete!</p>
        <p className="text-text-secondary text-xs">Scoring results…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="flex items-center gap-3 text-xs text-text-secondary">
        <span className={mode === 'forward' ? 'text-accent font-semibold' : ''}>Forward</span>
        <span>/</span>
        <span className={mode === 'backward' ? 'text-accent font-semibold' : ''}>Backward</span>
        <span className="ml-2">Span: {spanLength}</span>
      </div>

      {phase === 'showing' && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-text-secondary text-xs">Remember these digits{mode === 'backward' ? " (you'll type them backwards)" : ''}:</p>
          <div className="text-6xl font-mono font-bold text-accent">
            {showIndex >= 0 ? sequence[showIndex] : '·'}
          </div>
          <div className="flex gap-1">
            {sequence.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i < showIndex ? 'bg-accent' : i === showIndex ? 'bg-green-400' : 'bg-border'}`}
              />
            ))}
          </div>
        </div>
      )}

      {phase === 'input' && (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <p className="text-text-secondary text-sm">
            {mode === 'backward' ? 'Type digits in reverse order' : 'Type the digits in order'}
          </p>
          <input
            autoFocus
            type="tel"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full text-center text-2xl font-mono py-3 px-4 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent tracking-widest"
            placeholder="···"
            maxLength={spanLength}
          />
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-accent text-white rounded-xl font-semibold text-sm"
          >
            Submit
          </button>
        </div>
      )}

      {phase === 'feedback' && (
        <div className="text-center">
          {isCorrect ? (
            <p className="text-green-400 font-semibold">Correct! ✓</p>
          ) : (
            <p className="text-red-400 font-semibold">
              Incorrect. Expected: {mode === 'backward' ? [...sequence].reverse().join(' ') : sequence.join(' ')}
            </p>
          )}
          <p className="text-text-secondary text-xs mt-1">
            Fail streak: {consecutiveFails}/2
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cognitive Stack Logger
// ---------------------------------------------------------------------------

function CognitiveStack() {
  const [stack, setStack] = useState<StackEntry>({
    caffeine_mg: 0,
    theanine_mg: 0,
    lion_mane: false,
    bacopa: false,
    ashwagandha: false,
    focus_rating: 5,
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => setSaved(true)

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
        <Leaf className="w-4 h-4 text-green-400" />
        Cognitive Stack
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-xl p-3 space-y-1">
          <label className="text-xs text-text-secondary flex items-center gap-1">
            <Coffee className="w-3 h-3" /> Caffeine (mg)
          </label>
          <input
            type="number"
            min={0}
            max={800}
            value={stack.caffeine_mg || ''}
            onChange={(e) => setStack({ ...stack, caffeine_mg: Number(e.target.value) })}
            className="w-full bg-transparent text-text-primary text-sm focus:outline-none"
            placeholder="0"
          />
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 space-y-1">
          <label className="text-xs text-text-secondary">L-Theanine (mg)</label>
          <input
            type="number"
            min={0}
            max={600}
            value={stack.theanine_mg || ''}
            onChange={(e) => setStack({ ...stack, theanine_mg: Number(e.target.value) })}
            className="w-full bg-transparent text-text-primary text-sm focus:outline-none"
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['lion_mane', 'bacopa', 'ashwagandha'] as const).map((key) => {
          const labels = { lion_mane: "Lion's Mane", bacopa: 'Bacopa', ashwagandha: 'Ashwagandha' }
          return (
            <button
              key={key}
              onClick={() => setStack({ ...stack, [key]: !stack[key] })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                stack[key]
                  ? 'bg-green-500/20 border-green-500/40 text-green-400'
                  : 'bg-surface border-border text-text-secondary'
              }`}
            >
              {labels[key]}
            </button>
          )
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-text-secondary">Subjective Focus</label>
          <span className="text-xs font-semibold text-accent">{stack.focus_rating}/10</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={stack.focus_rating}
          onChange={(e) => setStack({ ...stack, focus_rating: Number(e.target.value) })}
          className="w-full accent-[var(--accent)]"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-text-primary hover:border-accent/50 transition-colors"
      >
        {saved ? '✓ Saved' : 'Log Stack'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Results Summary Card
// ---------------------------------------------------------------------------

function ResultsSummary({
  rt,
  gng,
  ds,
  onSave,
  saving,
}: {
  rt?: ReactionTimeResult
  gng?: GoNoGoResult
  ds?: DigitSpanResult
  onSave: () => void
  saving: boolean
}) {
  const score = compositeScore(rt, gng, ds)
  const grade = compositeGrade(score)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ScoreRing score={score} label="Composite" />
        <div className="flex flex-col gap-2 text-right">
          <span className={`px-3 py-1 rounded-full text-sm font-bold border ${gradeBadgeColor(grade)}`}>
            Grade {grade}
          </span>
          <span className="text-xs text-text-secondary">{timeOfDay()} session</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {rt && (
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-text-primary">{rt.mean_ms}ms</p>
            <p className="text-[10px] text-text-secondary">{rt.category}</p>
          </div>
        )}
        {gng && (
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <Shield className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-text-primary">{gng.inhibition_score}%</p>
            <p className="text-[10px] text-text-secondary">Inhibition</p>
          </div>
        )}
        {ds && (
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <Hash className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-text-primary">{ds.max_forward_span}</p>
            <p className="text-[10px] text-text-secondary">{ds.category}</p>
          </div>
        )}
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full py-3 bg-accent text-white rounded-2xl font-semibold text-sm disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Results'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CognitivePage() {
  const [activeTab, setActiveTab] = useState<Tab>('reaction')
  const [rtResult, setRtResult] = useState<ReactionTimeResult | undefined>()
  const [gngResult, setGngResult] = useState<GoNoGoResult | undefined>()
  const [dsResult, setDsResult] = useState<DigitSpanResult | undefined>()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [timeOfDayAvg, setTimeOfDayAvg] = useState<Record<string, number>>({})
  const [history, setHistory] = useState<{ assessed_at: string; total_score: number }[]>([])
  const [rtKey, setRtKey] = useState(0)
  const [gngKey, setGngKey] = useState(0)
  const [dsKey, setDsKey] = useState(0)

  useEffect(() => {
    fetch('/api/cognitive')
      .then((r) => r.json())
      .then((d) => {
        setTrend(d.trend ?? [])
        setTimeOfDayAvg(d.timeOfDayAvg ?? {})
        setHistory(d.assessments ?? [])
      })
      .catch(() => {})
  }, [saved])

  const handleSave = async () => {
    if (!rtResult && !gngResult && !dsResult) return
    setSaving(true)
    const score = compositeScore(rtResult, gngResult, dsResult)
    try {
      await fetch('/api/cognitive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_score: score,
          reaction_time_ms: rtResult?.mean_ms,
          go_no_go_score: gngResult?.score,
          digit_span: dsResult?.max_forward_span,
          time_of_day: timeOfDay(),
          results: { reaction_time: rtResult, go_no_go: gngResult, digit_span: dsResult },
        }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; done: boolean }[] = [
    { key: 'reaction', label: 'Reaction', icon: <Zap className="w-4 h-4" />, done: !!rtResult },
    { key: 'gonogo', label: 'Go/No-Go', icon: <Shield className="w-4 h-4" />, done: !!gngResult },
    { key: 'digitspan', label: 'Digit Span', icon: <Hash className="w-4 h-4" />, done: !!dsResult },
  ]

  const todPairs = Object.entries(timeOfDayAvg).sort((a, b) => b[1] - a[1])
  const bestTime = todPairs[0]
  const worstTime = todPairs[todPairs.length - 1]
  const todInsight =
    bestTime && worstTime && bestTime[0] !== worstTime[0]
      ? `You score ${bestTime[1] - worstTime[1]}pts higher in the ${bestTime[0]}.`
      : null

  const yesterday = history[1]?.total_score
  const today = history[0]?.total_score
  const delta = today != null && yesterday != null ? today - yesterday : null

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <Brain className="w-5 h-5 text-accent" />
          <h1 className="text-base font-bold text-text-primary">Cognitive Performance</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Quick stats row */}
        {(today != null || trend.length > 0) && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-surface border border-border rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-text-primary">{today ?? '—'}</p>
              <p className="text-[10px] text-text-secondary">Today</p>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-3 text-center">
              <p className={`text-lg font-bold ${delta == null ? 'text-text-primary' : delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {delta == null ? '—' : delta >= 0 ? `+${delta}` : `${delta}`}
              </p>
              <p className="text-[10px] text-text-secondary">vs Yesterday</p>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-text-primary">
                {trend.length > 0
                  ? Math.round(trend.reduce((s, t) => s + (t.score ?? 0), 0) / trend.length)
                  : '—'}
              </p>
              <p className="text-[10px] text-text-secondary">7-day avg</p>
            </div>
          </div>
        )}

        {/* Time-of-day insight */}
        {todInsight && (
          <div className="bg-accent/10 border border-accent/20 rounded-2xl px-4 py-3">
            <p className="text-sm text-accent">{todInsight}</p>
          </div>
        )}

        {/* 30-day trend chart */}
        {trend.length > 1 && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wide">30-Day Trend</p>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={trend}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v}`, 'Score']}
                />
                <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Test Suite */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors relative ${
                  activeTab === t.key
                    ? 'text-accent border-b-2 border-accent bg-accent/5'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {t.icon}
                {t.label}
                {t.done && (
                  <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-green-400" />
                )}
              </button>
            ))}
          </div>

          {/* Test content */}
          <div className="p-4">
            {activeTab === 'reaction' && (
              <div className="space-y-3">
                {rtResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-text-primary">{rtResult.mean_ms} ms</p>
                        <p className="text-xs text-text-secondary">{rtResult.category} · {rtResult.percentile}th percentile</p>
                      </div>
                      <button onClick={() => { setRtResult(undefined); setRtKey((k) => k + 1) }} className="p-2 rounded-xl bg-surface-secondary border border-border text-text-secondary hover:text-text-primary">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {rtResult.trials.map((t, i) => (
                        <span key={i} className="text-[10px] bg-surface-secondary rounded px-1.5 py-0.5 text-text-secondary font-mono">
                          {t}ms
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div><p className="font-semibold text-text-primary">{rtResult.median_ms}ms</p><p className="text-text-secondary">Median</p></div>
                      <div><p className="font-semibold text-text-primary">±{rtResult.std_dev}ms</p><p className="text-text-secondary">Std Dev</p></div>
                      <div><p className="font-semibold text-text-primary">{rtResult.score}/25</p><p className="text-text-secondary">Score</p></div>
                    </div>
                  </div>
                ) : (
                  <ReactionTimeTest key={rtKey} onComplete={setRtResult} />
                )}
              </div>
            )}

            {activeTab === 'gonogo' && (
              <div className="space-y-3">
                {gngResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-text-primary">{gngResult.inhibition_score}%</p>
                        <p className="text-xs text-text-secondary">Inhibition accuracy</p>
                      </div>
                      <button onClick={() => { setGngResult(undefined); setGngKey((k) => k + 1) }} className="p-2 rounded-xl bg-surface-secondary border border-border text-text-secondary hover:text-text-primary">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-surface-secondary rounded-xl p-2">
                        <p className="font-semibold text-text-primary">{gngResult.commission_errors}</p>
                        <p className="text-text-secondary">False Alarms</p>
                      </div>
                      <div className="bg-surface-secondary rounded-xl p-2">
                        <p className="font-semibold text-text-primary">{gngResult.omission_errors}</p>
                        <p className="text-text-secondary">Misses</p>
                      </div>
                      <div className="bg-surface-secondary rounded-xl p-2">
                        <p className="font-semibold text-text-primary">{gngResult.avg_rt_ms}ms</p>
                        <p className="text-text-secondary">Avg RT</p>
                      </div>
                      <div className="bg-surface-secondary rounded-xl p-2">
                        <p className="font-semibold text-text-primary">{gngResult.score}/25</p>
                        <p className="text-text-secondary">Score</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <GoNoGoTest key={gngKey} onComplete={setGngResult} />
                )}
              </div>
            )}

            {activeTab === 'digitspan' && (
              <div className="space-y-3">
                {dsResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-text-primary">Span {dsResult.max_forward_span}</p>
                        <p className="text-xs text-text-secondary">{dsResult.category}</p>
                      </div>
                      <button onClick={() => { setDsResult(undefined); setDsKey((k) => k + 1) }} className="p-2 rounded-xl bg-surface-secondary border border-border text-text-secondary hover:text-text-primary">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-surface-secondary rounded-xl p-2">
                        <p className="font-semibold text-text-primary">{dsResult.max_forward_span}</p>
                        <p className="text-text-secondary">Forward</p>
                      </div>
                      <div className="bg-surface-secondary rounded-xl p-2">
                        <p className="font-semibold text-text-primary">{dsResult.max_backward_span}</p>
                        <p className="text-text-secondary">Backward</p>
                      </div>
                      <div className="bg-surface-secondary rounded-xl p-2">
                        <p className="font-semibold text-text-primary">{dsResult.score}/25</p>
                        <p className="text-text-secondary">Score</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <DigitSpanTest key={dsKey} onComplete={setDsResult} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results dashboard - shown when at least one test complete */}
        {(rtResult || gngResult || dsResult) && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Session Results</p>
            <ResultsSummary
              rt={rtResult}
              gng={gngResult}
              ds={dsResult}
              onSave={handleSave}
              saving={saving}
            />
            {saved && (
              <p className="text-green-400 text-xs text-center mt-2">Saved to your health record ✓</p>
            )}
          </div>
        )}

        {/* Cognitive Stack */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <CognitiveStack />
        </div>

        {/* Recent history */}
        {history.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recent Assessments</p>
            {history.slice(0, 7).map((h) => {
              const grade = compositeGrade(h.total_score ?? 0)
              return (
                <div key={h.assessed_at} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-xs text-text-secondary">
                    {new Date(h.assessed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">{h.total_score ?? '—'}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${gradeBadgeColor(grade)}`}>{grade}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Research note */}
        <div className="text-[11px] text-text-secondary space-y-1 px-1">
          <p>Reaction time: Oken et al. (2006). Go/No-Go: Inhibitory control (Diamond 2013). Digit span: Miller (1956) — 7±2 digits working memory norm.</p>
          <p>Sleep &lt;6h reduces prefrontal function measurably (Walker 2017). Test in the morning for best baseline.</p>
        </div>
      </div>
    </div>
  )
}
