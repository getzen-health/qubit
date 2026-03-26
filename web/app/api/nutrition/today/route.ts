import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data, error } = await supabase
    .from('food_diary_entries')
    .select('calories, protein_g, carbs_g, fat_g, servings')
    .eq('user_id', user.id)
    .gte('logged_at', today.toISOString())
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  const totals = (data ?? []).reduce(
    (acc, entry) => {
      const s = entry.servings ?? 1
      return {
        calories: acc.calories + (entry.calories ?? 0) * s,
        protein_g: acc.protein_g + (entry.protein_g ?? 0) * s,
        carbs_g: acc.carbs_g + (entry.carbs_g ?? 0) * s,
        fat_g: acc.fat_g + (entry.fat_g ?? 0) * s,
      }
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )
  
  return NextResponse.json({ data: totals })
}
