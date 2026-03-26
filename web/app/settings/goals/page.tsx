'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STEP_KEY = 'kquarks_step_goal'
const CAL_KEY = 'kquarks_calorie_goal'
const SLEEP_KEY = 'kquarks_sleep_goal_minutes'
const HRV_KEY = 'kquarks_hrv_target'
const DEFAULT_STEP_GOAL = 10000
const DEFAULT_CAL_GOAL = 500
const DEFAULT_SLEEP_GOAL = 480 // 8 hours
const DEFAULT_WATER_GOAL = 2500 // ml
const DEFAULT_HRV_TARGET = 50 // ms
const DEFAULT_CALORIE_INTAKE_GOAL = 2000
const DEFAULT_PROTEIN_GOAL = 150
const DEFAULT_CARBS_GOAL = 250
const DEFAULT_FAT_GOAL = 65

import { useRouter } from 'next/navigation'

export default function GoalsSettingsPage() {
  const [stepGoal, setStepGoal] = useState(DEFAULT_STEP_GOAL)
  const [stepInput, setStepInput] = useState(DEFAULT_STEP_GOAL.toString())
  const [sleepGoal, setSleepGoal] = useState(8.0)
  const [sleepInput, setSleepInput] = useState('8.0')
  const [waterGoal, setWaterGoal] = useState(2.5)
  const [waterInput, setWaterInput] = useState('2.5')
  const [weightGoal, setWeightGoal] = useState('')
  const [calorieGoal, setCalorieGoal] = useState(2000)
  const [calorieInput, setCalorieInput] = useState('2000')
  const [calGoal, setCalGoal] = useState(2000)
  const [calInput, setCalInput] = useState('2000')
  const [hrvTarget, setHrvTarget] = useState(50)
  const [hrvInput, setHrvInput] = useState('50')
  const [calorieIntakeInput, setCalorieIntakeInput] = useState('2000')
  const [proteinInput, setProteinInput] = useState('150')
  const [carbsInput, setCarbsInput] = useState('250')
  const [fatInput, setFatInput] = useState('65')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadGoals() {
      const res = await fetch('/api/goals')
      if (res.ok) {
        const data = await res.json()
        setStepGoal(data.daily_steps ?? DEFAULT_STEP_GOAL)
        setStepInput((data.daily_steps ?? DEFAULT_STEP_GOAL).toString())
        setSleepGoal(data.sleep_hours ?? 8.0)
        setSleepInput((data.sleep_hours ?? 8.0).toString())
        setWaterGoal(data.water_liters ?? 2.5)
        setWaterInput((data.water_liters ?? 2.5).toString())
        setWeightGoal(data.target_weight_kg ? data.target_weight_kg.toString() : '')
        setCalorieGoal(data.calorie_budget ?? 2000)
        setCalorieInput((data.calorie_budget ?? 2000).toString())
      }
      setLoading(false)
    }
    loadGoals()
  }, [])

  const handleSave = async () => {
    const steps = parseInt(stepInput, 10)
    const sleepHours = parseFloat(sleepInput)
    const waterLiters = parseFloat(waterInput)
    const weight = weightGoal ? parseFloat(weightGoal) : null
    const calorieBudget = parseInt(calorieInput, 10)
    if (isNaN(steps) || steps <= 0 || steps > 100000) return
    if (isNaN(sleepHours) || sleepHours < 4 || sleepHours > 12) return
    if (isNaN(waterLiters) || waterLiters < 0.5 || waterLiters > 10) return
    if (weightGoal && (weight === null || isNaN(weight) || weight < 20 || weight > 500)) return
    if (isNaN(calorieBudget) || calorieBudget < 500 || calorieBudget > 8000) return
    setStepGoal(steps)
    setSleepGoal(sleepHours)
    setWaterGoal(waterLiters)
    setWeightGoal(weightGoal)
    setCalorieGoal(calorieBudget)
    setCalorieInput(calorieBudget.toString())
    // Save to DB
    const res = await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        daily_steps: steps,
        sleep_hours: sleepHours,
        water_liters: waterLiters,
        target_weight_kg: weight,
        calorie_budget: calorieBudget
      })
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading goals" aria-busy="true" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to settings"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" aria-hidden="true" />
          </Link>
          <h1 className="text-xl font-bold text-text-primary">Goals</h1>
          {saved && <span className="ml-auto text-sm text-accent" role="status" aria-live="polite">Saved</span>}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Step Goal */}
        <section className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary">Daily Step Goal</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Steps target shown on your dashboard and used for streak tracking.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <input
              type="number"
              min={1000}
              max={100000}
              step={500}
              value={stepInput}
              onChange={(e) => setStepInput(e.target.value)}
              aria-label="Daily step goal (1000-100000)"
              className="w-32 px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-center text-lg font-mono focus:outline-none focus:border-accent"
            />
            <span className="text-text-secondary text-sm">steps / day</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[5000, 8000, 10000, 12000, 15000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setStepInput(preset.toString())}
                aria-pressed={stepGoal === preset}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  stepGoal === preset
                    ? 'bg-accent text-white border-accent'
                    : 'border-border text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {preset.toLocaleString()}
              </button>
            ))}
          </div>
        </section>

        {/* Calorie Goal */}
        <section className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary">Daily Active Calorie Goal</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Active calorie burn target shown on your dashboard.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <input
              type="number"
              min={100}
              max={5000}
              step={50}
              value={calInput}
              onChange={(e) => setCalInput(e.target.value)}
              aria-label="Daily active calorie goal (100-5000)"
              className="w-32 px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-center text-lg font-mono focus:outline-none focus:border-accent"
            />
            <span className="text-text-secondary text-sm">cal / day</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[300, 400, 500, 600, 800].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setCalInput(preset.toString())}
                aria-pressed={calGoal === preset}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  calGoal === preset
                    ? 'bg-accent text-white border-accent'
                    : 'border-border text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </section>

        {/* Sleep Goal */}
        <section className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary">Sleep Duration Goal</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Target hours of sleep per night. Used by AI insights to assess your sleep patterns.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <input
              type="number"
              min={4}
              max={12}
              step={0.5}
              value={sleepInput}
              onChange={(e) => setSleepInput(e.target.value)}
              aria-label="Sleep duration goal (4-12 hours)"
              className="w-24 px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-center text-lg font-mono focus:outline-none focus:border-accent"
            />
            <span className="text-text-secondary text-sm">hours / night</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[6, 7, 7.5, 8, 9].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSleepInput(preset.toString())}
                aria-pressed={sleepGoal === preset * 60}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  sleepGoal === preset * 60
                    ? 'bg-accent text-white border-accent'
                    : 'border-border text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {preset}h
              </button>
            ))}
          </div>
        </section>

        {/* Water Goal */}
        <section className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary">Daily Water Goal</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Daily hydration target shown on your hydration tracker.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <input
              type="number"
              min={500}
              max={6000}
              step={250}
              value={waterInput}
              onChange={(e) => setWaterInput(e.target.value)}
              aria-label="Daily water goal (500-6000 ml)"
              className="w-32 px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-center text-lg font-mono focus:outline-none focus:border-accent"
            />
            <span className="text-text-secondary text-sm">ml / day</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[1500, 2000, 2500, 3000, 3500].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setWaterInput(preset.toString())}
                aria-pressed={waterGoal === preset}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  waterGoal === preset
                    ? 'bg-accent text-white border-accent'
                    : 'border-border text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {preset >= 1000 ? `${preset / 1000}L` : `${preset}ml`}
              </button>
            ))}
          </div>
        </section>

        {/* HRV Target */}
        <section className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary">HRV Target</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Target heart rate variability in milliseconds. Higher values indicate better recovery.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <input
              type="number"
              min={20}
              max={100}
              step={5}
              value={hrvInput}
              onChange={(e) => setHrvInput(e.target.value)}
              aria-label="HRV target (20-100 ms)"
              className="w-24 px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-center text-lg font-mono focus:outline-none focus:border-accent"
            />
            <span className="text-text-secondary text-sm">ms</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[30, 40, 50, 60, 80].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setHrvInput(preset.toString())}
                aria-pressed={hrvTarget === preset}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  hrvTarget === preset
                    ? 'bg-accent text-white border-accent'
                    : 'border-border text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {preset}ms
              </button>
            ))}
          </div>
        </section>

        {/* Nutrition Goals */}
        <section className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary">Daily Nutrition Goals</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Calorie intake and macro targets for your nutrition tracker.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Calorie Intake', unit: 'kcal / day', value: calorieIntakeInput, set: setCalorieIntakeInput, min: 500, max: 8000, step: 100, ariaLabel: 'Daily calorie intake goal (500-8000 kcal)' },
              { label: 'Protein', unit: 'g / day', value: proteinInput, set: setProteinInput, min: 0, max: 500, step: 5, ariaLabel: 'Daily protein goal (0-500g)' },
              { label: 'Carbohydrates', unit: 'g / day', value: carbsInput, set: setCarbsInput, min: 0, max: 1000, step: 10, ariaLabel: 'Daily carbohydrate goal (0-1000g)' },
              { label: 'Fat', unit: 'g / day', value: fatInput, set: setFatInput, min: 0, max: 500, step: 5, ariaLabel: 'Daily fat goal (0-500g)' },
            ].map(({ label, unit, value, set, min, max, step, ariaLabel }) => (
              <div key={label} className="flex gap-3 items-center">
                <div className="flex-1">
                  <p className="text-sm text-text-primary">{label}</p>
                </div>
                <input
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  aria-label={ariaLabel}
                  className="w-24 px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-center text-sm font-mono focus:outline-none focus:border-accent"
                />
                <span className="text-text-secondary text-xs w-16 shrink-0">{unit}</span>
              </div>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={handleSave}
          className="w-full py-2.5 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Save Goals
        </button>

        <p className="text-xs text-text-secondary text-center">
          Goals sync across devices and inform your AI-powered health insights.
        </p>
      </main>
    </div>
  )
}
