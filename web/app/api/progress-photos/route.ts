import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', user!.id)
      .order('taken_at', { ascending: false })
    if (error) return secureErrorResponse('Failed to fetch photos', 500)
    return secureJsonResponse({ photos: data })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const { storage_path, photo_url, category, notes, weight_kg, taken_at } = body
    const { error } = await supabase.from('progress_photos').insert({
      user_id: user!.id,
      storage_path,
      photo_url,
      category,
      notes,
      weight_kg,
      taken_at,
    })
    if (error) return secureErrorResponse('Failed to upload photo', 500)
    return secureJsonResponse({ success: true })
  }
)
