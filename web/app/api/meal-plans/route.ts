import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
  dateSchema,
} from '@/lib/security'

const getMealPlansQuerySchema = z.object({
  startDate: dateSchema,
})

const createMealPlanSchema = z.object({
  plan_date: dateSchema,
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  food_name: z.string().min(1).max(200),
  calories: z.number().int().min(0).max(10000).nullable().optional(),
  protein_g: z.number().min(0).max(1000).nullable().optional(),
  carbs_g: z.number().min(0).max(1000).nullable().optional(),
  fat_g: z.number().min(0).max(1000).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

const deleteMealPlanQuerySchema = z.object({
  id: z.string().uuid(),
})

// GET /api/meal-plans?startDate=YYYY-MM-DD — fetch one week of plans
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    querySchema: getMealPlansQuerySchema,
    auditAction: 'READ',
    auditResource: 'meal',
  },
  async (_req: NextRequest, { user, query, supabase }) => {
    const { startDate } = query as { startDate: string }
    const end = new Date(startDate)
    end.setDate(end.getDate() + 7)
    const endDate = end.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', user!.id)
      .gte('plan_date', startDate)
      .lt('plan_date', endDate)
      .order('plan_date', { ascending: true })
      .order('meal_type', { ascending: true })

    if (error) return secureErrorResponse('Failed to fetch meal plans', 500)
    return secureJsonResponse({ plans: data ?? [] })
  }
)

// POST /api/meal-plans — add a meal to the plan
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: createMealPlanSchema,
    auditAction: 'CREATE',
    auditResource: 'meal',
  },
  async (_req, { user, body, supabase }) => {
    const { plan_date, meal_type, food_name, calories, protein_g, carbs_g, fat_g, notes } =
      body as z.infer<typeof createMealPlanSchema>

    const { data, error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user!.id,
        plan_date,
        meal_type,
        food_name,
        calories: calories ?? null,
        protein_g: protein_g ?? null,
        carbs_g: carbs_g ?? null,
        fat_g: fat_g ?? null,
        notes: notes ?? null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return secureErrorResponse('Meal already planned', 409)
      return secureErrorResponse('Failed to save meal plan', 500)
    }
    return secureJsonResponse({ plan: data }, 201)
  }
)

// DELETE /api/meal-plans?id=<uuid> — remove a planned meal
export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    querySchema: deleteMealPlanQuerySchema,
    auditAction: 'DELETE',
    auditResource: 'meal',
  },
  async (_req, { user, query, supabase }) => {
    const { id } = query as { id: string }

    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) return secureErrorResponse('Failed to delete meal plan', 500)
    return secureJsonResponse({ ok: true })
  }
)
