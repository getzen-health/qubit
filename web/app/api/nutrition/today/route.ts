import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('food_diary_entries')
      .select('calories, protein_g, carbs_g, fat_g, servings')
      .eq('user_id', user!.id)
      .gte('logged_at', today.toISOString())

    if (error) return secureErrorResponse('Failed to fetch today\'s nutrition', 500)

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

    return secureJsonResponse({ data: totals })
  }
)
