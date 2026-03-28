import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const historyQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export const GET = createSecureApiHandler(
  { rateLimit: 'default', requireAuth: true, auditAction: 'READ', auditResource: 'food_product', querySchema: historyQuerySchema },
  async (req: NextRequest, { supabase, user, query }) => {
    const { offset: rawOffset, limit: rawLimit } = query as z.infer<typeof historyQuerySchema>
    const offset = rawOffset ?? 0
    const limit = Math.min(rawLimit ?? 20, 50)

    const { data, error } = await supabase
      .from('product_scans')
      .select('*')
      .eq('user_id', user!.id)
      .order('scanned_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return secureErrorResponse('Failed to load scan history', 500)
    return secureJsonResponse({ scans: data ?? [], offset, limit, hasMore: (data ?? []).length === limit })
  }
)
