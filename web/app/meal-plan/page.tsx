'use client'
import { useState, useEffect } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const SLOT_ICONS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

function getMonday(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date.toISOString().slice(0, 10)
}

export default function MealPlanPage() {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [plans, setPlans] = useState<any[]>([])
  const [recipes, setRecipes] = useState<any[]>([])
  const [adding, setAdding] = useState<{ day: number; slot: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = (week: string) => {
    setLoading(true)
    fetch(`/api/meal-plans?week=${week}`).then(r => r.json()).then(d => {
      setPlans(d.plans ?? [])
      setRecipes(d.recipes ?? [])
      setLoading(false)
    })
  }

  useEffect(() => { load(weekStart) }, [weekStart])

  const getPlan = (day: number, slot: string) =>
    plans.find(p => p.day_of_week === day && p.meal_slot === slot)

  const addMeal = async (recipeId: string, recipeName: string) => {
    if (!adding) return
    const res = await fetch('/api/meal-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_of_week: adding.day, meal_slot: adding.slot, recipe_id: recipeId, week_start: weekStart }),
    })
    const d = await res.json()
    if (d.plan) setPlans(prev => [...prev.filter(p => !(p.day_of_week === adding.day && p.meal_slot === adding.slot)), d.plan])
    setAdding(null)
    setSearchQuery('')
  }

  const removeMeal = async (id: string) => {
    await fetch('/api/meal-plans', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setPlans(prev => prev.filter(p => p.id !== id))
  }

  const allTags = [...new Set(recipes.flatMap((r: any) => r.tags ?? []))]
  const filteredRecipes = recipes.filter((r: any) =>
    (!searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!tagFilter || r.tags?.includes(tagFilter))
  )

  // Weekly macro totals
  const weeklyMacros = plans.reduce((acc: any, p: any) => {
    if (!p.recipe) return acc
    return {
      calories: acc.calories + (p.recipe.calories ?? 0),
      protein: acc.protein + (p.recipe.protein_g ?? 0),
      carbs: acc.carbs + (p.recipe.carbs_g ?? 0),
      fat: acc.fat + (p.recipe.fat_g ?? 0),
    }
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const prevWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d.toISOString().slice(0, 10))
  }
  const nextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d.toISOString().slice(0, 10))
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Meal Plan</h1>
            <p className="text-sm text-text-secondary">Plan your week ahead</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="p-2 rounded-xl border border-border bg-white">←</button>
            <span className="text-sm font-medium text-text-primary px-2">
              Week of {new Date(weekStart).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
            <button onClick={nextWeek} className="p-2 rounded-xl border border-border bg-white">→</button>
          </div>
        </div>

        {/* Weekly macro summary */}
        {plans.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: '🔥 Cal', value: `${Math.round(weeklyMacros.calories / 7)}/day` },
              { label: '🥩 Protein', value: `${Math.round(weeklyMacros.protein / 7)}g/day` },
              { label: '🌾 Carbs', value: `${Math.round(weeklyMacros.carbs / 7)}g/day` },
              { label: '🫒 Fat', value: `${Math.round(weeklyMacros.fat / 7)}g/day` },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-xl border border-border p-2 text-center">
                <div className="text-xs text-text-secondary">{m.label}</div>
                <div className="text-sm font-bold text-text-primary">{m.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Weekly grid — scrollable on mobile */}
        <div className="overflow-x-auto">
          <div className="grid grid-cols-8 gap-1 min-w-[700px]">
            {/* Header */}
            <div className="text-xs text-text-secondary p-2 font-medium"></div>
            {DAYS.map(d => (
              <div key={d} className="text-xs text-center font-semibold text-text-secondary p-2">{d}</div>
            ))}

            {/* Rows per slot */}
            {SLOTS.map(slot => (
              <>
                <div key={slot + '-label'} className="flex items-center text-xs text-text-secondary font-medium p-2 capitalize">
                  {SLOT_ICONS[slot]} {slot}
                </div>
                {[0,1,2,3,4,5,6].map(dayIdx => {
                  const plan = getPlan(dayIdx, slot)
                  return (
                    <div
                      key={dayIdx + slot}
                      onClick={() => !plan && setAdding({ day: dayIdx, slot })}
                      className={`min-h-14 rounded-xl border p-1.5 text-xs transition-all cursor-pointer ${
                        plan ? 'border-primary/30 bg-primary/5' : 'border-dashed border-border hover:border-primary hover:bg-surface'
                      }`}
                    >
                      {plan ? (
                        <div className="relative group">
                          <div className="font-medium text-text-primary leading-tight line-clamp-2">{plan.recipe?.name ?? plan.custom_meal_name}</div>
                          {plan.recipe && (
                            <div className="text-text-secondary mt-0.5">{plan.recipe.calories}kcal · {plan.recipe.protein_g}g P</div>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); removeMeal(plan.id) }}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs hidden group-hover:flex items-center justify-center"
                          >×</button>
                        </div>
                      ) : (
                        <div className="text-text-secondary/40 text-center mt-2">+</div>
                      )}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>

        {/* Recipe picker modal */}
        {adding && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setAdding(null)}>
            <div className="bg-white w-full max-w-lg rounded-t-3xl p-4 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-text-primary capitalize">Add {SLOT_ICONS[adding.slot]} {adding.slot} — {DAYS[adding.day]}</h3>
                <button onClick={() => setAdding(null)} className="text-text-secondary">✕</button>
              </div>

              {/* Search */}
              <input type="text" placeholder="Search recipes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm mb-3" />

              {/* Tag filters */}
              <div className="flex gap-2 flex-wrap mb-3">
                <button onClick={() => setTagFilter('')} className={`px-2 py-1 rounded-full text-xs border ${!tagFilter ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary'}`}>All</button>
                {['high-protein','vegan','vegetarian','gluten-free','keto','low-carb','high-fiber'].map(t => (
                  <button key={t} onClick={() => setTagFilter(tagFilter === t ? '' : t)}
                    className={`px-2 py-1 rounded-full text-xs border ${tagFilter === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary'}`}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Recipe list */}
              <div className="space-y-2">
                {filteredRecipes.map((r: any) => (
                  <button key={r.id} onClick={() => addMeal(r.id, r.name)}
                    className="w-full text-left p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-text-primary text-sm">{r.name}</div>
                        <div className="text-xs text-text-secondary mt-0.5">{r.description}</div>
                      </div>
                      <div className="text-right text-xs text-text-secondary ml-2 flex-shrink-0">
                        <div>{r.calories} kcal</div>
                        <div>{r.protein_g}g protein</div>
                        <div>⏱ {r.prep_time_min}min</div>
                      </div>
                    </div>
                    {r.tags && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {r.tags.slice(0,3).map((t: string) => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{t}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
