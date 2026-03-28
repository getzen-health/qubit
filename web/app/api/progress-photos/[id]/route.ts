import { apiLogger } from '@/lib/api-logger'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const DELETE = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const id = req.nextUrl.pathname.split('/').at(-1)!
    const { data, error } = await supabase
      .from('progress_photos')
      .select('id,storage_path')
      .eq('id', id)
      .eq('user_id', user!.id)
      .single()
    if (error || !data) return secureErrorResponse('Not found', 404)
    await supabase.storage.from('progress-photos').remove([data.storage_path])
    const { error: photoDelErr } = await supabase.from('progress_photos').delete().eq('id', id)
    if (photoDelErr) apiLogger('progress_photos delete error', photoDelErr)
    return secureJsonResponse({ success: true })
  }
)
