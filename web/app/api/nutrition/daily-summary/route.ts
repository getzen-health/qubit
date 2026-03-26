import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().slice(0, 10)

  // Check if food_logs or food_diary table exists — try both
  const { data: logs } = await supabase
    .from('food_diary')
    .select('calories, protein_g, carbs_g, fat_g, fiber_g')
    .eq('user_id', user.id)
    .gte('logged_at', today)
    .lt('logged_at', today + 'T23:59:59')

  const totals = (logs ?? []).reduce(
    (acc: Record<string, number>, item: any) => ({
      calories: acc.calories + (item.calories ?? 0),
      protein_g: acc.protein_g + (item.protein_g ?? 0),
      carbs_g: acc.carbs_g + (item.carbs_g ?? 0),
      fat_g: acc.fat_g + (item.fat_g ?? 0),
      fiber_g: acc.fiber_g + (item.fiber_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  )

  return NextResponse.json({ date: today, totals, entries: logs?.length ?? 0 })
}
