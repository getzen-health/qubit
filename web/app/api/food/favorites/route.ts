import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    // Get latest scan per product (deduplicated by barcode), favorites only
    const { data, error } = await supabase
      .from('scan_history')
      .select('id, barcode, product_name, brand, score, grade, is_favorite, scanned_at, image_url, nutrients')
      .eq('user_id', user!.id)
      .eq('is_favorite', true)
      .order('scanned_at', { ascending: false })

    if (error) return secureErrorResponse('Failed to fetch favorites', 500)

    // Deduplicate by barcode — keep latest per barcode
    const seen = new Set<string>()
    const deduped = (data ?? []).filter(item => {
      if (seen.has(item.barcode)) return false
      seen.add(item.barcode)
      return true
    })

    return secureJsonResponse({ data: deduped })
  }
)
