import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const date = req.nextUrl.pathname.split('/').at(-1)
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user!.id)
      .eq('entry_date', date)
      .single()
    if (error) return secureErrorResponse('Journal entry not found', 404)
    return secureJsonResponse({ entry: data })
  }
)

export const PUT = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const date = req.nextUrl.pathname.split('/').at(-1)
    const body = await req.json()
    const { error, data } = await supabase
      .from('journal_entries')
      .update(body)
      .eq('user_id', user!.id)
      .eq('entry_date', date)
      .select()
      .single()
    if (error) return secureErrorResponse('Failed to update journal entry', 500)
    return secureJsonResponse({ entry: data })
  }
)
