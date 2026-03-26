import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateTargetCalories, calculateMacroTargets } from '@/lib/nutrition/bmr'

export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('weight_kg, height_cm, age, sex, activity_level, goal')
    .eq('id', user.id)
    .single()

  if (!profile?.weight_kg || !profile?.height_cm || !profile?.age) {
    // Return default targets if profile incomplete
    return NextResponse.json({ calories: 2000, proteinG: 150, carbsG: 225, fatG: 67, source: 'default' })
  }

  const userProfile = {
    weightKg: Number(profile.weight_kg),
    heightCm: Number(profile.height_cm),
    ageYears: Number(profile.age),
    sex: (profile.sex ?? 'male') as 'male' | 'female',
    activityLevel: (profile.activity_level ?? 'moderate') as any,
    goal: (profile.goal ?? 'maintain') as any,
  }

  const targetCalories = calculateTargetCalories(userProfile)
  const macros = calculateMacroTargets(targetCalories, userProfile.goal)
  return NextResponse.json({ ...macros, source: 'calculated', method: 'mifflin-st-jeor' })
}
