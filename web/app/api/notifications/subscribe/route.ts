import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

const subscribeBodySchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  userAgent: z.string().optional(),
})

const unsubscribeBodySchema = z.object({
  endpoint: z.string().min(1),
})

export const POST = createSecureApiHandler(
  { rateLimit: 'default', requireAuth: true, bodySchema: subscribeBodySchema },
  async (req, { user, body, supabase }) => {
    const { endpoint, keys, userAgent } = body as z.infer<typeof subscribeBodySchema>

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user!.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent ?? req.headers.get('user-agent') ?? null,
      }, { onConflict: 'user_id,endpoint' })

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ success: true })
  }
)

export const DELETE = createSecureApiHandler(
  { rateLimit: 'default', requireAuth: true, bodySchema: unsubscribeBodySchema },
  async (_req, { user, body, supabase }) => {
    const { endpoint } = body as z.infer<typeof unsubscribeBodySchema>

    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user!.id)
      .eq('endpoint', endpoint)

    return secureJsonResponse({ success: true })
  }
)
