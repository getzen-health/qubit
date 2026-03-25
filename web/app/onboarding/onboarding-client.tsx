'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, ChevronRight, Smartphone, QrCode } from 'lucide-react'

interface OnboardingClientProps {
  userId: string
  initialName: string
}

const TOTAL_STEPS = 4

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 justify-center" aria-label={`Step ${current} of ${TOTAL_STEPS}`}>
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

export function OnboardingClient({ userId, initialName }: OnboardingClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1
  const [displayName, setDisplayName] = useState(initialName)

  // Step 2 — goals
  const [stepGoal, setStepGoal] = useState(10000)
  const [sleepGoalHours, setSleepGoalHours] = useState(8)
  const [calorieGoal, setCalorieGoal] = useState(2000)
  const [hrvTarget, setHrvTarget] = useState(50)

  const handleStep1 = async () => {
    setSaving(true)
    setError(null)
    const name = displayName.trim()
    if (name) {
      const { error: err } = await supabase
        .from('users')
        .update({ display_name: name, updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (err) { setError('Failed to save name. Please try again.'); setSaving(false); return }
    }
    setSaving(false)
    setStep(2)
  }

  const handleStep2 = async () => {
    setSaving(true)
    setError(null)
    const { error: err } = await supabase
      .from('users')
      .update({
        step_goal: stepGoal,
        sleep_goal_minutes: sleepGoalHours * 60,
        calorie_goal: calorieGoal,
        hrv_target: hrvTarget,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
    if (err) { setError('Failed to save goals. Please try again.'); setSaving(false); return }
    setSaving(false)
    setStep(3)
  }

  const handleFinish = async () => {
    setSaving(true)
    setError(null)
    await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, onboarding_completed: true, updated_at: new Date().toISOString() })
    setSaving(false)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo / brand */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 mb-2">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">KQuarks</h1>
        </div>

        <StepDots current={step} />

        {/* Step 1 — Welcome + name */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-text-primary">Welcome! What should we call you?</h2>
              <p className="text-text-secondary text-sm">Your name is shown as a greeting on your dashboard.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="display-name" className="text-sm font-medium text-text-primary">
                Display name
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex"
                maxLength={50}
                className="w-full px-4 py-3 bg-surface rounded-xl border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors text-base"
                onKeyDown={(e) => { if (e.key === 'Enter') handleStep1() }}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleStep1}
              disabled={saving}
              className="w-full py-3.5 bg-accent text-accent-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Continue'}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Step 2 — Goals */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-text-primary">Set your daily goals</h2>
              <p className="text-text-secondary text-sm">These help personalise your dashboard and AI insights.</p>
            </div>

            <div className="space-y-4">
              <GoalInput
                label="Daily steps"
                unit="steps"
                value={stepGoal}
                onChange={setStepGoal}
                presets={[5000, 8000, 10000, 15000]}
                min={1000}
                max={50000}
                step={500}
              />
              <GoalInput
                label="Sleep goal"
                unit="hours"
                value={sleepGoalHours}
                onChange={setSleepGoalHours}
                presets={[6, 7, 8, 9]}
                min={4}
                max={12}
                step={0.5}
                decimals={1}
              />
              <GoalInput
                label="Daily calories"
                unit="kcal"
                value={calorieGoal}
                onChange={setCalorieGoal}
                presets={[1500, 1800, 2000, 2500]}
                min={1000}
                max={5000}
                step={100}
              />
              <GoalInput
                label="HRV target"
                unit="ms"
                value={hrvTarget}
                onChange={setHrvTarget}
                presets={[30, 50, 70, 100]}
                min={10}
                max={200}
                step={5}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleStep2}
              disabled={saving}
              className="w-full py-3.5 bg-accent text-accent-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Continue'}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Step 3 — Connect data sources */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-text-primary">Connect your health data</h2>
              <p className="text-text-secondary text-sm">KQuarks syncs directly from Apple Health on your iPhone.</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">KQuarks iOS App</p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    Install the app on your iPhone to start syncing steps, heart rate, sleep, workouts and more.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Download on the App Store</p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    Search <span className="font-mono font-medium">KQuarks</span> on the App Store, or scan the QR code with your iPhone camera.
                  </p>
                </div>
              </div>

              {/* Placeholder QR / App Store badge */}
              <div className="flex flex-col items-center gap-3 pt-2">
                <div className="w-28 h-28 rounded-xl bg-surface-secondary border border-border flex items-center justify-center">
                  <QrCode className="w-14 h-14 text-text-secondary opacity-40" />
                </div>
                <a
                  href="https://apps.apple.com/app/kquarks/id0000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  <svg viewBox="0 0 814 1000" className="w-4 h-4 fill-white" aria-hidden="true">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 389.8 23.5 235.5 23.5 185.9c0-154.6 133.6-237.6 244.5-237.6 82 0 142 53.4 189.9 53.4 45.2 0 116.6-56.1 210.6-56.1zm-167.5-171.5c3.9 43.5-11.2 87.1-34.4 120.5-25 35.7-68.8 63.1-109.5 63.1-4.5 0-8.9-.3-13.2-.8-3.2-42.5 11.5-87.1 34.9-118.9 25.2-34.2 69-61.6 122.2-63.9z" />
                  </svg>
                  Download on the App Store
                </a>
              </div>
            </div>

            <button
              onClick={() => setStep(4)}
              className="w-full py-3.5 bg-accent text-accent-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setStep(4)}
              className="w-full py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <div className="space-y-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-text-primary">You&apos;re all set!</h2>
              <p className="text-text-secondary text-sm">
                Your profile is configured. Head to the dashboard to explore your health data.
              </p>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full py-3.5 bg-accent text-accent-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Loading…' : 'Go to Dashboard'}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// MARK: - GoalInput

interface GoalInputProps {
  label: string
  unit: string
  value: number
  onChange: (v: number) => void
  presets: number[]
  min: number
  max: number
  step: number
  decimals?: number
}

function GoalInput({ label, unit, value, onChange, presets, min, max, step, decimals = 0 }: GoalInputProps) {
  const format = (v: number) => decimals > 0 ? v.toFixed(decimals) : v.toString()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <span className="text-sm font-semibold text-accent">{format(value)} <span className="text-text-secondary font-normal">{unit}</span></span>
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
      <div className="flex gap-2 flex-wrap">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
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
