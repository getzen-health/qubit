import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const PATCH = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const id = req.nextUrl.pathname.split('/').at(-2)
    const { is_favorite } = await req.json()

    const { data, error } = await supabase
      .from('scan_history')
      .update({ is_favorite })
      .eq('id', id)
      .eq('user_id', user!.id)
      .select('id, is_favorite')
      .single()

    if (error) return secureErrorResponse('Failed to update favorite', 500)
    return secureJsonResponse({ data })
  }
)
