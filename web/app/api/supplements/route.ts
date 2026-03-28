import { apiLogger } from '@/lib/api-logger'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (_request, { user, supabase }) => {
    const { data, error: fetchError } = await supabase.from('user_supplements').select('*').eq('user_id', user!.id).eq('active', true).order('created_at', { ascending: true })
    if (fetchError) return secureErrorResponse(fetchError.message, 500)
    return secureJsonResponse(data ?? [])
  }
)

export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const { data, error } = await supabase.from('user_supplements').insert({ ...body, user_id: user!.id }).select().single()
    if (error) return secureErrorResponse(error.message, 400)
    return secureJsonResponse(data)
  }
)

export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (request, { user, supabase }) => {
    const { id } = await request.json()
    const { error: suppErr } = await supabase.from('user_supplements').update({ active: false }).eq('id', id).eq('user_id', user!.id)
    if (suppErr) apiLogger('supplement update error', suppErr)
    return secureJsonResponse({ success: true })
  }
)
