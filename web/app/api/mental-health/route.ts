import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

// GET: Return last 3 screenings per type for the current user
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (_request, { user, supabase }) => {
    // Get last 3 screenings per type
    const { data, error } = await supabase.from('mental_health_screenings')
      .select('*')
      .eq('user_id', user!.id)
      .order('screened_at', { ascending: false })
      .limit(9) // 3 per type, will filter in JS
    if (error) return secureErrorResponse(error.message, 500)
    // Group by screener_type, take 3 most recent per type
    const grouped: Record<string, any[]> = {}
    for (const row of data || []) {
      if (!grouped[row.screener_type]) grouped[row.screener_type] = []
      if (grouped[row.screener_type].length < 3) grouped[row.screener_type].push(row)
    }
    const flat = Object.values(grouped).flat()
    return secureJsonResponse(flat)
  }
)

// POST: Save a new screening
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const { screener_type, answers, total_score, severity_label } = body
    if (!['phq9', 'gad7', 'pss4'].includes(screener_type)) {
      return secureErrorResponse('Invalid screener type', 400)
    }
    const { error } = await supabase.from('mental_health_screenings').insert({
      user_id: user!.id,
      screener_type,
      answers,
      total_score,
      severity_label,
    })
    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ success: true })
  }
)
