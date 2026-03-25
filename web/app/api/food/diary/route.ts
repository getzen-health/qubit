import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { z } from 'zod'

// DELETE /api/food/diary?id=<meal_item_id>
export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'DELETE',
    auditResource: 'meal',
  },
  async (request, { user, supabase, audit }) => {
    const itemId = request.nextUrl.searchParams.get('id')
    if (!itemId) return secureErrorResponse('Item ID required', 400)

    const { data: item } = await supabase
      .from('meal_items')
      .select('id')
      .eq('id', itemId)
      .eq('user_id', user!.id)
      .single()

    if (!item) return secureErrorResponse('Meal item not found', 404)

    const { error } = await supabase
      .from('meal_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user!.id)

    if (error) return secureErrorResponse('Failed to delete meal item', 500)

    await audit.log(user!.id, 'DELETE', 'meal', { resourceId: itemId })
    return secureJsonResponse({ ok: true })
  }
)

// PATCH /api/food/diary — update servings for a meal_item
export const PATCH = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: z.object({
      id: z.string().uuid(),
      servings: z.number().positive(),
    }),
    auditAction: 'UPDATE',
    auditResource: 'meal',
  },
  async (_request, { user, body, supabase, audit }) => {
    const { id, servings } = body as { id: string; servings: number }

    const { data: item } = await supabase
      .from('meal_items')
      .select('id')
      .eq('id', id)
      .eq('user_id', user!.id)
      .single()

    if (!item) return secureErrorResponse('Meal item not found', 404)

    const { error } = await supabase
      .from('meal_items')
      .update({ servings })
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) return secureErrorResponse('Failed to update meal item', 500)

    await audit.log(user!.id, 'UPDATE', 'meal', { resourceId: id, details: { servings } })
    return secureJsonResponse({ ok: true })
  }
)
