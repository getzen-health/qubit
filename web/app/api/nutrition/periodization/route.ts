import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BASELINE = { calories: 2000, protein: 150, carbs: 250, fat: 65 }

type Phase = 'high-carb' | 'low-carb' | 'moderate'

interface PeriodizationResult {
  calories: number
  protein: number
  carbs: number
  fat: number
  phase: Phase
  rationale: string
  workoutDuration?: number
  caloriesBurned?: number
}

/**
 * GET /api/nutrition/periodization
 *
 * Returns today's recommended macros based on today's training load.
 * Accepts optional `override` query param: "training" | "rest"
 */
export async function GET(request: Request) {
  try {
  try {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Defensive: if user is missing required fields, return baseline defaults
  if (!user.id) {
    return NextResponse.json({
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65,
      phase: 'moderate',
      rationale: 'User profile incomplete. Showing baseline macros.'
    })
  }

  const url = new URL(request.url)
  const override = url.searchParams.get('override') // 'training' | 'rest' | null

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  let workoutDuration = 0
  let caloriesBurned = 0

  // Skip DB query if override is provided
  if (!override) {
    const { data: workouts } = await supabase
      .from('workout_records')
      .select('duration_minutes, total_calories, active_calories')
      .eq('user_id', user.id)
      .gte('start_time', todayStart.toISOString())
      .lte('start_time', todayEnd.toISOString())

    if (workouts && workouts.length > 0) {
      workoutDuration = workouts.reduce((s: number, w: { duration_minutes: number }) => s + (w.duration_minutes ?? 0), 0)
      caloriesBurned = workouts.reduce((s: number, w: { total_calories: number | null; active_calories: number | null }) =>
        s + (w.total_calories ?? w.active_calories ?? 0), 0)
    }
  }

  const isHeavyDay =
    override === 'training' ||
    (!override && (workoutDuration > 45 || caloriesBurned > 500))
  const isRestDay = override === 'rest' || (!override && !isHeavyDay)

  let result: PeriodizationResult

  if (isHeavyDay) {
    result = {
      calories: Math.round(BASELINE.calories + caloriesBurned * 0.5),
      protein: BASELINE.protein,
      carbs: Math.round(BASELINE.carbs * 1.3),
      fat: Math.round(BASELINE.fat * 0.9),
      phase: 'high-carb',
      rationale: `Training day detected (${workoutDuration > 0 ? `${workoutDuration} min` : 'override'}). Carbs increased 30% to fuel performance and recovery. Fat slightly reduced.`,
      workoutDuration,
      caloriesBurned: Math.round(caloriesBurned),
    }
  } else if (isRestDay) {
    result = {
      calories: Math.round(BASELINE.calories * 0.9),
      protein: Math.round(BASELINE.protein * 1.1),
      carbs: Math.round(BASELINE.carbs * 0.75),
      fat: Math.round(BASELINE.fat * 1.1),
      phase: 'low-carb',
      rationale: 'Rest day. Carbs reduced, protein and fat increased to support muscle repair and maintain satiety.',
      workoutDuration: 0,
      caloriesBurned: 0,
    }
  } else {
    result = {
      calories: BASELINE.calories,
      protein: BASELINE.protein,
      carbs: BASELINE.carbs,
      fat: BASELINE.fat,
      phase: 'moderate',
      rationale: 'Moderate activity day. Baseline macros recommended.',
      workoutDuration,
      caloriesBurned: Math.round(caloriesBurned),
    }
  }

  return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate periodization' }, { status: 500 })
  }
}
