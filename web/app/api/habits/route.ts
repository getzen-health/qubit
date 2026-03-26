// Replaced with new smart habits API implementation
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const HabitSchema = z.object({
  name: z.string().min(1),
  icon: z.string().default('⭐'),
  category: z.enum(['health', 'fitness', 'nutrition', 'sleep', 'mental', 'custom']).default('health'),
  target_value: z.number().optional(),
  target_unit: z.string().optional(),
  frequency: z.enum(['daily', 'weekdays', 'weekends', 'custom']).default('daily'),
  reminder_time: z.string().optional(),
  reminder_enabled: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  await checkRateLimit(req, 'healthData')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all active habits
  const { data: habits } = await supabase
    .from('user_habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  // Get completions for last 90 days
  const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)
  const { data: completions } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('user_id', user.id)
    .gte('completed_date', since)

  // Compute streaks and today's status
  const today = new Date().toISOString().slice(0, 10)
  const result = (habits ?? []).map((habit) => {
    const habitCompletions = (completions ?? []).filter((c) => c.habit_id === habit.id)
    // Compute streak
    let streak = 0, best_streak = 0, current = 0
    let prev = null
    for (let i = 0; i < 90; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      if (habitCompletions.some((c) => c.completed_date === d)) {
        current++
        if (current > best_streak) best_streak = current
        if (i === 0) streak = current
      } else {
        if (i === 0) streak = 0
        current = 0
      }
    }
    const is_done_today = habitCompletions.some((c) => c.completed_date === today)
    return {
      ...habit,
      is_done_today,
      current_streak: streak,
      best_streak,
    }
  })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req, 'healthData')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = HabitSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const habit = parsed.data
  const { data, error } = await supabase
    .from('user_habits')
    .insert({ ...habit, user_id: user.id })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
