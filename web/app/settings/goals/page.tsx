'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STEP_KEY = 'kquarks_step_goal'
const CAL_KEY = 'kquarks_calorie_goal'
const SLEEP_KEY = 'kquarks_sleep_goal_minutes'
const DEFAULT_STEP_GOAL = 10000
const DEFAULT_CAL_GOAL = 500
const DEFAULT_SLEEP_GOAL = 480 // 8 hours
const DEFAULT_WATER_GOAL = 2500 // ml
const DEFAULT_CALORIE_INTAKE_GOAL = 2000
const DEFAULT_PROTEIN_GOAL = 150
const DEFAULT_CARBS_GOAL = 250
const DEFAULT_FAT_GOAL = 65

export default function GoalsSettingsPage() {
  const [stepGoal, setStepGoal] = useState(DEFAULT_STEP_GOAL)
  const [stepInput, setStepInput] = useState(DEFAULT_STEP_GOAL.toString())
  const [calGoal, setCalGoal] = useState(DEFAULT_CAL_GOAL)
  const [calInput, setCalInput] = useState(DEFAULT_CAL_GOAL.toString())
  const [sleepGoal, setSleepGoal] = useState(DEFAULT_SLEEP_GOAL)
  const [sleepInput, setSleepInput] = useState((DEFAULT_SLEEP_GOAL / 60).toString())
  const [waterGoal, setWaterGoal] = useState(DEFAULT_WATER_GOAL)
  const [waterInput, setWaterInput] = useState(DEFAULT_WATER_GOAL.toString())
  const [calorieIntakeGoal, setCalorieIntakeGoal] = useState(DEFAULT_CALORIE_INTAKE_GOAL)
  const [calorieIntakeInput, setCalorieIntakeInput] = useState(DEFAULT_CALORIE_INTAKE_GOAL.toString())
  const [proteinGoal, setProteinGoal] = useState(DEFAULT_PROTEIN_GOAL)
  const [proteinInput, setProteinInput] = useState(DEFAULT_PROTEIN_GOAL.toString())
  const [carbsGoal, setCarbsGoal] = useState(DEFAULT_CARBS_GOAL)
  const [carbsInput, setCarbsInput] = useState(DEFAULT_CARBS_GOAL.toString())
  const [fatGoal, setFatGoal] = useState(DEFAULT_FAT_GOAL)
  const [fatInput, setFatInput] = useState(DEFAULT_FAT_GOAL.toString())
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadGoals() {
      // Try DB first
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('step_goal, calorie_goal, sleep_goal_minutes')
          .eq('id', user.id)
          .single()
        if (profile) {
          const s = profile.step_goal ?? DEFAULT_STEP_GOAL
          const c = profile.calorie_goal ?? DEFAULT_CAL_GOAL
          const sl = profile.sleep_goal_minutes ?? DEFAULT_SLEEP_GOAL
          setStepGoal(s); setStepInput(s.toString())
          setCalGoal(c); setCalInput(c.toString())
          setSleepGoal(sl); setSleepInput((sl / 60).toString())
          // Load water + macro goals from nutrition settings
          const { data: nutrition } = await supabase
            .from('user_nutrition_settings')
            .select('water_target_ml, calorie_target, protein_target, carbs_target, fat_target')
            .eq('user_id', user.id)
            .single()
          if (nutrition?.water_target_ml) {
            setWaterGoal(nutrition.water_target_ml)
            setWaterInput(nutrition.water_target_ml.toString())
          }
          if (nutrition?.calorie_target) {
            setCalorieIntakeGoal(nutrition.calorie_target)
            setCalorieIntakeInput(nutrition.calorie_target.toString())
          }
          if (nutrition?.protein_target) {
            setProteinGoal(nutrition.protein_target)
            setProteinInput(nutrition.protein_target.toString())
          }
          if (nutrition?.carbs_target) {
            setCarbsGoal(nutrition.carbs_target)
            setCarbsInput(nutrition.carbs_target.toString())
          }
          if (nutrition?.fat_target) {
            setFatGoal(nutrition.fat_target)
            setFatInput(nutrition.fat_target.toString())
          }
          setLoading(false)
          return
        }
      }
      // Fall back to localStorage
      const storedSteps = localStorage.getItem(STEP_KEY)
      if (storedSteps) { const n = parseInt(storedSteps, 10); if (!isNaN(n) && n > 0) { setStepGoal(n); setStepInput(n.toString()) } }
      const storedCal = localStorage.getItem(CAL_KEY)
      if (storedCal) { const n = parseInt(storedCal, 10); if (!isNaN(n) && n > 0) { setCalGoal(n); setCalInput(n.toString()) } }
      const storedSleep = localStorage.getItem(SLEEP_KEY)
      if (storedSleep) { const n = parseInt(storedSleep, 10); if (!isNaN(n) && n > 0) { setSleepGoal(n); setSleepInput((n / 60).toString()) } }
      setLoading(false)
    }
    loadGoals()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    const steps = parseInt(stepInput, 10)
    const cal = parseInt(calInput, 10)
    const sleepHours = parseFloat(sleepInput)
    const sleepMin = Math.round(sleepHours * 60)
    const water = parseInt(waterInput, 10)
    const calorieIntake = parseInt(calorieIntakeInput, 10)
    const protein = parseInt(proteinInput, 10)
    const carbs = parseInt(carbsInput, 10)
    const fat = parseInt(fatInput, 10)

    if (isNaN(steps) || steps <= 0 || steps > 100000) return
    if (isNaN(cal) || cal <= 0 || cal > 5000) return
    if (isNaN(sleepHours) || sleepHours < 4 || sleepHours > 12) return
    if (isNaN(water) || water < 500 || water > 6000) return
    if (isNaN(calorieIntake) || calorieIntake < 500 || calorieIntake > 8000) return
    if (isNaN(protein) || protein < 0 || protein > 500) return
    if (isNaN(carbs) || carbs < 0 || carbs > 1000) return
    if (isNaN(fat) || fat < 0 || fat > 500) return

    setStepGoal(steps)
    setCalGoal(cal)
    setSleepGoal(sleepMin)
    setWaterGoal(water)
    setCalorieIntakeGoal(calorieIntake)
    setProteinGoal(protein)
    setCarbsGoal(carbs)
    setFatGoal(fat)

    // Save to DB (best effort)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await Promise.all([
        supabase
          .from('users')
          .update({ step_goal: steps, calorie_goal: cal, sleep_goal_minutes: sleepMin })
          .eq('id', user.id),
        supabase
          .from('user_nutrition_settings')
          .upsert({
            user_id: user.id,
            water_target_ml: water,
            calorie_target: calorieIntake,
            protein_target: protein,
            carbs_target: carbs,
            fat_target: fat,
          }, { onConflict: 'user_id' }),
      ])
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
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
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <h1 className="text-xl font-bold text-text-primary">Goals</h1>
          {saved && <span className="ml-auto text-sm text-accent">Saved</span>}
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
              { label: 'Calorie Intake', unit: 'kcal / day', value: calorieIntakeInput, set: setCalorieIntakeInput, min: 500, max: 8000, step: 100 },
              { label: 'Protein', unit: 'g / day', value: proteinInput, set: setProteinInput, min: 0, max: 500, step: 5 },
              { label: 'Carbohydrates', unit: 'g / day', value: carbsInput, set: setCarbsInput, min: 0, max: 1000, step: 10 },
              { label: 'Fat', unit: 'g / day', value: fatInput, set: setFatInput, min: 0, max: 500, step: 5 },
            ].map(({ label, unit, value, set, min, max, step }) => (
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
