'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Check, X, PencilLine } from 'lucide-react'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'other'] as const
type MealType = (typeof MEAL_TYPES)[number]

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
  other: 'Other',
}

interface MealItem {
  id: string
  meal_id: string
  name: string
  brand: string | null
  serving_size: string
  servings: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Meal {
  id: string
  name: string
  meal_type: string
  logged_at: string
  meal_items: MealItem[]
}

interface NutritionTargets {
  calories_target: number
  protein_target: number
  carbs_target: number
  fat_target: number
}

interface MacroCardProps {
  label: string
  consumed: number
  target: number
  unit: string
  borderColor: string
  textColor: string
  barColor: string
}

interface FoodItemRowProps {
  item: MealItem
  isEditing: boolean
  editValue: string
  onEditValueChange: (v: string) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
}

interface ManualFormState {
  name: string
  calories: string
  protein: string
  carbs: string
  fat: string
  meal_type: MealType
}

const EMPTY_FORM: ManualFormState = {
  name: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  meal_type: 'breakfast',
}

interface Props {
  initialMeals: Meal[]
  targets: NutritionTargets
  dateStr: string
}

export function DiaryMealsClient({ initialMeals, targets, dateStr }: Props) {
  const [meals, setMeals] = useState<Meal[]>(initialMeals)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showManualForm, setShowManualForm] = useState(false)
  const [form, setForm] = useState<ManualFormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [mealFilter, setMealFilter] = useState<string>('All')

  const allItems = meals.flatMap((m) => m.meal_items ?? [])
  
  const filtered = allItems.filter(
    (item) =>
      (mealFilter === 'All' || item.name.toLowerCase().includes(mealFilter.toLowerCase())) &&
      item.name.toLowerCase().includes(search.toLowerCase())
  )

  const consumed = {
    calories: filtered.reduce((s, i) => s + i.calories * i.servings, 0),
    protein: filtered.reduce((s, i) => s + i.protein * i.servings, 0),
    carbs: filtered.reduce((s, i) => s + i.carbs * i.servings, 0),
    fat: filtered.reduce((s, i) => s + i.fat * i.servings, 0),
  }

  const grouped: Partial<Record<MealType, MealItem[]>> = {}
  for (const meal of meals) {
    const type: MealType = (MEAL_TYPES as readonly string[]).includes(meal.meal_type)
      ? (meal.meal_type as MealType)
      : 'other'
    if (!grouped[type]) grouped[type] = []
    const mealItems = (meal.meal_items ?? []).filter((item) =>
      (mealFilter === 'All' || item.name.toLowerCase().includes(mealFilter.toLowerCase())) &&
      item.name.toLowerCase().includes(search.toLowerCase())
    )
    grouped[type]!.push(...mealItems)
  }

  const hasAnyMeals = allItems.length > 0

  async function handleDelete(itemId: string) {
    if (!window.confirm('Remove this item from your diary?')) return
    const previous = meals
    setMeals((prev) =>
      prev.map((m) => ({
        ...m,
        meal_items: (m.meal_items ?? []).filter((i) => i.id !== itemId),
      }))
    )
    const res = await fetch(`/api/food/diary?id=${encodeURIComponent(itemId)}`, { method: 'DELETE' })
    if (!res.ok) {
      setMeals(previous)
      setFormError('Failed to delete item. Please try again.')
    }
  }

  function startEdit(item: MealItem) {
    setEditingId(item.id)
    setEditValue(String(item.servings))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  async function saveEdit(item: MealItem) {
    const newServings = parseFloat(editValue)
    if (isNaN(newServings) || newServings <= 0) {
      cancelEdit()
      return
    }
    const previous = meals
    setMeals((prev) =>
      prev.map((m) => ({
        ...m,
        meal_items: (m.meal_items ?? []).map((i) =>
          i.id === item.id ? { ...i, servings: newServings } : i
        ),
      }))
    )
    setEditingId(null)
    setEditValue('')
    const res = await fetch('/api/food/diary', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, servings: newServings }),
    })
    if (!res.ok) {
      setMeals(previous)
      setFormError('Failed to update serving size. Please try again.')
    }
  }

  function updateForm(field: keyof ManualFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setFormError('Food name is required')
      return
    }
    setFormError(null)
    setSubmitting(true)

    const calories = parseInt(form.calories || '0', 10)
    const protein = parseFloat(form.protein || '0')
    const carbs = parseFloat(form.carbs || '0')
    const fat = parseFloat(form.fat || '0')

    const loggedAt = new Date(`${dateStr}T12:00:00.000Z`).toISOString()

    const payload = {
      name: form.name.trim(),
      meal_type: form.meal_type,
      logged_at: loggedAt,
      items: [
        {
          name: form.name.trim(),
          serving_size: '1 serving',
          servings: 1,
          calories,
          protein,
          carbs,
          fat,
          source: 'manual' as const,
        },
      ],
    }

    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setFormError((data as { error?: string }).error ?? 'Failed to save entry')
        setSubmitting(false)
        return
      }

      const { meal } = (await res.json()) as { meal: Meal }
      setMeals((prev) => [...prev, meal])
      setForm(EMPTY_FORM)
      setShowManualForm(false)
    } catch {
      setFormError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Search, date picker, and meal filter */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="search"
          placeholder="Search foods…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-surface rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary border border-border focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <div className="flex gap-1 flex-wrap sm:flex-nowrap">
          {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((m) => (
            <button
              key={m}
              onClick={() => setMealFilter(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                mealFilter === m
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-surface border border-border text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Nutrition summary cards */}
      <div className="grid grid-cols-4 gap-2">
        <MacroCard
          label="Calories"
          consumed={Math.round(consumed.calories)}
          target={targets.calories_target}
          unit="kcal"
          borderColor="border-orange-400"
          textColor="text-orange-500"
          barColor="bg-orange-400"
        />
        <MacroCard
          label="Protein"
          consumed={Math.round(consumed.protein)}
          target={targets.protein_target}
          unit="g"
          borderColor="border-blue-400"
          textColor="text-blue-500"
          barColor="bg-blue-400"
        />
        <MacroCard
          label="Carbs"
          consumed={Math.round(consumed.carbs)}
          target={targets.carbs_target}
          unit="g"
          borderColor="border-yellow-400"
          textColor="text-yellow-500"
          barColor="bg-yellow-400"
        />
        <MacroCard
          label="Fat"
          consumed={Math.round(consumed.fat)}
          target={targets.fat_target}
          unit="g"
          borderColor="border-red-400"
          textColor="text-red-500"
          barColor="bg-red-400"
        />
      </div>

      {/* Log manually button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setShowManualForm((v) => !v)
            setFormError(null)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-surface border border-border text-text-primary hover:bg-surface-secondary transition-colors"
          aria-expanded={showManualForm}
        >
          <PencilLine className="w-4 h-4" />
          Log manually
        </button>
      </div>

      {/* Inline manual entry form */}
      {showManualForm && (
        <form
          onSubmit={handleManualSubmit}
          className="bg-surface rounded-2xl p-4 space-y-4 border border-border"
        >
          <h2 className="font-semibold text-text-primary text-sm">Add food manually</h2>

          {formError && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          {/* Food name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary" htmlFor="manual-name">
              Food name <span className="text-red-500">*</span>
            </label>
            <input
              id="manual-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder="e.g. Homemade pasta"
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface-secondary text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Macro fields */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                { key: 'calories', label: 'Calories', unit: 'kcal' },
                { key: 'protein', label: 'Protein', unit: 'g' },
                { key: 'carbs', label: 'Carbs', unit: 'g' },
                { key: 'fat', label: 'Fat', unit: 'g' },
              ] as { key: keyof ManualFormState; label: string; unit: string }[]
            ).map(({ key, label, unit }) => (
              <div key={key} className="space-y-1">
                <label
                  className="text-xs font-medium text-text-secondary"
                  htmlFor={`manual-${key}`}
                >
                  {label} ({unit})
                </label>
                <input
                  id={`manual-${key}`}
                  type="number"
                  min="0"
                  step={key === 'calories' ? '1' : '0.1'}
                  value={form[key]}
                  onChange={(e) => updateForm(key, e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface-secondary text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            ))}
          </div>

          {/* Meal type */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary" htmlFor="manual-meal-type">
              Meal type
            </label>
            <select
              id="manual-meal-type"
              value={form.meal_type}
              onChange={(e) => updateForm('meal_type', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface-secondary text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {MEAL_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowManualForm(false)
                setForm(EMPTY_FORM)
                setFormError(null)
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Saving…' : 'Add entry'}
            </button>
          </div>
        </form>
      )}

      {hasAnyMeals ? (
        <div className="space-y-4">
          {MEAL_TYPES.map((mealType) => {
            const items = grouped[mealType]
            if (!items || items.length === 0) return null
            const typeCalories = Math.round(
              items.reduce((s, i) => s + i.calories * i.servings, 0)
            )
            return (
              <section key={mealType} className="bg-surface rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-text-primary">{MEAL_LABELS[mealType]}</h2>
                  <span className="text-sm text-text-secondary">{typeCalories} kcal</span>
                </div>
                <div className="divide-y divide-border">
                  {items.map((item) => (
                    <FoodItemRow
                      key={item.id}
                      item={item}
                      isEditing={editingId === item.id}
                      editValue={editValue}
                      onEditValueChange={setEditValue}
                      onEdit={() => startEdit(item)}
                      onSave={() => saveEdit(item)}
                      onCancel={cancelEdit}
                      onDelete={() => handleDelete(item.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <EmptyDay dateStr={dateStr} />
      )}
    </>
  )
}

function MacroCard({
  label,
  consumed,
  target,
  unit,
  borderColor,
  textColor,
  barColor,
}: MacroCardProps) {
  const pct = Math.min(100, target > 0 ? Math.round((consumed / target) * 100) : 0)
  const isOver = target > 0 && consumed > target * 1.05
  const isLow = target > 0 && consumed < target * 0.2 && label !== 'Fat'
  return (
    <div className={`bg-surface rounded-xl p-3 border-t-2 ${isOver ? 'border-red-500' : borderColor} flex flex-col gap-1 ${isOver ? 'ring-1 ring-red-500/30' : ''}`}>
      <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wide truncate">
        {label}
      </p>
      <div className="flex items-center gap-1">
        <p className={`text-base font-bold ${isOver ? 'text-red-500' : textColor} leading-none`}>{consumed}</p>
        {isOver && <span className="text-[9px] font-bold text-red-500 leading-none">↑</span>}
      </div>
      <p className="text-[10px] text-text-tertiary">
        / {target} {unit}
      </p>
      <div className="w-full h-1 bg-surface-secondary rounded-full overflow-hidden mt-1">
        <div
          className={`h-full rounded-full ${isOver ? 'bg-red-400' : barColor}`}
          style={{ width: `${isOver ? 100 : pct}%` }}
        />
      </div>
      {isLow && (
        <p className="text-[9px] text-amber-500 font-medium mt-0.5">Low</p>
      )}
    </div>
  )
}

function FoodItemRow({
  item,
  isEditing,
  editValue,
  onEditValueChange,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: FoodItemRowProps) {
  const totalCalories = Math.round(item.calories * item.servings)
  const totalProtein = (item.protein * item.servings).toFixed(1)
  const totalCarbs = (item.carbs * item.servings).toFixed(1)
  const totalFat = (item.fat * item.servings).toFixed(1)

  return (
    <div className="py-3 flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
        {item.brand && (
          <p className="text-xs text-text-tertiary truncate">{item.brand}</p>
        )}
        {isEditing ? (
          <div className="flex items-center gap-1.5 mt-1">
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSave()
                if (e.key === 'Escape') onCancel()
              }}
              autoFocus
              className="w-20 text-xs px-2 py-1 rounded-lg border border-border bg-surface-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <span className="text-xs text-text-secondary">× {item.serving_size}</span>
            <button
              onClick={onSave}
              className="p-1 rounded text-green-500 hover:bg-surface-secondary transition-colors"
              aria-label="Save serving size"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onCancel}
              className="p-1 rounded text-text-secondary hover:bg-surface-secondary transition-colors"
              aria-label="Cancel edit"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-xs text-text-secondary mt-0.5">
            {item.servings !== 1 ? `${item.servings} × ` : ''}
            {item.serving_size}
          </p>
        )}
        <p className="text-xs text-text-tertiary mt-1">
          P {totalProtein}g · C {totalCarbs}g · F {totalFat}g
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="text-right">
          <p className="text-sm font-semibold text-text-primary">{totalCalories}</p>
          <p className="text-[10px] text-text-tertiary">kcal</p>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1 rounded text-text-secondary hover:text-accent hover:bg-surface-secondary transition-colors"
              aria-label="Edit serving size"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded text-text-secondary hover:text-red-500 hover:bg-surface-secondary transition-colors"
              aria-label="Delete item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyDay({ dateStr }: { dateStr: string }) {
  const today = new Date().toISOString().slice(0, 10)
  const isToday = dateStr === today

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
        <span className="text-4xl" role="img" aria-label="Empty plate">
          🍽️
        </span>
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-text-primary">
          No meals logged{isToday ? ' today' : ''}
        </p>
        <p className="text-sm text-text-secondary">Start tracking your food intake</p>
      </div>
      <Link
        href="/food/scanner"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors"
      >
        📷 Scan Food
      </Link>
    </div>
  )
}
