import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const id = req.nextUrl.pathname.split('/').at(-2)
    const { favorited } = await req.json()

    const { error } = await supabase
      .from('health_insights')
      .update({ is_favorited: favorited })
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) return secureErrorResponse('Failed to update favorite', 500)
    return secureJsonResponse({ success: true, is_favorited: favorited })
  }
)
