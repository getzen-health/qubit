import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', user!.id)
      .order('measured_at', { ascending: false })
      .limit(30)
    if (error) return secureErrorResponse('Failed to fetch measurements', 500)
    return secureJsonResponse({ data })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const { weight_kg, waist_cm, neck_cm, hips_cm, height_cm } = body
    if (!weight_kg) return secureErrorResponse('weight_kg required', 400)
    const { data, error } = await supabase
      .from('body_measurements')
      .insert({
        user_id: user!.id,
        weight_kg: Number(weight_kg),
        waist_cm: waist_cm ? Number(waist_cm) : null,
        neck_cm: neck_cm ? Number(neck_cm) : null,
        hips_cm: hips_cm ? Number(hips_cm) : null,
        height_cm: height_cm ? Number(height_cm) : null,
        measured_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) return secureErrorResponse('Failed to save measurement', 500)
    return secureJsonResponse({ data }, 201)
  }
)

export const DELETE = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return secureErrorResponse('id required', 400)
    const { error } = await supabase
      .from('body_measurements')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)
    if (error) return secureErrorResponse('Failed to delete measurement', 500)
    return secureJsonResponse({ success: true })
  }
)
