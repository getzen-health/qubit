import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const favoriteBodySchema = z.object({
  is_favorite: z.boolean(),
})

export const PATCH = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, bodySchema: favoriteBodySchema },
  async (req, { user, body, supabase }) => {
    const id = req.nextUrl.pathname.split('/').at(-2)
    const { is_favorite } = body as z.infer<typeof favoriteBodySchema>

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
