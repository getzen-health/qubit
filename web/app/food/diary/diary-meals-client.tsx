'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Check, X } from 'lucide-react'

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

interface Props {
  initialMeals: Meal[]
  targets: NutritionTargets
  dateStr: string
}

export function DiaryMealsClient({ initialMeals, targets, dateStr }: Props) {
  const [meals, setMeals] = useState<Meal[]>(initialMeals)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const allItems = meals.flatMap((m) => m.meal_items ?? [])
  const consumed = {
    calories: allItems.reduce((s, i) => s + i.calories * i.servings, 0),
    protein: allItems.reduce((s, i) => s + i.protein * i.servings, 0),
    carbs: allItems.reduce((s, i) => s + i.carbs * i.servings, 0),
    fat: allItems.reduce((s, i) => s + i.fat * i.servings, 0),
  }

  const grouped: Partial<Record<MealType, MealItem[]>> = {}
  for (const meal of meals) {
    const type: MealType = (MEAL_TYPES as readonly string[]).includes(meal.meal_type)
      ? (meal.meal_type as MealType)
      : 'other'
    if (!grouped[type]) grouped[type] = []
    grouped[type]!.push(...(meal.meal_items ?? []))
  }

  const hasAnyMeals = allItems.length > 0

  async function handleDelete(itemId: string) {
    if (!window.confirm('Remove this item from your diary?')) return
    setMeals((prev) =>
      prev.map((m) => ({
        ...m,
        meal_items: (m.meal_items ?? []).filter((i) => i.id !== itemId),
      }))
    )
    await fetch(`/api/food/diary?id=${encodeURIComponent(itemId)}`, { method: 'DELETE' })
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
    await fetch('/api/food/diary', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, servings: newServings }),
    })
  }

  return (
    <>
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
  return (
    <div className={`bg-surface rounded-xl p-3 border-t-2 ${borderColor} flex flex-col gap-1`}>
      <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wide truncate">
        {label}
      </p>
      <p className={`text-base font-bold ${textColor} leading-none`}>{consumed}</p>
      <p className="text-[10px] text-text-tertiary">
        / {target} {unit}
      </p>
      <div className="w-full h-1 bg-surface-secondary rounded-full overflow-hidden mt-1">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
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
