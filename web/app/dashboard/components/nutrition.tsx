'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { BarcodeScanner, FoodImageRecognition, AddFoodButton } from './food-scanner'

interface MacroData {
  calories: { consumed: number; target: number; burned: number }
  protein: { consumed: number; target: number }
  carbs: { consumed: number; target: number }
  fat: { consumed: number; target: number }
  water: { consumed: number; target: number } // in ml
  fiber: { consumed: number; target: number }
}

interface Meal {
  id: string
  name: string
  time: string
  calories: number
  protein: number
  carbs: number
  fat: number
  image?: string
}

const MACRO_COLORS = {
  protein: '#EF4444',
  carbs: '#3B82F6',
  fat: '#F59E0B',
}

interface FoodItem {
  name: string
  brand?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  servingSize: string
  barcode?: string
  imageUrl?: string
  source?: 'barcode' | 'ai_recognition' | 'manual' | 'search'
  confidence?: number
}

// Helper to determine meal type based on time
function getMealType(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 15) return 'lunch'
  if (hour >= 17 && hour < 21) return 'dinner'
  return 'snack'
}

// Helper to format meal name
function getMealName(type: string): string {
  const names = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
  }
  return names[type as keyof typeof names] || 'Meal'
}

// Save meal to database
async function saveMealToDatabase(foods: FoodItem[]): Promise<{ success: boolean; error?: string }> {
  try {
    const mealType = getMealType()
    const mealName = getMealName(mealType)

    const response = await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: mealName,
        meal_type: mealType,
        items: foods.map((food) => ({
          name: food.name,
          brand: food.brand,
          barcode: food.barcode,
          serving_size: food.servingSize,
          servings: 1,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber,
          sugar: food.sugar,
          sodium: food.sodium,
          source: food.source || 'manual',
          confidence: food.confidence,
        })),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to save meal' }
    }

    return { success: true }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error saving meal:', error)
    }
    return { success: false, error: 'Failed to save meal' }
  }
}

export function NutritionOverview({ data, onFoodAdded, onMealSaved }: {
  data: MacroData
  onFoodAdded?: (food: FoodItem) => void
  onMealSaved?: () => void
}) {
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showImageRecognition, setShowImageRecognition] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const netCalories = data.calories.consumed - data.calories.burned
  const calorieProgress = (data.calories.consumed / data.calories.target) * 100

  const macroData = [
    { name: 'Protein', value: data.protein.consumed, color: MACRO_COLORS.protein },
    { name: 'Carbs', value: data.carbs.consumed, color: MACRO_COLORS.carbs },
    { name: 'Fat', value: data.fat.consumed, color: MACRO_COLORS.fat },
  ]

  const handleFoodFound = async (food: FoodItem) => {
    setShowBarcodeScanner(false)
    setIsSaving(true)
    setSaveMessage(null)

    const foodWithSource = { ...food, source: 'barcode' as const }
    const result = await saveMealToDatabase([foodWithSource])

    setIsSaving(false)
    if (result.success) {
      setSaveMessage({ type: 'success', text: `Added ${food.name} to your log!` })
      onFoodAdded?.(food)
      onMealSaved?.()
      setTimeout(() => setSaveMessage(null), 3000)
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Failed to save' })
    }
  }

  const handleFoodsRecognized = async (foods: FoodItem[]) => {
    setShowImageRecognition(false)
    setIsSaving(true)
    setSaveMessage(null)

    const foodsWithSource = foods.map((f) => ({ ...f, source: 'ai_recognition' as const }))
    const result = await saveMealToDatabase(foodsWithSource)

    setIsSaving(false)
    if (result.success) {
      setSaveMessage({ type: 'success', text: `Added ${foods.length} item(s) to your log!` })
      foods.forEach((food) => onFoodAdded?.(food))
      onMealSaved?.()
      setTimeout(() => setSaveMessage(null), 3000)
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Failed to save' })
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nutrition</h3>
        <AddFoodButton
          onScanBarcode={() => setShowBarcodeScanner(true)}
          onRecognizeFood={() => setShowImageRecognition(true)}
        />
      </div>

      {showBarcodeScanner && (
        <BarcodeScanner
          onFoodFound={handleFoodFound}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {showImageRecognition && (
        <FoodImageRecognition
          onFoodRecognized={handleFoodsRecognized}
          onClose={() => setShowImageRecognition(false)}
        />
      )}

      {/* Saving indicator */}
      {isSaving && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
          <span className="text-sm text-purple-600 dark:text-purple-400">Saving to your log...</span>
        </div>
      )}

      {/* Save message */}
      {saveMessage && (
        <div className={`mb-4 p-3 rounded-xl ${
          saveMessage.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
        }`}>
          <span className="text-sm">{saveMessage.text}</span>
        </div>
      )}

      <div className="flex items-center gap-6">
        {/* Calorie ring */}
        <div className="relative w-36 h-36">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="72" cy="72" r="60" fill="none" stroke="#E5E7EB" strokeWidth="12" className="dark:stroke-gray-700" />
            <circle
              cx="72"
              cy="72"
              r="60"
              fill="none"
              stroke="url(#calorieGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${Math.min(calorieProgress, 100) * 3.77} 377`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{data.calories.consumed}</span>
            <span className="text-xs text-gray-500">/ {data.calories.target} kcal</span>
          </div>
        </div>

        {/* Macro breakdown */}
        <div className="flex-1 space-y-3">
          {macroData.map((macro) => {
            const target = data[macro.name.toLowerCase() as keyof typeof data] as { consumed: number; target: number }
            const progress = (macro.value / target.target) * 100

            return (
              <div key={macro.name}>
                <div className="flex justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: macro.color }} />
                    <span className="text-gray-600 dark:text-gray-400">{macro.name}</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {macro.value}g <span className="text-gray-400">/ {target.target}g</span>
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: macro.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <QuickStat label="Net" value={`${netCalories > 0 ? '+' : ''}${netCalories}`} unit="kcal" color={netCalories > 0 ? 'text-orange-500' : 'text-green-500'} />
        <QuickStat label="Burned" value={data.calories.burned.toString()} unit="kcal" color="text-red-500" />
        <QuickStat label="Water" value={(data.water.consumed / 1000).toFixed(1)} unit="L" color="text-blue-500" />
        <QuickStat label="Fiber" value={data.fiber.consumed.toString()} unit="g" color="text-green-500" />
      </div>
    </div>
  )
}

function QuickStat({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label} ({unit})</div>
    </div>
  )
}

export function MealLog({ meals }: { meals: Meal[] }) {
  const mealIcons: Record<string, string> = {
    breakfast: '🍳',
    lunch: '🥗',
    dinner: '🍽️',
    snack: '🍎',
    default: '🍴',
  }

  const getMealIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('breakfast')) return mealIcons.breakfast
    if (lower.includes('lunch')) return mealIcons.lunch
    if (lower.includes('dinner')) return mealIcons.dinner
    if (lower.includes('snack')) return mealIcons.snack
    return mealIcons.default
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today&apos;s Meals</h3>
        <span className="text-sm text-gray-500">{meals.reduce((sum, m) => sum + m.calories, 0)} kcal total</span>
      </div>

      <div className="space-y-3">
        {meals.map((meal) => (
          <div
            key={meal.id}
            className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 flex items-center justify-center text-2xl">
              {getMealIcon(meal.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white truncate">{meal.name}</div>
              <div className="text-sm text-gray-500">{meal.time}</div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900 dark:text-white">{meal.calories} kcal</div>
              <div className="text-xs text-gray-500">
                P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
              </div>
            </div>
          </div>
        ))}
      </div>

      {meals.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🍽️</div>
          <p className="text-gray-500">No meals logged yet</p>
          <button className="mt-3 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition">
            Log your first meal
          </button>
        </div>
      )}
    </div>
  )
}

export function WaterTracker({ consumed, target, onWaterAdded }: {
  consumed: number
  target: number
  onWaterAdded?: (newTotal: number) => void
}) {
  const [currentConsumed, setCurrentConsumed] = useState(consumed)
  const [isAdding, setIsAdding] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const glasses = Math.ceil(target / 250) // 250ml per glass
  const filledGlasses = Math.floor(currentConsumed / 250)

  const addWater = async (amount: number) => {
    setIsAdding(true)
    setMessage(null)

    try {
      const response = await fetch('/api/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_ml: amount, source: 'quick_add' }),
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentConsumed(data.daily_total_ml)
        setMessage(`+${amount}ml added!`)
        onWaterAdded?.(data.daily_total_ml)
        setTimeout(() => setMessage(null), 2000)
      } else {
        setMessage('Failed to save')
      }
    } catch (error) {
      setMessage('Failed to save')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white/80">Water Intake</h3>
          <div className="text-3xl font-bold mt-1">{(currentConsumed / 1000).toFixed(1)}L</div>
          <div className="text-sm text-white/70">of {(target / 1000).toFixed(1)}L goal</div>
        </div>
        <div className="text-5xl">💧</div>
      </div>

      {message && (
        <div className="mb-3 py-1 px-3 bg-white/20 rounded-lg text-sm text-center">
          {message}
        </div>
      )}

      <div className="flex gap-1 mb-4">
        {[...Array(glasses)].map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-8 rounded-lg transition-all ${
              i < filledGlasses ? 'bg-white' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => addWater(250)}
          disabled={isAdding}
          className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          {isAdding ? '...' : '+ 250ml'}
        </button>
        <button
          onClick={() => addWater(500)}
          disabled={isAdding}
          className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          {isAdding ? '...' : '+ 500ml'}
        </button>
      </div>
    </div>
  )
}

export function MacroDistribution({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein * 4 + carbs * 4 + fat * 9 // calories from macros
  const data = [
    { name: 'Protein', value: (protein * 4 / total) * 100, grams: protein, color: '#EF4444' },
    { name: 'Carbs', value: (carbs * 4 / total) * 100, grams: carbs, color: '#3B82F6' },
    { name: 'Fat', value: (fat * 9 / total) * 100, grams: fat, color: '#F59E0B' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Macro Split</h3>

      <div className="flex items-center gap-6">
        <div className="w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={50}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          {data.map((macro) => (
            <div key={macro.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }} />
                <span className="text-sm text-gray-600 dark:text-gray-400">{macro.name}</span>
              </div>
              <div className="text-right">
                <span className="font-medium text-gray-900 dark:text-white">{macro.value.toFixed(0)}%</span>
                <span className="text-xs text-gray-400 ml-2">({macro.grams}g)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface FastingSession {
  id: string
  protocol: string
  target_hours: number
  started_at: string
  ended_at?: string
  elapsed_hours?: number
  remaining_hours?: number
  progress_percent?: number
}

export function FastingTimer({
  initialSession,
  defaultProtocol = '16:8',
  defaultHours = 16,
  onSessionChanged
}: {
  initialSession?: FastingSession | null
  defaultProtocol?: string
  defaultHours?: number
  onSessionChanged?: () => void
}) {
  const [session, setSession] = useState<FastingSession | null>(initialSession || null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const targetHours = session?.target_hours || defaultHours
  const protocol = session?.protocol || defaultProtocol

  // Update elapsed time every minute
  useEffect(() => {
    if (!session?.started_at) {
      setElapsed(0)
      return
    }

    const updateElapsed = () => {
      const start = new Date(session.started_at)
      const now = new Date()
      const hours = (now.getTime() - start.getTime()) / 1000 / 60 / 60
      setElapsed(hours)
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [session?.started_at])

  const progress = Math.min((elapsed / targetHours) * 100, 100)
  const remaining = Math.max(targetHours - elapsed, 0)

  const formatTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const startFast = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/fasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: defaultProtocol,
          target_hours: defaultHours,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSession(data.session)
        setMessage('Fast started!')
        onSessionChanged?.()
        setTimeout(() => setMessage(null), 2000)
      } else {
        setMessage(data.error || 'Failed to start fast')
      }
    } catch (error) {
      setMessage('Failed to start fast')
    } finally {
      setIsLoading(false)
    }
  }

  const endFast = async () => {
    if (!session) return

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/fasting', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: session.id }),
      })

      const data = await response.json()

      if (response.ok) {
        const completedMessage = data.completed
          ? `Fast completed! ${data.actual_hours.toFixed(1)} hours`
          : `Fast ended early at ${data.actual_hours.toFixed(1)} hours`
        setMessage(completedMessage)
        setSession(null)
        onSessionChanged?.()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage(data.error || 'Failed to end fast')
      }
    } catch (error) {
      setMessage('Failed to end fast')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/80">Intermittent Fasting</h3>
        <span className="px-2 py-1 bg-white/20 rounded-full text-xs">{protocol}</span>
      </div>

      {message && (
        <div className="mb-3 py-1 px-3 bg-white/20 rounded-lg text-sm text-center">
          {message}
        </div>
      )}

      <div className="relative w-40 h-40 mx-auto mb-4">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="80" cy="80" r="70" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="8" />
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${progress * 4.4} 440`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{formatTime(elapsed)}</span>
          <span className="text-sm text-white/70">{session ? 'elapsed' : 'ready'}</span>
        </div>
      </div>

      <div className="text-center">
        {session ? (
          remaining > 0 ? (
            <p className="text-white/80">{formatTime(remaining)} until eating window</p>
          ) : (
            <p className="text-green-300">Eating window open!</p>
          )
        ) : (
          <p className="text-white/80">Start a {targetHours}-hour fast</p>
        )}
      </div>

      <button
        onClick={session ? endFast : startFast}
        disabled={isLoading}
        className="w-full mt-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition disabled:opacity-50"
      >
        {isLoading ? '...' : session ? 'End Fast' : 'Start Fast'}
      </button>
    </div>
  )
}
