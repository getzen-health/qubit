'use client'
import { useState, useEffect } from 'react'
import { ChefHat, RefreshCw, Loader2 } from 'lucide-react'

const DIET_TYPES = ['omnivore', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean']
const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_ICONS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

interface MealItem {
  id: string; day_number: number; meal_type: string
  name: string; description: string
  calories: number; protein_g: number; carbs_g: number; fat_g: number
}
interface MealPlan {
  id: string; diet_type: string; title: string; created_at: string
  meal_plan_items: MealItem[]
}

export default function MealPlanPage() {
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [dietType, setDietType] = useState('omnivore')
  const [allergies, setAllergies] = useState('')
  const [activeDay, setActiveDay] = useState(1)

  useEffect(() => {
    fetch('/api/meal-plan').then(r => r.json()).then(d => {
      setPlan(d.data); setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function generate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dietType, allergies }),
      })
      const data = await res.json()
      if (data.planId) {
        // Refetch
        const r = await fetch('/api/meal-plan')
        const d = await r.json()
        setPlan(d.data)
      }
    } finally {
      setGenerating(false)
    }
  }

  const dayMeals = (plan?.meal_plan_items ?? []).filter(m => m.day_number === activeDay)
  const dayCalories = dayMeals.reduce((s, m) => s + (m.calories ?? 0), 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-text-primary">Meal Plan</h1>
        </div>
        {plan && (
          <button onClick={generate} disabled={generating}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-text-secondary hover:text-text-primary">
            <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} /> Regenerate
          </button>
        )}
      </div>

      {!plan && !loading && (
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-text-primary mb-4">Generate Your 7-Day Meal Plan</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Diet Type</label>
              <select value={dietType} onChange={e => setDietType(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2 text-text-primary capitalize">
                {DIET_TYPES.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Allergies / Foods to Avoid</label>
              <input value={allergies} onChange={e => setAllergies(e.target.value)}
                placeholder="e.g. nuts, dairy, gluten"
                className="w-full bg-background border border-border rounded-xl px-4 py-2 text-text-primary" />
            </div>
            <button onClick={generate} disabled={generating}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : '✨ Generate Plan'}
            </button>
          </div>
        </div>
      )}

      {loading && <div className="h-64 animate-pulse bg-surface rounded-2xl" />}

      {plan && (
        <>
          <p className="text-xs text-text-secondary mb-4">
            {plan.title} · Generated {new Date(plan.created_at).toLocaleDateString()}
          </p>

          {/* Day tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {[1,2,3,4,5,6,7].map(d => (
              <button key={d} onClick={() => setActiveDay(d)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeDay === d ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary'}`}>
                {DAY_NAMES[d].slice(0,3)}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-text-primary">{DAY_NAMES[activeDay]}</h2>
            <span className="text-xs text-text-secondary">{dayCalories} kcal total</span>
          </div>

          <div className="space-y-3">
            {['breakfast','lunch','dinner','snack'].map(mealType => {
              const meal = dayMeals.find(m => m.meal_type === mealType)
              if (!meal) return null
              return (
                <div key={mealType} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{MEAL_ICONS[mealType]}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-secondary capitalize">{mealType}</span>
                        <span className="text-xs text-text-secondary">{meal.calories} kcal</span>
                      </div>
                      <p className="font-semibold text-text-primary mt-0.5">{meal.name}</p>
                      {meal.description && <p className="text-xs text-text-secondary mt-1">{meal.description}</p>}
                      <div className="flex gap-3 mt-2">
                        <span className="text-xs text-blue-400">P: {meal.protein_g}g</span>
                        <span className="text-xs text-yellow-400">C: {meal.carbs_g}g</span>
                        <span className="text-xs text-pink-400">F: {meal.fat_g}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {generating && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-surface rounded-2xl p-8 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                <p className="font-semibold text-text-primary">Generating your meal plan...</p>
                <p className="text-sm text-text-secondary mt-1">This takes about 10 seconds</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
