import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse } from '@/lib/security'

const pushSubscribeBodySchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

export const POST = createSecureApiHandler(
  { rateLimit: 'default', requireAuth: true, bodySchema: pushSubscribeBodySchema },
  async (_req, { user, body, supabase }) => {
    const { endpoint, keys } = body as z.infer<typeof pushSubscribeBodySchema>

    const { error: pushErr } = await supabase.from('web_push_subscriptions').upsert(
      {
        user_id: user!.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      { onConflict: 'user_id,endpoint' }
    )
    if (pushErr) console.error('push subscription upsert error', pushErr)

    return secureJsonResponse({ success: true })
  }
)
