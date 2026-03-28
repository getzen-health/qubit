import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

const foodDiaryBodySchema = z.object({
  meal_type: z.enum(MEAL_TYPES),
  food_name: z.string().min(1).max(500),
  calories: z.number().nonnegative().nullable().optional(),
  protein_g: z.number().nonnegative().nullable().optional(),
  carbs_g: z.number().nonnegative().nullable().optional(),
  fat_g: z.number().nonnegative().nullable().optional(),
  fiber_g: z.number().nonnegative().nullable().optional(),
  serving_size: z.string().max(100).nullable().optional(),
})

const foodDiaryDeleteQuerySchema = z.object({
  id: z.string().uuid(),
})

// GET: Return today's entries grouped by meal_type, with totals
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (_request, { user, supabase }) => {
    const today = new Date()
    today.setHours(0,0,0,0)
    const iso = today.toISOString()

    const { data, error } = await supabase
      .from('food_diary_entries')
      .select('*')
      .eq('user_id', user!.id)
      .gte('logged_at', iso)
      .order('logged_at', { ascending: true })

    if (error) return secureErrorResponse(error.message, 500)

    // Group by meal_type
    const grouped: Record<string, typeof data> = { breakfast: [], lunch: [], dinner: [], snack: [] }
    const totals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    for (const entry of data) {
      grouped[entry.meal_type].push(entry)
      totals.calories += entry.calories || 0
      totals.protein_g += Number(entry.protein_g) || 0
      totals.carbs_g += Number(entry.carbs_g) || 0
      totals.fat_g += Number(entry.fat_g) || 0
    }
    return secureJsonResponse({ grouped, totals })
  }
)

// POST: Add entry
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: foodDiaryBodySchema,
  },
  async (_request, { user, body, supabase }) => {
    const { meal_type, food_name, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size } = body as z.infer<typeof foodDiaryBodySchema>
    const { error } = await supabase.from('food_diary_entries').insert({
      user_id: user!.id, meal_type, food_name, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size
    })
    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ success: true })
  }
)

// DELETE: Remove entry by id
export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    querySchema: foodDiaryDeleteQuerySchema,
  },
  async (_request, { user, query, supabase }) => {
    const { id } = query as z.infer<typeof foodDiaryDeleteQuerySchema>
    const { error } = await supabase.from('food_diary_entries').delete().eq('id', id).eq('user_id', user!.id)
    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ success: true })
  }
)
