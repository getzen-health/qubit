// GET /api/food/ingredients?q=aspartame → returns IngredientInfo or null
import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse } from '@/lib/security'
import { lookupIngredient } from '@/lib/ingredient-glossary'

const ingredientsQuerySchema = z.object({
  q: z.string().min(1).max(200),
})

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, querySchema: ingredientsQuerySchema },
  async (_request, { query }) => {
    const { q } = query as z.infer<typeof ingredientsQuerySchema>
    const result = lookupIngredient(q.trim())
    return secureJsonResponse({ result })
  }
)
