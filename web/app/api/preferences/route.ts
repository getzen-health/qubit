import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const DEFAULT_ORDER = [
  'health-score',
  'steps',
  'sleep',
  'water',
  'workout',
  'mood',
  'streaks',
  'nutrition',
]

export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'user_preferences',
  },
  async (_request, { user, supabase }) => {
    const { data } = await supabase
      .from('user_preferences')
      .select('dashboard_card_order, dashboard_hidden_cards')
      .eq('user_id', user!.id)
      .single()

    if (!data) {
      return secureJsonResponse({
        dashboard_card_order: DEFAULT_ORDER,
        dashboard_hidden_cards: [],
      })
    }
    return secureJsonResponse(data)
  }
)

export const PATCH = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'UPDATE',
    auditResource: 'user_preferences',
  },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const { dashboard_card_order, dashboard_hidden_cards } = body

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user!.id,
        dashboard_card_order,
        dashboard_hidden_cards,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) {
      return secureErrorResponse(error.message, 400)
    }
    return secureJsonResponse({ success: true })
  }
)
