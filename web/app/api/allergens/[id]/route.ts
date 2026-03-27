import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const DELETE = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const id = req.nextUrl.pathname.split('/').at(-1)
    const { error } = await supabase
      .from('user_allergens')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)
    if (error) return secureErrorResponse('Failed to delete allergen', 400)
    return secureJsonResponse({ success: true })
  }
)
