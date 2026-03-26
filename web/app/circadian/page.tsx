'use client'

import { useEffect, useState } from 'react'
import { CHRONOTYPE_QUIZ, calculateChronotype, CHRONOTYPES, ChronotypeAnimal, calculateSocialJetLag } from '@/lib/chronotype'
import { useRouter } from 'next/navigation'

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full h-2 bg-surface rounded-full mb-4">
      <div
        className="h-2 bg-primary rounded-full transition-all"
        style={{ width: `${((step + 1) / total) * 100}%` }}
      />
    </div>
  )
}

function TimelineBar({ profile }: { profile: typeof CHRONOTYPES[ChronotypeAnimal] }) {
  // Simple horizontal timeline for optimal schedule
  const items = [
    { label: 'Wake', time: profile.optimalWake },
    { label: 'Focus', time: profile.optimalFocusWindow },
    { label: 'Workout', time: profile.optimalWorkoutWindow },
    { label: 'Meals', time: profile.optimalMealWindow },
    { label: 'Sleep', time: profile.optimalSleep },
  ]
  return (
    <div className="w-full flex flex-col gap-2 my-4">
      <div className="flex justify-between text-xs text-text-secondary">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center">
            <span className="font-semibold text-text-primary">{item.label}</span>
            <span>{item.time}</span>
          </div>
        ))}
      </div>
      <div className="relative h-3 mt-2 flex items-center">
        <div className="absolute left-0 right-0 h-1 bg-border rounded-full" />
        {items.map((item, i) => (
          <div
            key={item.label}
            className="absolute top-0"
            style={{ left: `${(i / (items.length - 1)) * 100}%` }}
          >
            <div className="w-3 h-3 bg-primary rounded-full border-2 border-background" />
          </div>
        ))}
      </div>
    </div>
  )
}

function SocialJetLagSection({
  workdayWake,
  freedayWake,
  setWorkdayWake,
  setFreedayWake,
}: {
  workdayWake: string
  freedayWake: string
  setWorkdayWake: (v: string) => void
  setFreedayWake: (v: string) => void
}) {
  const jetlag = calculateSocialJetLag(workdayWake, freedayWake)
  let color = 'text-green-600'
  if (jetlag >= 3) color = 'text-red-600'
  else if (jetlag >= 2) color = 'text-orange-500'
  else if (jetlag >= 1) color = 'text-yellow-500'
  return (
    <div className="my-4">
      <div className="font-semibold mb-2">Social Jet Lag</div>
      <div className="flex gap-4 items-center">
        <div>
          <label className="block text-xs text-text-secondary">Workday wake</label>
          <input
            type="time"
            value={workdayWake}
            onChange={(e) => setWorkdayWake(e.target.value)}
            className="border border-border rounded-lg px-2 py-1 bg-surface"
          />
        </div>
        <div>
          <label className="block text-xs text-text-secondary">Free day wake</label>
          <input
            type="time"
            value={freedayWake}
            onChange={(e) => setFreedayWake(e.target.value)}
            className="border border-border rounded-lg px-2 py-1 bg-surface"
          />
        </div>
        <div className="flex flex-col items-center">
          <span className={`font-bold text-lg ${color}`}>{jetlag.toFixed(2)}h</span>
          <span className="text-xs text-text-secondary">jet lag</span>
        </div>
      </div>
      <div className="text-xs mt-1 text-text-secondary">
        {jetlag < 1 && 'Low risk'}
        {jetlag >= 1 && jetlag < 2 && 'Mild risk'}
        {jetlag >= 2 && jetlag < 3 && 'Moderate risk'}
        {jetlag >= 3 && 'High risk: try to align your schedules!'}
      </div>
    </div>
  )
}

function LightExposureQuickLog({ onLog }: { onLog: (period: string, type: string, duration: number) => void }) {
  const [open, setOpen] = useState<null | { period: string; type: string }> (null)
  const [duration, setDuration] = useState(15)
  const periods = [
    { label: 'Morning light ☀️', period: 'morning', type: 'natural' },
    { label: 'Afternoon', period: 'afternoon', type: 'natural' },
    { label: 'Evening blue light 📱', period: 'evening', type: 'blue_light_device' },
  ]
  return (
    <div className="my-4">
      <div className="font-semibold mb-2">Light Exposure Today</div>
      <div className="flex gap-2">
        {periods.map((p) => (
          <button
            key={p.period}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-sm flex items-center gap-1 hover:bg-surface-secondary"
            onClick={() => setOpen({ period: p.period, type: p.type })}
          >
            {p.label}
          </button>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-2xl p-6 shadow-xl flex flex-col items-center">
            <div className="mb-2 font-semibold">Log {open.period.replace(/\b\w/g, (l) => l.toUpperCase())}</div>
            <div className="flex gap-2 mb-4">
              {[15, 30, 60].map((min) => (
                <button
                  key={min}
                  className={`px-4 py-2 rounded-lg border ${duration === min ? 'bg-primary text-white' : 'bg-surface border-border'}`}
                  onClick={() => setDuration(min)}
                >
                  +{min} min
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 rounded-lg bg-surface border border-border"
                onClick={() => setOpen(null)}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded-lg bg-primary text-white"
                onClick={() => {
                  onLog(open.period, open.type, duration)
                  setOpen(null)
                }}
              >Log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CircadianPage() {
  const [assessment, setAssessment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quizStep, setQuizStep] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const [workdayWake, setWorkdayWake] = useState('07:00')
  const [freedayWake, setFreedayWake] = useState('08:00')
  const [lightLogMsg, setLightLogMsg] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/circadian')
      .then((r) => r.json())
      .then((d) => {
        setAssessment(d.assessment)
        if (d.assessment) {
          setWorkdayWake(d.assessment.workday_wake || '07:00')
          setFreedayWake(d.assessment.freeday_wake || '08:00')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleQuizNext = (value: number) => {
    const q = CHRONOTYPE_QUIZ[quizStep]
    setQuizAnswers((a) => ({ ...a, [q.id]: value }))
    if (quizStep === CHRONOTYPE_QUIZ.length - 1) {
      setShowResult(true)
    } else {
      setQuizStep((s) => s + 1)
    }
  }

  const handleQuizRestart = () => {
    setQuizStep(0)
    setQuizAnswers({})
    setShowResult(false)
  }

  const handleQuizSave = async () => {
    setSaving(true)
    const chronotype = calculateChronotype(quizAnswers)
    const res = await fetch('/api/circadian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chronotype,
        quiz_answers: quizAnswers,
        workday_wake: workdayWake,
        freeday_wake: freedayWake,
        social_jet_lag_hours: calculateSocialJetLag(workdayWake, freedayWake),
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setAssessment(data)
      setShowResult(false)
    }
    setSaving(false)
  }

  const handleRetake = () => {
    setAssessment(null)
    setQuizStep(0)
    setQuizAnswers({})
    setShowResult(false)
  }

  const handleLightLog = async (period: string, type: string, duration: number) => {
    setLightLogMsg('Logging...')
    const res = await fetch('/api/light-exposure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period, type, duration_min: duration }),
    })
    if (res.ok) setLightLogMsg('Logged!')
    else setLightLogMsg('Error logging')
    setTimeout(() => setLightLogMsg(''), 1500)
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  // Quiz section
  if (!assessment || showResult) {
    if (showResult) {
      const chronotype = calculateChronotype(quizAnswers)
      const profile = CHRONOTYPES[chronotype]
      return (
        <div className="max-w-xl mx-auto p-4">
          <div className="flex flex-col items-center gap-2 bg-surface rounded-2xl p-6 mt-8">
            <div className="text-5xl">{profile.emoji}</div>
            <div className="font-bold text-xl mt-2">{profile.label}</div>
            <div className="text-text-secondary text-sm mb-2">{profile.population} of people</div>
            <div className="mb-4 text-text-primary text-center">{profile.description}</div>
            <TimelineBar profile={profile} />
            <button
              className="mt-4 px-6 py-2 rounded-xl bg-primary text-white font-semibold"
              onClick={handleQuizSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save my chronotype'}
            </button>
            <button
              className="mt-2 text-xs underline text-text-secondary"
              onClick={handleQuizRestart}
            >Retake Quiz</button>
          </div>
        </div>
      )
    }
    const q = CHRONOTYPE_QUIZ[quizStep]
    return (
      <div className="max-w-xl mx-auto p-4">
        <div className="bg-surface rounded-2xl p-6 mt-8 flex flex-col items-center">
          <ProgressBar step={quizStep} total={CHRONOTYPE_QUIZ.length} />
          <div className="font-semibold text-lg mb-4 text-center">{q.question}</div>
          <div className="flex flex-col gap-3 w-full">
            {q.options.map((opt) => (
              <button
                key={opt.value}
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface-secondary hover:bg-primary hover:text-white transition-colors"
                onClick={() => handleQuizNext(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Dashboard section
  const profile = CHRONOTYPES[assessment.chronotype as ChronotypeAnimal]
  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="bg-surface rounded-2xl p-6 mt-8 flex flex-col items-center">
        <div className="text-5xl">{profile.emoji}</div>
        <div className="font-bold text-xl mt-2">{profile.label}</div>
        <div className="text-text-secondary text-sm mb-2">{profile.population} of people</div>
        <div className="mb-4 text-text-primary text-center">{profile.description}</div>
        <TimelineBar profile={profile} />
        <button
          className="mt-2 text-xs underline text-text-secondary"
          onClick={handleRetake}
        >Retake Quiz</button>
      </div>
      <div className="bg-surface rounded-2xl p-6 mt-6">
        <SocialJetLagSection
          workdayWake={workdayWake}
          freedayWake={freedayWake}
          setWorkdayWake={setWorkdayWake}
          setFreedayWake={setFreedayWake}
        />
        <div className="my-4">
          <div className="font-semibold mb-2">Personalized Tips</div>
          <ul className="list-disc ml-6 text-sm text-text-secondary">
            {profile.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
        <LightExposureQuickLog onLog={handleLightLog} />
        {lightLogMsg && <div className="text-xs text-primary mt-2">{lightLogMsg}</div>}
      </div>
    </div>
  )
}
