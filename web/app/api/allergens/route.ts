import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data, error } = await supabase
      .from('user_allergens')
      .select('*')
      .eq('user_id', user!.id)
      .order('allergen')
    if (error) return secureErrorResponse('Failed to fetch allergens', 500)
    return secureJsonResponse({ allergens: data })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const allergen = typeof body.allergen === 'string' ? body.allergen.trim() : ''
    const severity = body.severity ?? 'moderate'
    if (!allergen) return secureErrorResponse('allergen is required', 400)
    const { data, error } = await supabase
      .from('user_allergens')
      .insert({ user_id: user!.id, allergen, severity })
      .select()
      .single()
    if (error) return secureErrorResponse('Failed to create allergen', 400)
    return secureJsonResponse({ allergen: data }, 201)
  }
)

export const DELETE = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const { id } = await request.json()
    if (!id) return secureErrorResponse('id is required', 400)
    const { error } = await supabase
      .from('user_allergens')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)
    if (error) return secureErrorResponse('Failed to delete allergen', 400)
    return secureJsonResponse({ success: true })
  }
)
