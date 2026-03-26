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
        </section>
        {/* Sleep Goal */}
        <section className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary">Sleep Hours Goal</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Target hours of sleep per night.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="number"
              min={4}
              max={12}
              step={0.1}
              value={sleepInput}
              onChange={(e) => setSleepInput(e.target.value)}
              aria-label="Sleep hours goal (4-12)"
              className="w-24 px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-center text-lg font-mono focus:outline-none focus:border-accent"
            />
            <span className="text-text-secondary text-sm">hours / night</span>
          </div>
        </section>
        {/* Water Goal */}
        <section className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary">Daily Water Goal (L)</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Daily hydration target in liters.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="number"
              min={0.5}
              max={10}
              step={0.1}
              value={waterInput}
              onChange={(e) => setWaterInput(e.target.value)}
              aria-label="Daily water goal (liters)"
              className="w-24 px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-center text-lg font-mono focus:outline-none focus:border-accent"
            />
            <span className="text-text-secondary text-sm">liters / day</span>
          </div>
        </section>
        {/* Target Weight */}
        <section className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary">Target Weight (kg)</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Optional. Set a target body weight.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="number"
              min={20}
              max={500}
              step={0.1}
              value={weightGoal}
              onChange={(e) => setWeightGoal(e.target.value)}
              aria-label="Target weight (kg)"
              className="w-24 px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-center text-lg font-mono focus:outline-none focus:border-accent"
            />
            <span className="text-text-secondary text-sm">kg</span>
          </div>
        </section>
        {/* Calorie Budget */}
        <section className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary">Daily Calorie Budget</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Daily calorie intake target.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="number"
              min={500}
              max={8000}
              step={10}
              value={calorieInput}
              onChange={(e) => setCalorieInput(e.target.value)}
              aria-label="Daily calorie budget (kcal)"
              className="w-32 px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-center text-lg font-mono focus:outline-none focus:border-accent"
            />
            <span className="text-text-secondary text-sm">kcal / day</span>
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
