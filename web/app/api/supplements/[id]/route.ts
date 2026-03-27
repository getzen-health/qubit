import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const PUT = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const id = req.nextUrl.pathname.split('/').at(-1)
    const body = await req.json()
    const { name, brand, category, dosage_amount, dosage_unit, frequency, notes } = body

    if (!name) {
      return secureErrorResponse('Name is required', 400)
    }

    const { data, error } = await supabase
      .from('supplements')
      .update({
        name,
        brand: brand || null,
        category: category || null,
        dosage_amount: dosage_amount || null,
        dosage_unit: dosage_unit || 'mg',
        frequency: frequency || 'daily',
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user!.id)
      .select()
      .single()

    if (error) {
      return secureErrorResponse('Failed to update supplement', 400)
    }

    return secureJsonResponse(data)
  }
)

export const DELETE = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const id = req.nextUrl.pathname.split('/').at(-1)

    const { error } = await supabase
      .from('supplements')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) {
      return secureErrorResponse('Failed to delete supplement', 400)
    }

    return secureJsonResponse({ success: true })
  }
)
