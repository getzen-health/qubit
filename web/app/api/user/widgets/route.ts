import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { z } from 'zod'

export const GET = createSecureApiHandler(
  {
    rateLimit: 'default',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'user_widgets',
  },
  async (_request, { user, supabase }) => {
    const { data, error } = await supabase
      .from('user_widget_config')
      .select('widget_configs')
      .eq('user_id', user!.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is fine for new users
      return secureErrorResponse(error.message, 500)
    }

    return secureJsonResponse({ configs: data?.widget_configs ?? null })
  }
)

export const POST = createSecureApiHandler(
  {
    rateLimit: 'default',
    requireAuth: true,
    bodySchema: z.object({
      configs: z.array(z.unknown()),
    }),
    auditAction: 'UPDATE',
    auditResource: 'user_widgets',
  },
  async (_request, { user, body, supabase }) => {
    const { configs } = body as { configs: unknown[] }

    const { error } = await supabase.from('user_widget_config').upsert(
      {
        user_id: user!.id,
        widget_configs: configs,
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
