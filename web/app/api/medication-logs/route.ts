import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const { medication_id, taken_at, skipped, notes } = body

    if (!medication_id) {
      return secureErrorResponse('Medication ID is required', 400)
    }

    const { data, error } = await supabase
      .from('medication_logs')
      .insert({
        user_id: user!.id,
        medication_id,
        taken_at: taken_at || new Date().toISOString(),
        skipped: skipped || false,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to create medication log', 400)
    return secureJsonResponse(data)
  }
)

export const DELETE = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')
    if (!id) return secureErrorResponse('Log ID is required', 400)

    const { error } = await supabase
      .from('medication_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) return secureErrorResponse('Failed to delete medication log', 400)
    return secureJsonResponse({ success: true })
  }
)
