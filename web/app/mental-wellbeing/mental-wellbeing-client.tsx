'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid,
} from 'recharts'
import {
  PHQ9_QUESTIONS, GAD7_QUESTIONS, WHO5_QUESTIONS, PERMA_QUESTIONS, CDRISC10_QUESTIONS,
  POSITIVE_INTERVENTIONS, CRISIS_RESOURCES, ALL_EMOTIONS,
  interpretPHQ9, interpretGAD7, interpretWHO5, interpretCDRISC10, interpretComposite,
  calculateWHO5, calculatePERMA, calculateWellbeingComposite, valenceToEmoji, valenceToColor,
  type MentalHealthAssessment, type PositiveIntervention, type InterventionCategory,
} from '@/lib/mental-wellbeing'
import { cn } from '@/lib/utils'
import { Brain, ChevronDown, ChevronUp, X, CheckCircle2, Flame, BarChart2, Smile, Dumbbell, BookOpen, Heart, Star } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MoodLog {
  id: string
  logged_at: string
  valence: number
  arousal: number
  emotions: string[]
  notes?: string
}

interface PageData {
  assessments: MentalHealthAssessment[]
  moods: MoodLog[]
  latestByType: Record<string, MentalHealthAssessment>
}

type TabId = 'checkin' | 'assessments' | 'insights' | 'growth'

// ─── Crisis Banner ────────────────────────────────────────────────────────────

function CrisisBanner() {
  return (
    <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm">
      <p className="font-semibold text-red-400">Crisis Resources — always available</p>
      <p className="mt-1 text-text-secondary">
        <span className="font-medium text-text-primary">{CRISIS_RESOURCES.us}</span>
        {' | '}
        <span className="font-medium text-text-primary">{CRISIS_RESOURCES.textLine}</span>
      </p>
      <p className="text-text-secondary">{CRISIS_RESOURCES.international}</p>
    </div>
  )
}

// ─── Valence/Arousal Grid ─────────────────────────────────────────────────────

function MoodGrid({
  valence, arousal, onChange,
}: { valence: number; arousal: number; onChange: (v: number, a: number) => void }) {
  const gridRef = useRef<HTMLDivElement>(null)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = gridRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newValence = Math.round(((x / rect.width) * 10) - 5)
    const newArousal = Math.round((((rect.height - y) / rect.height) * 10) - 5)
    onChange(
      Math.max(-5, Math.min(5, newValence)),
      Math.max(-5, Math.min(5, newArousal)),
    )
  }

  const dotX = ((valence + 5) / 10) * 100
  const dotY = 100 - ((arousal + 5) / 10) * 100

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-text-secondary px-1">
        <span>⚡ High Energy</span>
      </div>
      <div
        ref={gridRef}
        className="relative w-full h-48 rounded-2xl border border-border bg-surface cursor-crosshair select-none overflow-hidden"
        onClick={handleClick}
        role="button"
        aria-label="Mood grid — click to set valence and arousal"
      >
        {/* Quadrant labels */}
        <span className="absolute top-2 left-3 text-[10px] text-text-secondary">Tense / Distressed</span>
        <span className="absolute top-2 right-3 text-[10px] text-text-secondary">Alert / Excited</span>
        <span className="absolute bottom-2 left-3 text-[10px] text-text-secondary">Sad / Fatigued</span>
        <span className="absolute bottom-2 right-3 text-[10px] text-text-secondary">Calm / Relaxed</span>

        {/* Axes */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-border/60" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-border/60" />

        {/* Dot */}
        <div
          className="absolute w-5 h-5 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
          style={{
            left: `${dotX}%`,
            top: `${dotY}%`,
            backgroundColor: valenceToColor(valence),
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-text-secondary px-1">
        <span>😴 Low Energy</span>
        <span>← Negative · Positive →</span>
      </div>
      <div className="flex justify-between text-xs text-text-secondary mt-1">
        <span>Valence: <strong className="text-text-primary">{valence > 0 ? `+${valence}` : valence}</strong></span>
        <span>Arousal: <strong className="text-text-primary">{arousal > 0 ? `+${arousal}` : arousal}</strong></span>
      </div>
    </div>
  )
}

// ─── Assessment Modal ─────────────────────────────────────────────────────────

interface AssessmentModalProps {
  title: string
  questions: { id: string; text: string; options: { label: string; value: number }[] }[]
  onClose: () => void
  onSubmit: (answers: number[]) => void
}

function AssessmentModal({ title, questions, onClose, onSubmit }: AssessmentModalProps) {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
  const allAnswered = answers.every(a => a !== null)

  const handleSubmit = () => {
    if (!allAnswered) return
    onSubmit(answers as number[])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-background rounded-2xl border border-border shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-secondary" aria-label="Close">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-6">
          {questions.map((q, i) => (
            <div key={q.id} className="space-y-2">
              <p className="text-sm font-medium text-text-primary">
                <span className="text-text-secondary mr-2">{i + 1}.</span>{q.text}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      const next = [...answers]
                      next[i] = opt.value
                      setAnswers(next)
                    }}
                    className={cn(
                      'text-xs px-3 py-2 rounded-xl border transition-colors text-left',
                      answers[i] === opt.value
                        ? 'bg-accent/10 border-accent/40 text-accent font-medium'
                        : 'bg-surface border-border text-text-secondary hover:text-text-primary',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="w-full py-3 rounded-2xl bg-accent text-white font-semibold disabled:opacity-40 transition-opacity"
          >
            Submit Assessment
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Score Gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score, size = 120 }: { score: number; size?: number }) {
  const interpretation = interpretComposite(score)
  const radius = (size - 16) / 2
  const circumference = Math.PI * radius // semicircle
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={`M 8 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2}`}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M 8 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2}`}
          fill="none"
          stroke={interpretation.color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        {/* Score text */}
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fontSize="24" fontWeight="bold" fill="currentColor">
          {score}
        </text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontSize="10" fill="hsl(var(--text-secondary))">
          {interpretation.emoji} {interpretation.label}
        </text>
      </svg>
    </div>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color = '#818cf8' }: { data: number[]; color?: string }) {
  if (data.length < 2) return <span className="text-xs text-text-secondary">No trend data</span>
  const chartData = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Check-In Tab ─────────────────────────────────────────────────────────────

function CheckInTab({ moods, onRefresh }: { moods: MoodLog[]; onRefresh: () => void }) {
  const [valence, setValence] = useState(0)
  const [arousal, setArousal] = useState(0)
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const todayMoods = moods.filter(m => m.logged_at.startsWith(new Date().toISOString().slice(0, 10)))
  const latestToday = todayMoods[0]

  const toggleEmotion = (e: string) => {
    setSelectedEmotions(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e],
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/mental-wellbeing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'mood', valence, arousal, emotions: selectedEmotions, notes }),
      })
      setSaved(true)
      setNotes('')
      setSelectedEmotions([])
      onRefresh()
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Today's summary */}
      {latestToday && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-text-secondary mb-2">Latest check-in today</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{valenceToEmoji(latestToday.valence)}</span>
            <div>
              <p className="text-sm font-medium text-text-primary">
                Valence {latestToday.valence > 0 ? '+' : ''}{latestToday.valence} · Arousal {latestToday.arousal > 0 ? '+' : ''}{latestToday.arousal}
              </p>
              {latestToday.emotions.length > 0 && (
                <p className="text-xs text-text-secondary">{latestToday.emotions.slice(0, 5).join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mood Grid */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
        <h3 className="font-semibold text-text-primary text-sm">How are you feeling right now?</h3>
        <MoodGrid
          valence={valence}
          arousal={arousal}
          onChange={(v, a) => { setValence(v); setArousal(a) }}
        />
      </div>

      {/* Emotion chips */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
        <h3 className="font-semibold text-text-primary text-sm">Select emotions</h3>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {ALL_EMOTIONS.map(e => (
            <button
              key={e}
              onClick={() => toggleEmotion(e)}
              className={cn(
                'text-xs px-3 py-1 rounded-full border transition-colors',
                selectedEmotions.includes(e)
                  ? 'bg-accent/10 border-accent/40 text-accent'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary',
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
        <h3 className="font-semibold text-text-primary text-sm">Notes (optional)</h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-secondary resize-none outline-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-2xl bg-accent text-white font-semibold disabled:opacity-50"
      >
        {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Log Mood'}
      </button>

      <CrisisBanner />
    </div>
  )
}

// ─── Assessment Card ──────────────────────────────────────────────────────────

interface AssessmentCardProps {
  label: string
  subtitle: string
  latest?: MentalHealthAssessment
  trend: number[]
  scoreLabel: (s: number) => { label: string; color: string }
  onTake: () => void
  maxScore: number
}

function AssessmentCard({ label, subtitle, latest, trend, scoreLabel, onTake, maxScore }: AssessmentCardProps) {
  const [open, setOpen] = useState(false)
  const score = latest ? (latest.composite_score ?? Object.values(latest.scores as Record<string, number>).reduce((a, b) => a + b, 0)) : null
  const interp = score !== null ? scoreLabel(score) : null

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">{label}</span>
            {interp && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: interp.color + '22', color: interp.color }}
              >
                {interp.label}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {score !== null && (
            <span className="text-lg font-bold text-text-primary">{score}<span className="text-xs text-text-secondary">/{maxScore}</span></span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {trend.length >= 2 && (
            <div>
              <p className="text-xs text-text-secondary mb-1">30-day trend</p>
              <Sparkline data={trend} color={interp?.color} />
            </div>
          )}
          {!latest && <p className="text-sm text-text-secondary">No assessment recorded yet.</p>}
          {latest && (
            <p className="text-xs text-text-secondary">
              Last taken: {new Date(latest.date).toLocaleDateString()}
            </p>
          )}
          <button
            onClick={onTake}
            className="w-full py-2 rounded-xl border border-accent/40 text-accent text-sm font-medium hover:bg-accent/10 transition-colors"
          >
            Take Assessment
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Assessments Tab ──────────────────────────────────────────────────────────

type ModalKey = 'phq9' | 'gad7' | 'who5' | 'perma_cdrisc' | null

function AssessmentsTab({ data, onRefresh }: { data: PageData; onRefresh: () => void }) {
  const [modal, setModal] = useState<ModalKey>(null)
  const [compositeSaving, setCompositeSaving] = useState(false)

  const getScoreTrend = (type: string) =>
    data.assessments
      .filter(a => a.assessment_type === type)
      .slice(0, 10)
      .reverse()
      .map(a => a.composite_score ?? 0)

  const compositeLatest = data.latestByType['composite']
  const compositeScore = compositeLatest?.composite_score ?? null

  const handleSubmitPHQ9 = async (answers: number[]) => {
    const total = answers.reduce((a, b) => a + b, 0)
    const scores = Object.fromEntries(PHQ9_QUESTIONS.map((q, i) => [q.id, answers[i]]))
    await fetch('/api/mental-wellbeing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'assessment', assessment_type: 'phq9', scores, composite_score: total }),
    })
    setModal(null)
    onRefresh()
  }

  const handleSubmitGAD7 = async (answers: number[]) => {
    const total = answers.reduce((a, b) => a + b, 0)
    const scores = Object.fromEntries(GAD7_QUESTIONS.map((q, i) => [q.id, answers[i]]))
    await fetch('/api/mental-wellbeing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'assessment', assessment_type: 'gad7', scores, composite_score: total }),
    })
    setModal(null)
    onRefresh()
  }

  const handleSubmitWHO5 = async (answers: number[]) => {
    const rawSum = answers.reduce((a, b) => a + b, 0)
    const scaled = calculateWHO5(rawSum)
    const scores = Object.fromEntries(WHO5_QUESTIONS.map((q, i) => [q.id, answers[i]]))
    await fetch('/api/mental-wellbeing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'assessment', assessment_type: 'who5', scores, composite_score: scaled }),
    })
    setModal(null)
    onRefresh()
  }

  const handleSubmitPERMAandCDRISC = async (answers: number[]) => {
    // First 15 answers = PERMA, last 10 = CD-RISC
    const permaAnswers = answers.slice(0, 15)
    const cdriscAnswers = answers.slice(15)

    const permaScores = Object.fromEntries(PERMA_QUESTIONS.map((q, i) => [q.id, permaAnswers[i]]))
    const cdriscScores = Object.fromEntries(CDRISC10_QUESTIONS.map((q, i) => [q.id, cdriscAnswers[i]]))
    const perma = calculatePERMA(permaAnswers)
    const cdriscTotal = cdriscAnswers.reduce((a, b) => a + b, 0)
    const permaScaled = Math.round(perma.overall * 10)
    const cdriscScaled = Math.round((cdriscTotal / 40) * 100)

    await Promise.all([
      fetch('/api/mental-wellbeing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'assessment', assessment_type: 'perma', scores: { ...permaScores, P: perma.P, E: perma.E, R: perma.R, M: perma.M, A: perma.A }, composite_score: permaScaled }),
      }),
      fetch('/api/mental-wellbeing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'assessment', assessment_type: 'cdrisc', scores: cdriscScores, composite_score: cdriscTotal }),
      }),
    ])
    setModal(null)
    onRefresh()
  }

  // Compute and save composite when all assessments present
  const handleComputeComposite = async () => {
    const phq9 = data.latestByType['phq9']
    const gad7 = data.latestByType['gad7']
    const who5 = data.latestByType['who5']
    const perma = data.latestByType['perma']
    const cdrisc = data.latestByType['cdrisc']

    if (!phq9 || !gad7 || !who5 || !perma || !cdrisc) return
    setCompositeSaving(true)

    const composite = calculateWellbeingComposite(
      who5.composite_score ?? 0,
      (perma.scores as Record<string, number>)['overall'] ?? (perma.composite_score ?? 0) / 10,
      cdrisc.composite_score ?? 0,
      phq9.composite_score ?? 0,
      gad7.composite_score ?? 0,
    )
    await fetch('/api/mental-wellbeing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'assessment', assessment_type: 'composite', scores: {}, composite_score: composite }),
    })
    setCompositeSaving(false)
    onRefresh()
  }

  const allAssessmentsAvailable = ['phq9', 'gad7', 'who5', 'perma', 'cdrisc'].every(t => data.latestByType[t])

  return (
    <div className="space-y-4">
      {/* Composite score */}
      <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col items-center gap-3">
        <p className="text-sm font-semibold text-text-primary">Composite Wellbeing Score</p>
        {compositeScore !== null ? (
          <ScoreGauge score={compositeScore} size={160} />
        ) : (
          <p className="text-sm text-text-secondary">Complete all assessments to see your score.</p>
        )}
        {allAssessmentsAvailable && (
          <button
            onClick={handleComputeComposite}
            disabled={compositeSaving}
            className="text-xs text-accent border border-accent/30 rounded-xl px-4 py-1.5 hover:bg-accent/10 transition-colors"
          >
            {compositeSaving ? 'Calculating…' : 'Recalculate Composite'}
          </button>
        )}
      </div>

      {/* Assessment cards */}
      <AssessmentCard
        label="PHQ-9"
        subtitle="Depression screener — 9 items · max 27"
        latest={data.latestByType['phq9']}
        trend={getScoreTrend('phq9')}
        scoreLabel={interpretPHQ9}
        onTake={() => setModal('phq9')}
        maxScore={27}
      />
      <AssessmentCard
        label="GAD-7"
        subtitle="Anxiety screener — 7 items · max 21"
        latest={data.latestByType['gad7']}
        trend={getScoreTrend('gad7')}
        scoreLabel={interpretGAD7}
        onTake={() => setModal('gad7')}
        maxScore={21}
      />
      <AssessmentCard
        label="WHO-5"
        subtitle="Wellbeing Index — 5 items · score 0–100"
        latest={data.latestByType['who5']}
        trend={getScoreTrend('who5')}
        scoreLabel={s => interpretWHO5(s)}
        onTake={() => setModal('who5')}
        maxScore={100}
      />
      <AssessmentCard
        label="PERMA + CD-RISC-10"
        subtitle="Flourishing model + Resilience — 25 items"
        latest={data.latestByType['perma']}
        trend={getScoreTrend('perma')}
        scoreLabel={s => ({ label: s >= 70 ? 'High' : s >= 50 ? 'Moderate' : 'Low', color: s >= 70 ? '#22c55e' : s >= 50 ? '#eab308' : '#ef4444' })}
        onTake={() => setModal('perma_cdrisc')}
        maxScore={100}
      />

      <CrisisBanner />

      {/* Modals */}
      {modal === 'phq9' && (
        <AssessmentModal
          title="PHQ-9 — Depression Screener"
          questions={PHQ9_QUESTIONS}
          onClose={() => setModal(null)}
          onSubmit={handleSubmitPHQ9}
        />
      )}
      {modal === 'gad7' && (
        <AssessmentModal
          title="GAD-7 — Anxiety Screener"
          questions={GAD7_QUESTIONS}
          onClose={() => setModal(null)}
          onSubmit={handleSubmitGAD7}
        />
      )}
      {modal === 'who5' && (
        <AssessmentModal
          title="WHO-5 — Wellbeing Index"
          questions={WHO5_QUESTIONS}
          onClose={() => setModal(null)}
          onSubmit={handleSubmitWHO5}
        />
      )}
      {modal === 'perma_cdrisc' && (
        <AssessmentModal
          title="PERMA (15 items) + CD-RISC-10 (10 items)"
          questions={[...PERMA_QUESTIONS, ...CDRISC10_QUESTIONS]}
          onClose={() => setModal(null)}
          onSubmit={handleSubmitPERMAandCDRISC}
        />
      )}
    </div>
  )
}

// ─── Insights Tab ─────────────────────────────────────────────────────────────

function InsightsTab({ data }: { data: PageData }) {
  // 30-day mood heatmap
  const today = new Date()
  const heatmapDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (29 - i))
    const dateStr = d.toISOString().slice(0, 10)
    const dayMoods = data.moods.filter(m => m.logged_at.startsWith(dateStr))
    const avgValence = dayMoods.length
      ? dayMoods.reduce((s, m) => s + m.valence, 0) / dayMoods.length
      : null
    return { date: dateStr, avgValence, count: dayMoods.length }
  })

  // Composite score over time
  const compositeTrend = data.assessments
    .filter(a => a.assessment_type === 'composite')
    .slice(0, 20)
    .reverse()
    .map(a => ({ date: a.date.slice(5), score: a.composite_score ?? 0 }))

  // PERMA radar
  const latestPerma = data.latestByType['perma']
  const permaRadar = latestPerma
    ? [
        { subject: 'P', value: Number(((latestPerma.scores as Record<string, number>)['P'] ?? 0) * 10), fullMark: 100 },
        { subject: 'E', value: Number(((latestPerma.scores as Record<string, number>)['E'] ?? 0) * 10), fullMark: 100 },
        { subject: 'R', value: Number(((latestPerma.scores as Record<string, number>)['R'] ?? 0) * 10), fullMark: 100 },
        { subject: 'M', value: Number(((latestPerma.scores as Record<string, number>)['M'] ?? 0) * 10), fullMark: 100 },
        { subject: 'A', value: Number(((latestPerma.scores as Record<string, number>)['A'] ?? 0) * 10), fullMark: 100 },
      ]
    : null

  // Emotion frequency
  const emotionCount: Record<string, number> = {}
  for (const m of data.moods) {
    for (const e of m.emotions) {
      emotionCount[e] = (emotionCount[e] || 0) + 1
    }
  }
  const topEmotions = Object.entries(emotionCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  // Mood by day of week
  const dayOfWeekMood: Record<number, number[]> = {}
  for (const m of data.moods) {
    const day = new Date(m.logged_at).getDay()
    if (!dayOfWeekMood[day]) dayOfWeekMood[day] = []
    dayOfWeekMood[day].push(m.valence)
  }
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const bestDay = Object.entries(dayOfWeekMood)
    .map(([day, vals]) => ({ day: Number(day), avg: vals.reduce((a, b) => a + b, 0) / vals.length }))
    .sort((a, b) => b.avg - a.avg)[0]

  return (
    <div className="space-y-4">
      {/* Insight callout */}
      {bestDay && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm text-text-secondary">💡 Your mood is typically highest on</p>
          <p className="text-xl font-bold text-text-primary">{dayNames[bestDay.day]}s</p>
          <p className="text-xs text-text-secondary">avg valence {bestDay.avg.toFixed(1)}</p>
        </div>
      )}

      {/* Mood heatmap */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
        <h3 className="font-semibold text-text-primary text-sm">30-Day Mood Heatmap</h3>
        <div className="grid grid-cols-10 gap-1">
          {heatmapDays.map(({ date, avgValence }) => (
            <div
              key={date}
              title={`${date}: ${avgValence !== null ? avgValence.toFixed(1) : 'No data'}`}
              className="aspect-square rounded-sm"
              style={{
                backgroundColor: avgValence !== null ? valenceToColor(Math.round(avgValence)) : 'hsl(var(--border))',
                opacity: avgValence !== null ? 0.8 : 0.3,
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <div className="w-3 h-3 rounded-sm bg-red-500" /> Negative
          <div className="w-3 h-3 rounded-sm bg-yellow-400 ml-2" /> Neutral
          <div className="w-3 h-3 rounded-sm bg-green-500 ml-2" /> Positive
        </div>
      </div>

      {/* Composite score line */}
      {compositeTrend.length >= 2 && (
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
          <h3 className="font-semibold text-text-primary text-sm">Composite Wellbeing Over Time</h3>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={compositeTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* PERMA radar */}
      {permaRadar && (
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
          <h3 className="font-semibold text-text-primary text-sm">PERMA Profile</h3>
          <p className="text-xs text-text-secondary">P=Positive Emotions · E=Engagement · R=Relationships · M=Meaning · A=Accomplishment</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={permaRadar}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: 'hsl(var(--text-primary))' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="PERMA" dataKey="value" stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Emotion frequency */}
      {topEmotions.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
          <h3 className="font-semibold text-text-primary text-sm">Top Emotions (30 days)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={topEmotions} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--text-secondary))' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--text-primary))' }} width={80} />
              <Tooltip contentStyle={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {topEmotions.map((_, i) => (
                  <Cell key={i} fill={`hsl(${260 + i * 12} 70% 65%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <CrisisBanner />
    </div>
  )
}

// ─── Growth Tab ───────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<InterventionCategory, React.ReactNode> = {
  Gratitude: <Star className="w-4 h-4" />,
  Mindfulness: <Smile className="w-4 h-4" />,
  Strengths: <Brain className="w-4 h-4" />,
  Social: <Heart className="w-4 h-4" />,
  Cognitive: <BookOpen className="w-4 h-4" />,
  Physical: <Dumbbell className="w-4 h-4" />,
  Meaning: <BarChart2 className="w-4 h-4" />,
  Savouring: <Flame className="w-4 h-4" />,
}

const CATEGORIES: InterventionCategory[] = ['Gratitude', 'Mindfulness', 'Strengths', 'Social', 'Cognitive', 'Physical', 'Meaning', 'Savouring']

function GrowthTab() {
  const [activeCategory, setActiveCategory] = useState<InterventionCategory | 'All'>('All')
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [streak, setStreak] = useState(0)

  // Load persisted state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('wellbeing_done_ids')
      if (stored) setDoneIds(new Set(JSON.parse(stored)))
      const storedStreak = localStorage.getItem('wellbeing_streak')
      if (storedStreak) setStreak(Number(storedStreak))
    } catch { /* ignore */ }
  }, [])

  const toggleDone = (id: string) => {
    setDoneIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        const newStreak = streak + 1
        setStreak(newStreak)
        try { localStorage.setItem('wellbeing_streak', String(newStreak)) } catch { /* ignore */ }
      }
      try { localStorage.setItem('wellbeing_done_ids', JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }

  const filtered = activeCategory === 'All'
    ? POSITIVE_INTERVENTIONS
    : POSITIVE_INTERVENTIONS.filter(i => i.category === activeCategory)

  return (
    <div className="space-y-4">
      {/* Streak */}
      <div className="rounded-2xl border border-border bg-surface p-4 flex items-center gap-3">
        <Flame className="w-6 h-6 text-orange-400" />
        <div>
          <p className="text-lg font-bold text-text-primary">{streak} <span className="text-sm font-normal text-text-secondary">exercises tried</span></p>
          <p className="text-xs text-text-secondary">Keep building your positive psychology practice</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveCategory('All')}
          className={cn(
            'flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors',
            activeCategory === 'All'
              ? 'bg-accent/10 border-accent/40 text-accent'
              : 'bg-surface border-border text-text-secondary',
          )}
        >
          All ({POSITIVE_INTERVENTIONS.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = POSITIVE_INTERVENTIONS.filter(i => i.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors',
                activeCategory === cat
                  ? 'bg-accent/10 border-accent/40 text-accent'
                  : 'bg-surface border-border text-text-secondary',
              )}
            >
              {CATEGORY_ICONS[cat]}
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* Intervention cards */}
      <div className="space-y-3">
        {filtered.map(intervention => {
          const done = doneIds.has(intervention.id)
          return (
            <InterventionCard
              key={intervention.id}
              intervention={intervention}
              done={done}
              onToggle={() => toggleDone(intervention.id)}
            />
          )
        })}
      </div>

      <CrisisBanner />
    </div>
  )
}

function InterventionCard({
  intervention, done, onToggle,
}: { intervention: PositiveIntervention; done: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false)

  const gradeColor = { A: '#22c55e', B: '#eab308', C: '#94a3b8' }[intervention.evidenceGrade]

  return (
    <div className={cn('rounded-2xl border bg-surface overflow-hidden transition-all', done ? 'border-green-500/40 opacity-75' : 'border-border')}>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={cn('font-semibold text-sm', done ? 'line-through text-text-secondary' : 'text-text-primary')}>
                {intervention.name}
              </h4>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold border"
                style={{ color: gradeColor, borderColor: gradeColor + '44', backgroundColor: gradeColor + '11' }}
              >
                Grade {intervention.evidenceGrade}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
              {CATEGORY_ICONS[intervention.category]}
              <span>{intervention.category}</span>
              <span>·</span>
              <span>⏱ {intervention.duration}</span>
              {intervention.effectSize && (
                <>
                  <span>·</span>
                  <span className="text-green-400">{intervention.effectSize}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onToggle}
            className={cn(
              'flex-shrink-0 p-1.5 rounded-xl border transition-colors',
              done ? 'bg-green-500/10 border-green-500/40 text-green-500' : 'bg-surface border-border text-text-secondary hover:text-text-primary',
            )}
            aria-label={done ? 'Mark as not done' : 'Mark as done'}
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => setExpanded(o => !o)}
          className="text-xs text-accent hover:underline flex items-center gap-1"
        >
          {expanded ? 'Show less' : 'Instructions & citations'}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {expanded && (
          <div className="space-y-2 pt-1 border-t border-border">
            <p className="text-sm text-text-secondary leading-relaxed">{intervention.instructions}</p>
            {intervention.citations.length > 0 && (
              <div className="space-y-0.5">
                {intervention.citations.map((c, i) => (
                  <p key={i} className="text-[10px] text-text-secondary italic">{c}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {!done && (
          <button
            onClick={onToggle}
            className="w-full mt-1 py-2 rounded-xl bg-accent/10 border border-accent/30 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors"
          >
            Try Today
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'checkin', label: 'Check-In', icon: <Smile className="w-4 h-4" /> },
  { id: 'assessments', label: 'Assessments', icon: <BarChart2 className="w-4 h-4" /> },
  { id: 'insights', label: 'Insights', icon: <Brain className="w-4 h-4" /> },
  { id: 'growth', label: 'Growth', icon: <Flame className="w-4 h-4" /> },
]

export function MentalWellbeingClient() {
  const [tab, setTab] = useState<TabId>('checkin')
  const [data, setData] = useState<PageData>({ assessments: [], moods: [], latestByType: {} })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/mental-wellbeing')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-4 pt-4 pb-0">
        <div className="flex items-center gap-3 mb-3">
          <Brain className="w-6 h-6 text-accent" />
          <h1 className="text-xl font-bold text-text-primary">Mental Wellbeing</h1>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-xl border-b-2 transition-colors flex-shrink-0',
                tab === t.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'checkin' && <CheckInTab moods={data.moods} onRefresh={fetchData} />}
            {tab === 'assessments' && <AssessmentsTab data={data} onRefresh={fetchData} />}
            {tab === 'insights' && <InsightsTab data={data} />}
            {tab === 'growth' && <GrowthTab />}
          </>
        )}
      </div>
    </div>
  )
}
