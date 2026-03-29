import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const dynamic = 'force-dynamic'

function generateCode(userId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let hash = 0
  for (const c of userId) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return Array.from({ length: 6 }, (_, i) => chars[(Math.abs(hash >> (i * 4)) % chars.length)]).join('')
}

const applySchema = z.object({ code: z.string().min(1).max(20) })

// GET — return user's referral code, creating one if it doesn't exist
export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const userId = user!.id

    const { data: existing } = await supabase
      .from('referral_codes')
      .select('code, uses, max_uses')
      .eq('user_id', userId)
      .single()

    if (existing) {
      return secureJsonResponse({ code: existing.code, uses: existing.uses, maxUses: existing.max_uses })
    }

    const code = generateCode(userId)
    const { data: created, error } = await supabase
      .from('referral_codes')
      .insert({ user_id: userId, code })
      .select('code, uses, max_uses')
      .single()

    if (error || !created) return secureErrorResponse('Failed to create referral code', 500)

    return secureJsonResponse({ code: created.code, uses: created.uses, maxUses: created.max_uses })
  }
)

// POST — apply a referral code
export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, bodySchema: applySchema },
  async (_req, { user, supabase, body }) => {
    const { code } = body as z.infer<typeof applySchema>

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return secureErrorResponse('Server configuration error', 500)
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/process-referral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ code, referredUserId: user!.id }),
    })

    const data = await res.json() as { success?: boolean; message?: string; error?: string }

    if (!res.ok) {
      return secureErrorResponse(data.error ?? 'Failed to apply referral code', res.status as 400 | 409 | 500)
    }

    return secureJsonResponse({ success: true, message: data.message })
  }
)
