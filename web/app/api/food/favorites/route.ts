import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const addFavoriteSchema = z.object({
  barcode: z.string().min(1).max(30),
  product_name: z.string().min(1).max(255),
  brand: z.string().max(255).optional().nullable(),
  health_score: z.number().int().min(0).max(100).optional().nullable(),
  nova_group: z.number().int().min(1).max(4).optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable(),
})

const deleteFavoriteSchema = z.object({
  barcode: z.string().min(1).max(30),
})

export const GET = createSecureApiHandler(
  { rateLimit: 'default', requireAuth: true, auditAction: 'READ', auditResource: 'food_product' },
  async (req: NextRequest, { supabase, user }) => {
    const { searchParams } = new URL(req.url)
    const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10))

    const { data, error } = await supabase
      .from('product_favorites')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + 49)

    if (error) return secureErrorResponse('Failed to load favorites', 500)
    return secureJsonResponse({ data: data ?? [], hasMore: (data ?? []).length === 50 })
  }
)

export const POST = createSecureApiHandler(
  {
    rateLimit: 'default',
    requireAuth: true,
    bodySchema: addFavoriteSchema,
    auditAction: 'CREATE',
    auditResource: 'food_product',
  },
  async (_req: NextRequest, { body, supabase, user }) => {
    const payload = body as z.infer<typeof addFavoriteSchema>
    const { error } = await supabase.from('product_favorites').upsert(
      {
        user_id: user!.id,
        barcode: payload.barcode,
        product_name: payload.product_name,
        brand: payload.brand ?? null,
        health_score: payload.health_score ?? null,
        nova_group: payload.nova_group ?? null,
        thumbnail_url: payload.thumbnail_url ?? null,
      },
      { onConflict: 'user_id,barcode' }
    )
    if (error) return secureErrorResponse('Failed to save favorite', 500)
    return secureJsonResponse({ success: true })
  }
)

export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'default',
    requireAuth: true,
    querySchema: deleteFavoriteSchema,
    auditAction: 'DELETE',
    auditResource: 'food_product',
  },
  async (_req: NextRequest, { query, supabase, user }) => {
    const { barcode } = query as z.infer<typeof deleteFavoriteSchema>
    const { error } = await supabase
      .from('product_favorites')
      .delete()
      .eq('user_id', user!.id)
      .eq('barcode', barcode)
    if (error) return secureErrorResponse('Failed to remove favorite', 500)
    return secureJsonResponse({ success: true })
  }
)
