// GET /api/food/ingredients?q=aspartame → returns IngredientInfo or null
import { createSecureApiHandler, secureJsonResponse } from '@/lib/security'
import { lookupIngredient } from '@/lib/ingredient-glossary'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { supabase: _supabase }) => {
    const q = request.nextUrl.searchParams.get('q') ?? ''
    if (!q || q.length < 2) return secureJsonResponse({ result: null })
    const result = lookupIngredient(q.trim())
    return secureJsonResponse({ result })
  }
)
