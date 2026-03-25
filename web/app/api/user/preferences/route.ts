import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { z } from 'zod'

export const GET = createSecureApiHandler(
  {
    rateLimit: 'default',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'user_preferences',
  },
  async (_request, { user, supabase }) => {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user!.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return secureErrorResponse(error.message, 500)
    }

    return secureJsonResponse({ preferences: data ?? null })
  }
)

export const POST = createSecureApiHandler(
  {
    rateLimit: 'default',
    requireAuth: true,
    bodySchema: z.object({
      preferences: z.record(z.string(), z.unknown()),
    }),
    auditAction: 'UPDATE',
    auditResource: 'user_preferences',
  },
  async (_request, { user, body, supabase }) => {
    const { preferences } = body as { preferences: Record<string, unknown> }

    const { error } = await supabase.from('user_preferences').upsert(
      {
        user_id: user!.id,
        appearance_mode: preferences.appearanceMode,
        accent_hue: preferences.accentHue,
        accent_saturation: preferences.accentSaturation,
        accent_lightness: preferences.accentLightness,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )

    if (error) {
      return secureErrorResponse(error.message, 500)
    }

    return secureJsonResponse({ success: true })
  }
)
