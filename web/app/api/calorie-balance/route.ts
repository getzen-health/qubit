import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const since = sevenDaysAgo.toISOString().split('T')[0]
  
  const [{ data: foodData }, { data: workoutData }, { data: goals }] = await Promise.all([
    supabase.from('food_diary_entries').select('logged_at, calories').eq('user_id', user.id).gte('logged_at', since),
    supabase.from('workout_logs').select('logged_at, calories_burned').eq('user_id', user.id).gte('logged_at', since),
    supabase.from('user_goals').select('calorie_budget').eq('user_id', user.id).single()
  ])
  
  const calorieBudget = goals?.calorie_budget ?? 2000
  const bmr = 1800
  
  // Group by date
  const dayMap: Record<string, { consumed: number; burned: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    dayMap[d.toISOString().split('T')[0]] = { consumed: 0, burned: 0 }
  }
  
  foodData?.forEach(r => {
    const date = r.logged_at.split('T')[0]
    if (dayMap[date]) dayMap[date].consumed += r.calories ?? 0
  })
  workoutData?.forEach(r => {
    const date = r.logged_at.split('T')[0]
    if (dayMap[date]) dayMap[date].burned += r.calories_burned ?? 0
  })
  
  const days = Object.entries(dayMap).map(([date, v]) => ({
    date,
    consumed: v.consumed,
    burned: v.burned,
    bmr,
    balance: v.consumed - (bmr + v.burned),
    surplus: v.consumed > (bmr + v.burned)
  }))
  
  const weeklyAvg = days.reduce((s, d) => s + d.balance, 0) / days.length
  
  return NextResponse.json({ days, weeklyAvg: Math.round(weeklyAvg), calorieBudget })
}
