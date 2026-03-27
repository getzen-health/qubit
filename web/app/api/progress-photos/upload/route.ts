import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    let category = 'front'
    try {
      const body = await req.json()
      category = body.category ?? 'front'
    } catch {
      // use default category
    }

    const filename = `${user!.id}/${Date.now()}-${category}.jpg`
    const { data, error } = await supabase.storage
      .from('progress-photos')
      .createSignedUploadUrl(filename)

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ signedUrl: data.signedUrl, path: data.path })
  }
)
