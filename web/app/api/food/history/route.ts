import { NextRequest } from 'next/server'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'default', requireAuth: true, auditAction: 'READ', auditResource: 'food_product' },
  async (req: NextRequest, { supabase, user }) => {
    const { searchParams } = new URL(req.url)
    const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))

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
