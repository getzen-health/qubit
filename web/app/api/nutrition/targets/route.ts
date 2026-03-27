import { calculateTargetCalories, calculateMacroTargets } from '@/lib/nutrition/bmr'
import { createSecureApiHandler, secureJsonResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('weight_kg, height_cm, age, sex, activity_level, goal')
      .eq('id', user!.id)
      .single()

    if (!profile?.weight_kg || !profile?.height_cm || !profile?.age) {
      // Return default targets if profile incomplete
      return secureJsonResponse({ calories: 2000, proteinG: 150, carbsG: 225, fatG: 67, source: 'default' })
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
    return secureJsonResponse({ ...macros, source: 'calculated', method: 'mifflin-st-jeor' })
  }
)
