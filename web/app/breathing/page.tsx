"use client"
import { useState, useEffect, useRef, useCallback } from 'react'

interface BreathingPattern {
  id: string
  name: string
  emoji: string
  description: string
  benefit: string
  phases: { label: string; duration: number; color: string }[]
  cycles: number
}

const PATTERNS: BreathingPattern[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    emoji: '🟦',
    description: 'Used by Navy SEALs for stress control',
    benefit: 'Reduces cortisol, calms nervous system',
    phases: [
      { label: 'Inhale', duration: 4, color: '#6366f1' },
      { label: 'Hold', duration: 4, color: '#8b5cf6' },
      { label: 'Exhale', duration: 4, color: '#06b6d4' },
      { label: 'Hold', duration: 4, color: '#0891b2' },
    ],
    cycles: 8,
  },
  {
    id: '4-7-8',
    name: '4-7-8 Breathing',
    emoji: '😴',
    description: "Dr. Andrew Weil's sleep technique",
    benefit: 'Promotes sleep onset, reduces anxiety',
    phases: [
      { label: 'Inhale', duration: 4, color: '#6366f1' },
      { label: 'Hold', duration: 7, color: '#8b5cf6' },
      { label: 'Exhale', duration: 8, color: '#06b6d4' },
    ],
    cycles: 6,
  },
  {
    id: 'coherent',
    name: 'Coherent Breathing',
    emoji: '💓',
    description: '5 breaths per minute — HRV resonance',
    benefit: 'Maximizes HRV, deep relaxation',
    phases: [
      { label: 'Inhale', duration: 5.5, color: '#10b981' },
      { label: 'Exhale', duration: 5.5, color: '#059669' },
    ],
    cycles: 10,
  },
  {
    id: 'wim-hof',
    name: 'Wim Hof Breathing',
    emoji: '🧊',
    description: 'Power breathing followed by hold',
    benefit: 'Energizing, alkalizes blood, focus boost',
    phases: [
      { label: 'Deep Inhale', duration: 2, color: '#f59e0b' },
      { label: 'Release', duration: 1, color: '#d97706' },
    ],
    cycles: 30,
  },
]

type SessionState = 'idle' | 'mood-before' | 'active' | 'complete'

export default function BreathingPage() {
  const [selected, setSelected] = useState<BreathingPattern>(PATTERNS[0])
  const [state, setState] = useState<SessionState>('idle')
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)
  const [timeInPhase, setTimeInPhase] = useState(0)
  const [moodBefore, setMoodBefore] = useState<number | null>(null)
  const [moodAfter, setMoodAfter] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [stats, setStats] = useState<any>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/breathing').then(r => r.json()).then(setStats)
  }, [])

  const tick = useCallback(() => {
    setTimeInPhase(t => {
      const pattern = selected
      const phase = pattern.phases[phaseIdx]
      const phaseDuration = phase.duration

      if (t + 0.1 >= phaseDuration) {
        // Move to next phase
        const nextPhase = (phaseIdx + 1) % pattern.phases.length
        if (nextPhase === 0) {
          // Completed a cycle
          setCycleCount(c => {
            if (c + 1 >= pattern.cycles) {
              // Done!
              setState('complete')
              if (intervalRef.current) clearInterval(intervalRef.current)
              return c + 1
            }
            return c + 1
          })
        }
        setPhaseIdx(nextPhase)
        setElapsedSeconds(s => s + 1)
        return 0
      }
      setElapsedSeconds(s => s + 0.1)
      return t + 0.1
    })
  }, [selected, phaseIdx])

  useEffect(() => {
    if (state !== 'active') {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(tick, 100)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [state, tick])

  const startSession = () => {
    setPhaseIdx(0)
    setCycleCount(0)
    setTimeInPhase(0)
    setElapsedSeconds(0)
    setState('active')
  }

  const saveSession = async (after: number) => {
    setMoodAfter(after)
    const totalDuration = Math.round(
      selected.phases.reduce((s, p) => s + p.duration, 0) * selected.cycles
    )
    await fetch('/api/breathing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pattern: selected.id,
        duration_seconds: totalDuration,
        cycles_completed: cycleCount,
        mood_before: moodBefore,
        mood_after: after,
      }),
    })
    // Refresh stats
    fetch('/api/breathing').then(r => r.json()).then(setStats)
    setState('idle')
    setCycleCount(0)
    setMoodBefore(null)
    setMoodAfter(null)
  }

  const currentPhase = selected.phases[phaseIdx]
  const progress = state === 'active' ? (timeInPhase / currentPhase.duration) * 100 : 0
  const circleSize = 180
  const r = 80
  const circumference = 2 * Math.PI * r
  const strokeOffset = circumference * (1 - progress / 100)

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Breathing</h1>
        <p className="text-sm text-text-secondary mb-6">Guided sessions for stress, sleep, and focus</p>

        {/* Stats row */}
        {stats && (
          <div className="flex gap-3 mb-6">
            <div className="flex-1 bg-white rounded-xl border border-border p-3 text-center">
              <div className="text-xl font-bold text-primary">{stats.total_sessions}</div>
              <div className="text-xs text-text-secondary">Sessions</div>
            </div>
            <div className="flex-1 bg-white rounded-xl border border-border p-3 text-center">
              <div className="text-xl font-bold text-primary">{stats.total_minutes}</div>
              <div className="text-xs text-text-secondary">Minutes</div>
            </div>
          </div>
        )}

        {/* Pattern selector */}
        {state === 'idle' && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {PATTERNS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`rounded-2xl border p-3 text-left transition-all ${selected.id === p.id ? 'border-primary bg-primary/5' : 'border-border bg-white'}`}
              >
                <div className="text-2xl mb-1">{p.emoji}</div>
                <div className="font-semibold text-text-primary text-sm">{p.name}</div>
                <div className="text-xs text-text-secondary mt-1">{p.benefit}</div>
              </button>
            ))}
          </div>
        )}

        {/* Pattern detail */}
        {state === 'idle' && (
          <div className="bg-white rounded-2xl border border-border p-4 mb-4">
            <div className="font-semibold text-text-primary mb-1">{selected.emoji} {selected.name}</div>
            <p className="text-sm text-text-secondary mb-3">{selected.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {selected.phases.map((ph, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {ph.label}: {ph.duration}s
                </span>
              ))}
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">×{selected.cycles} cycles</span>
            </div>
            <button onClick={() => setState('mood-before')} className="w-full bg-primary text-white py-3 rounded-xl font-semibold">
              Start Session
            </button>
          </div>
        )}

        {/* Mood before */}
        {state === 'mood-before' && (
          <div className="bg-white rounded-2xl border border-border p-6 text-center mb-4">
            <h3 className="font-semibold text-text-primary mb-2">How do you feel right now?</h3>
            <p className="text-sm text-text-secondary mb-4">Rate 1 (stressed) to 10 (relaxed)</p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button
                  key={n}
                  onClick={() => { setMoodBefore(n); startSession() }}
                  className="w-10 h-10 rounded-xl border border-border text-sm font-semibold hover:bg-primary hover:text-white hover:border-primary transition-all"
                >
                  {n}
                </button>
              ))}
            </div>
            <button onClick={startSession} className="text-sm text-text-secondary underline">Skip rating</button>
          </div>
        )}

        {/* Active breathing circle */}
        {state === 'active' && (
          <div className="flex flex-col items-center mb-4">
            <div className="relative mb-4" style={{ width: circleSize, height: circleSize }}>
              <svg width={circleSize} height={circleSize} className="-rotate-90">
                <circle cx={circleSize/2} cy={circleSize/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle
                  cx={circleSize/2} cy={circleSize/2} r={r}
                  fill="none"
                  stroke={currentPhase.color}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className="transition-all duration-100"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-text-primary">{currentPhase.label}</div>
                <div className="text-lg text-text-secondary">{Math.ceil(currentPhase.duration - timeInPhase)}s</div>
              </div>
            </div>
            <div className="text-sm text-text-secondary mb-1">Cycle {cycleCount + 1} of {selected.cycles}</div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${(cycleCount / selected.cycles) * 100}%` }} />
            </div>
            <button onClick={() => setState('idle')} className="text-sm text-text-secondary underline">Stop early</button>
          </div>
        )}

        {/* Complete */}
        {state === 'complete' && (
          <div className="bg-white rounded-2xl border border-border p-6 text-center mb-4">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="font-semibold text-text-primary mb-1">Session Complete!</h3>
            <p className="text-sm text-text-secondary mb-4">{selected.cycles} cycles · ~{Math.round(selected.phases.reduce((s,p) => s + p.duration, 0) * selected.cycles / 60)} minutes</p>
            <p className="text-sm font-medium text-text-primary mb-3">How do you feel now?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button
                  key={n}
                  onClick={() => saveSession(n)}
                  className="w-10 h-10 rounded-xl border border-border text-sm font-semibold hover:bg-green-500 hover:text-white hover:border-green-500 transition-all"
                >
                  {n}
                </button>
              ))}
            </div>
            <button onClick={() => { setState('idle'); saveSession(5) }} className="mt-3 text-sm text-text-secondary underline block w-full">Skip rating</button>
          </div>
        )}
      </div>
    </div>
  )
}
