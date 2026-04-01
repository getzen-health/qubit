'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react'

interface OnboardingClientProps {
  userId: string
}

const TOTAL_STEPS = 4

function ProgressBar({ step }: { step: number }) {
  const pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100
  return (
    <div className="h-1 bg-surface">
      <div
        className="h-full bg-accent transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function StepDots({ current }: { current: number }) {
  return (
    <div
      className="flex items-center gap-2 justify-center"
      aria-label={`Step ${current} of ${TOTAL_STEPS}`}
    >
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i + 1 === current
              ? 'w-6 h-2.5 bg-accent'
              : i + 1 < current
              ? 'w-2.5 h-2.5 bg-accent/60'
              : 'w-2.5 h-2.5 bg-border'
          }`}
        />
      ))}
    </div>
  )
}

export function OnboardingClient({ userId: _userId }: OnboardingClientProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 2 — goals saved to localStorage
  const [stepGoal, setStepGoal] = useState(10000)
  const [calorieGoal, setCalorieGoal] = useState(500)
  const [sleepGoalHours, setSleepGoalHours] = useState(8)

  // Step 3 — health profile (optional, saved to Supabase)
  const [dob, setDob] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')

  function persistGoals() {
    localStorage.setItem('getzen_step_goal', String(stepGoal))
    localStorage.setItem('getzen_calorie_goal', String(calorieGoal))
    localStorage.setItem('getzen_sleep_goal_minutes', String(Math.round(sleepGoalHours * 60)))
  }

  async function handleFinish() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dob: dob || null,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          weight_kg: weightKg ? parseFloat(weightKg) : null,
        }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        setError((payload as { error?: string }).error ?? 'Something went wrong.')
        setSaving(false)
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Network error. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProgressBar step={step} />

      <div className="flex-1 max-w-md mx-auto w-full px-6 py-8 flex flex-col">
        <div className="mb-6">
          <StepDots current={step} />
        </div>

        <div className="flex-1 flex flex-col">

          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="flex-1 flex flex-col">
              <div className="text-center py-6 flex-1">
                <div className="text-5xl mb-4">👋</div>
                <h1 className="text-3xl font-bold text-text-primary mb-3">
                  Welcome to GetZen
                </h1>
                <p className="text-text-secondary text-base mb-8">
                  Let&apos;s set up your profile so we can personalise your experience.
                </p>
                <div className="space-y-3 text-left">
                  {[
                    { icon: '🔄', text: 'Sync your Apple Health data automatically' },
                    { icon: '📊', text: 'Track steps, sleep, heart rate and more' },
                    { icon: '🤖', text: 'Get AI-powered personalised insights' },
                    { icon: '🎯', text: 'Set goals and measure your progress' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm text-text-secondary">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 bg-accent text-accent-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  Let&apos;s set up your profile <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <div className="flex-1 flex flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">Set your daily goals</h2>
                <p className="text-text-secondary text-sm">
                  These personalise your dashboard and AI insights.
                </p>
              </div>

              <div className="flex-1 space-y-4">
                <GoalSlider
                  label="Daily steps"
                  icon="👟"
                  value={stepGoal}
                  onChange={setStepGoal}
                  min={2000}
                  max={20000}
                  step={500}
                  format={(v) => v.toLocaleString()}
                  unit="steps"
                  presets={[5000, 8000, 10000, 15000]}
                />
                <GoalSlider
                  label="Active calories"
                  icon="🔥"
                  value={calorieGoal}
                  onChange={setCalorieGoal}
                  min={100}
                  max={1000}
                  step={25}
                  format={(v) => String(v)}
                  unit="kcal"
                  presets={[250, 400, 500, 750]}
                />
                <GoalSlider
                  label="Sleep goal"
                  icon="😴"
                  value={sleepGoalHours}
                  onChange={setSleepGoalHours}
                  min={4}
                  max={10}
                  step={0.5}
                  format={(v) => v.toFixed(1)}
                  unit="hrs"
                  presets={[6, 7, 8, 9]}
                />
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    persistGoals()
                    setStep(3)
                  }}
                  className="w-full py-3.5 bg-accent text-accent-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="w-full py-2 text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Health Profile */}
          {step === 3 && (
            <div className="flex-1 flex flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">Health profile</h2>
                <p className="text-text-secondary text-sm">
                  Optional — used for personalised calculations. All fields can be skipped.
                </p>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="175"
                      min={100}
                      max={250}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="70"
                      min={30}
                      max={300}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setStep(4)}
                  className="w-full py-3.5 bg-accent text-accent-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="flex-1 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-3">
                You&apos;re all set! 🎉
              </h2>
              <p className="text-text-secondary text-sm mb-8">
                Your profile is configured. Here&apos;s what you can explore:
              </p>

              <div className="w-full space-y-3 text-left mb-8">
                {[
                  { icon: '📊', title: 'Dashboard', desc: 'Your health overview at a glance' },
                  { icon: '🔍', title: 'Food Scanner', desc: 'Scan barcodes for instant nutrition info' },
                  { icon: '🤖', title: 'AI Insights', desc: 'Personalised health recommendations' },
                  { icon: '🏋️', title: 'Workouts', desc: 'Log and track your training sessions' },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                      <p className="text-xs text-text-secondary">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

              <button
                onClick={handleFinish}
                disabled={saving}
                className="w-full py-3.5 bg-accent text-accent-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Setting up\u2026' : 'Go to Dashboard'}
                {!saving && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// GoalSlider

interface GoalSliderProps {
  label: string
  icon: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  format: (v: number) => string
  unit: string
  presets: number[]
}

function GoalSlider({
  label,
  icon,
  value,
  onChange,
  min,
  max,
  step,
  format,
  unit,
  presets,
}: GoalSliderProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <label className="text-sm font-medium text-text-primary">{label}</label>
        </div>
        <span className="text-sm font-semibold text-accent">
          {format(value)}{' '}
          <span className="text-text-secondary font-normal text-xs">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[hsl(var(--accent))] cursor-pointer"
      />
      <div className="flex gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
              value === p
                ? 'bg-accent text-accent-foreground'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            {format(p)}
          </button>
        ))}
      </div>
    </div>
  )
}
