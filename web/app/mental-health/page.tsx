'use client'

import React, { useState } from 'react'
import { PHQ9_QUESTIONS, GAD7_QUESTIONS, PSS4_QUESTIONS, PHQ9_INTERPRETATION, GAD7_INTERPRETATION, PSS4_INTERPRETATION } from '@/lib/mental-health-screeners'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const SCREENERS = [
  {
    key: 'phq9',
    label: 'PHQ-9',
    emoji: '😔',
    subtitle: 'How have you been feeling lately?',
    questions: PHQ9_QUESTIONS,
    interpret: PHQ9_INTERPRETATION,
    description: 'Depression screening',
  },
  {
    key: 'gad7',
    label: 'GAD-7',
    emoji: '😰',
    subtitle: 'Checking in on worry and anxiety',
    questions: GAD7_QUESTIONS,
    interpret: GAD7_INTERPRETATION,
    description: 'Anxiety screening',
  },
  {
    key: 'pss4',
    label: 'PSS-4',
    emoji: '😤',
    subtitle: 'Stress check — just 4 quick questions',
    questions: PSS4_QUESTIONS,
    interpret: PSS4_INTERPRETATION,
    description: 'Stress screening',
  },
]

function ProgressBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="w-full h-2 bg-border rounded-full mb-4">
      <div
        className="h-2 rounded-full bg-primary transition-all"
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  )
}

function CrisisResources() {
  return (
    <div className="mt-8 p-4 rounded-2xl bg-surface border border-border text-text-secondary">
      <div className="font-semibold mb-1">Need to talk to someone?</div>
      <div>📞 988 Suicide & Crisis Lifeline — call or text 988</div>
      <div>💬 Crisis Text Line — text HOME to 741741</div>
      <div>🌐 NAMI — <a href="https://nami.org/help" className="underline text-primary" target="_blank" rel="noopener">nami.org/help</a></div>
    </div>
  )
}

function Disclaimer() {
  return (
    <div className="mb-4 p-3 rounded-2xl bg-surface border border-border text-text-secondary text-sm">
      These are evidence-based screening tools used by healthcare providers. They are not a substitute for professional diagnosis or treatment.
    </div>
  )
}

function TrackOverTime({ scores }: { scores: { screened_at: string; total_score: number }[] }) {
  if (!scores?.length) return null
  return (
    <div className="mt-4">
      <div className="text-text-secondary text-xs mb-1">Track Over Time</div>
      <div className="flex gap-2 items-end h-16">
        {scores.map((s, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="text-xs text-text-secondary mb-1">{new Date(s.screened_at).toLocaleDateString()}</div>
            <div className="w-6 h-10 bg-primary/20 rounded flex items-end">
              <div
                className="bg-primary rounded"
                style={{ height: `${(s.total_score / 27) * 40 + 8}px`, width: '100%' }}
              />
            </div>
            <div className="text-xs mt-1">{s.total_score}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScreenerFlow({ screener }: { screener: typeof SCREENERS[0] }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>(Array(screener.questions.length).fill(-1))
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])

  React.useEffect(() => {
    fetch(`/api/mental-health`)
      .then(r => r.json())
      .then(data => setHistory((data || []).filter((d: any) => d.screener_type === screener.key)))
  }, [screener.key])

  const onSelect = (idx: number, value: number) => {
    const next = [...answers]
    next[idx] = value
    setAnswers(next)
  }

  const onNext = () => setStep(s => s + 1)
  const onPrev = () => setStep(s => s - 1)

  const onSubmit = async () => {
    setSubmitting(true)
    const total_score = answers.reduce((a, b) => a + b, 0)
    const interpretation = screener.interpret(total_score)
    setResult({ total_score, interpretation })
    await fetch('/api/mental-health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        screener_type: screener.key,
        answers,
        total_score,
        severity_label: interpretation.label,
      }),
    })
    setSubmitting(false)
    // Refresh history
    fetch(`/api/mental-health`)
      .then(r => r.json())
      .then(data => setHistory((data || []).filter((d: any) => d.screener_type === screener.key)))
  }

  if (result) {
    const { total_score, interpretation } = result
    return (
      <div className="mt-4">
        <div className={cn(
          'rounded-2xl p-4 mb-4',
          interpretation.color === 'green' && 'bg-green-100 border border-green-300',
          interpretation.color === 'yellow' && 'bg-yellow-100 border border-yellow-300',
          interpretation.color === 'orange' && 'bg-orange-100 border border-orange-300',
          interpretation.color === 'red' && 'bg-red-100 border border-red-300',
        )}>
          <div className="font-semibold text-lg mb-1">Your Score: {total_score}</div>
          <div className="font-semibold mb-1">{interpretation.label}</div>
          <div className="text-text-secondary mb-2">{interpretation.description}</div>
          <div className="text-xs text-text-secondary">These are screening tools, not a diagnosis. If you have concerns, consider reaching out to a professional.</div>
        </div>
        {interpretation.showCrisis && <CrisisResources />}
        <TrackOverTime scores={history.slice(0, 3)} />
      </div>
    )
  }

  const q = screener.questions[step]
  return (
    <div className="mt-4">
      <ProgressBar value={step} max={screener.questions.length - 1} />
      <div className="rounded-2xl bg-surface border border-border p-4 mb-4">
        <div className="font-semibold mb-2">{q.text}</div>
        <div className="flex flex-col gap-2">
          {q.options.map(opt => (
            <label key={opt.value} className={cn(
              'flex items-center gap-2 p-2 rounded cursor-pointer',
              answers[step] === opt.value ? 'bg-primary/10 border border-primary' : 'border border-border',
            )}>
              <input
                type="radio"
                name={`q${step}`}
                value={opt.value}
                checked={answers[step] === opt.value}
                onChange={() => onSelect(step, opt.value)}
                className="accent-primary"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        {step > 0 && (
          <button className="px-4 py-2 rounded bg-surface border border-border" onClick={onPrev} disabled={submitting}>Back</button>
        )}
        {step < screener.questions.length - 1 ? (
          <button
            className="px-4 py-2 rounded bg-primary text-white"
            onClick={onNext}
            disabled={answers[step] === -1 || submitting}
          >Next</button>
        ) : (
          <button
            className="px-4 py-2 rounded bg-primary text-white"
            onClick={onSubmit}
            disabled={answers.includes(-1) || submitting}
          >See Results</button>
        )}
      </div>
    </div>
  )
}

export default function MentalHealthPage() {
  const [tab, setTab] = useState(0)
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Disclaimer />
      <h1 className="text-2xl font-bold mb-1 text-text-primary">Check In With Yourself</h1>
      <div className="text-text-secondary mb-6">These brief questionnaires help you notice patterns over time. They are not a diagnosis.</div>
      <div className="flex gap-2 mb-4">
        {SCREENERS.map((s, i) => (
          <button
            key={s.key}
            className={cn(
              'flex-1 rounded-2xl px-3 py-2 border',
              tab === i ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-text-primary',
            )}
            onClick={() => setTab(i)}
          >
            <span className="mr-1">{s.emoji}</span> {s.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl bg-surface border border-border p-4 mb-2">
        <div className="font-semibold mb-1">{SCREENERS[tab].subtitle}</div>
        <div className="text-text-secondary text-sm mb-2">{SCREENERS[tab].description}</div>
        <ScreenerFlow screener={SCREENERS[tab]} />
      </div>
      <CrisisResources />
    </div>
  )
}
