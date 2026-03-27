import { NextRequest } from 'next/server'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data } = await supabase
      .from('user_goals')
      .select('target_calories, target_protein_g, target_carbs_g, target_fat_g')
      .eq('user_id', user!.id)
      .single()

    return secureJsonResponse({
      data: data ?? { target_calories: 2000, target_protein_g: 150, target_carbs_g: 250, target_fat_g: 65 },
    })
  }
)

export const PUT = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req: NextRequest, { user, supabase }) => {
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return secureErrorResponse('Invalid JSON body', 400)
    }

    const { error } = await supabase
      .from('user_goals')
      .upsert({ user_id: user!.id, ...body, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ success: true })
  }
)
