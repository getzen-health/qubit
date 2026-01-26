import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
  createMealSchema,
  paginationSchema,
  dateRangeSchema,
} from '@/lib/security'

// Query schema for GET requests
const getMealsQuerySchema = paginationSchema.merge(dateRangeSchema).extend({
  date: z.string().optional(),
})

// GET /api/meals - Get user's meals
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    querySchema: getMealsQuerySchema,
    auditAction: 'READ',
    auditResource: 'meal',
  },
  async (request, { user, query, supabase }) => {
    const { date, limit = 20 } = query as z.infer<typeof getMealsQuerySchema>

    let dbQuery = supabase
      .from('meals')
      .select(`
        *,
        meal_items (*)
      `)
      .eq('user_id', user!.id)
      .order('logged_at', { ascending: false })
      .limit(limit)

    if (date) {
      dbQuery = dbQuery
        .gte('logged_at', `${date}T00:00:00`)
        .lt('logged_at', `${date}T23:59:59`)
    }

    const { data: meals, error } = await dbQuery

    if (error) {
      console.error('Error fetching meals:', error)
      return secureErrorResponse('Failed to fetch meals', 500)
    }

    return secureJsonResponse({ meals })
  }
)

// POST /api/meals - Create a new meal with items
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: createMealSchema,
    auditAction: 'CREATE',
    auditResource: 'meal',
  },
  async (request, { user, body, supabase, audit }) => {
    const mealData = body as z.infer<typeof createMealSchema>

    // Create the meal
    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .insert({
        user_id: user!.id,
        name: mealData.name,
        meal_type: mealData.meal_type,
        logged_at: mealData.logged_at || new Date().toISOString(),
        notes: mealData.notes,
        image_url: mealData.image_url,
      })
      .select()
      .single()

    if (mealError) {
      console.error('Error creating meal:', mealError)
      return secureErrorResponse('Failed to create meal', 500)
    }

    // Create meal items
    const mealItems = mealData.items.map((item) => ({
      meal_id: meal.id,
      user_id: user!.id,
      name: item.name,
      brand: item.brand,
      barcode: item.barcode,
      serving_size: item.serving_size,
      servings: item.servings,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber,
      sugar: item.sugar,
      sodium: item.sodium,
      source: item.source,
      confidence: item.confidence,
    }))

    const { error: itemsError } = await supabase
      .from('meal_items')
      .insert(mealItems)

    if (itemsError) {
      console.error('Error creating meal items:', itemsError)
      // Rollback meal creation
      await supabase.from('meals').delete().eq('id', meal.id)
      return secureErrorResponse('Failed to create meal items', 500)
    }

    // Fetch the complete meal with items
    const { data: completeMeal } = await supabase
      .from('meals')
      .select(`
        *,
        meal_items (*)
      `)
      .eq('id', meal.id)
      .single()

    // Log audit event with meal ID
    await audit.log(user!.id, 'CREATE', 'meal', {
      resourceId: meal.id,
      details: {
        meal_type: mealData.meal_type,
        item_count: mealData.items.length,
        total_calories: mealData.items.reduce((sum, i) => sum + i.calories, 0),
      },
    })

    return secureJsonResponse({ meal: completeMeal }, 201)
  }
)

// DELETE /api/meals?id=xxx - Delete a meal
export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'DELETE',
    auditResource: 'meal',
  },
  async (request, { user, supabase, audit }) => {
    const mealId = request.nextUrl.searchParams.get('id')

    if (!mealId) {
      return secureErrorResponse('Meal ID required', 400)
    }

    // Verify ownership before delete
    const { data: existingMeal } = await supabase
      .from('meals')
      .select('id')
      .eq('id', mealId)
      .eq('user_id', user!.id)
      .single()

    if (!existingMeal) {
      return secureErrorResponse('Meal not found', 404)
    }

    // Delete meal (items will cascade delete)
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId)
      .eq('user_id', user!.id)

    if (error) {
      console.error('Error deleting meal:', error)
      return secureErrorResponse('Failed to delete meal', 500)
    }

    // Log deletion
    await audit.log(user!.id, 'DELETE', 'meal', { resourceId: mealId })

    return secureJsonResponse({ success: true })
  }
)
