import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { encryptApiKey, decryptApiKey } from '@/lib/api-key-encryption'

/** GET /api/user/ai-key — returns { hasKey: boolean }.  The actual key is NEVER returned. */
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'ai_settings',
  },
  async (_req: NextRequest, { user, supabase }) => {
    const { data } = await supabase
      .from('user_ai_settings')
      .select('api_key_encrypted')
      .eq('user_id', user!.id)
      .maybeSingle()

    return secureJsonResponse({ hasKey: !!data?.api_key_encrypted })
  }
)

/** POST /api/user/ai-key — encrypts and persists the user's API key. */
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: z.object({
      apiKey: z.string().min(1).max(500),
    }),
    auditAction: 'CREATE',
    auditResource: 'ai_settings',
  },
  async (_req: NextRequest, { user, body, supabase }) => {
    const secret = process.env.API_KEY_ENCRYPTION_SECRET
    if (!secret) {
      return secureErrorResponse('Server encryption not configured', 500)
    }

    const { apiKey } = body as { apiKey: string }
    const encrypted = encryptApiKey(apiKey.trim(), secret)

    const { error } = await supabase.from('user_ai_settings').upsert(
      {
        user_id: user!.id,
        api_key_encrypted: encrypted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    if (error) return secureErrorResponse('Failed to save API key', 500)

    return secureJsonResponse({ success: true })
  }
)

/** DELETE /api/user/ai-key — removes the stored API key. */
export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'DELETE',
    auditResource: 'ai_settings',
  },
  async (_req: NextRequest, { user, supabase }) => {
    const { error } = await supabase
      .from('user_ai_settings')
      .update({ api_key_encrypted: null, updated_at: new Date().toISOString() })
      .eq('user_id', user!.id)

    if (error) return secureErrorResponse('Failed to remove API key', 500)

    return secureJsonResponse({ success: true })
  }
)

/**
 * Retrieve and decrypt the authenticated user's custom Anthropic API key.
 * Returns null when no custom key is stored or decryption fails.
 * Import this helper ONLY in other server-side API routes.
 */
export async function getUserApiKey(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<string | null> {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET
  if (!secret) return null

  const { data } = await supabase
    .from('user_ai_settings')
    .select('api_key_encrypted')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data?.api_key_encrypted) return null

  try {
    return decryptApiKey(data.api_key_encrypted, secret)
  } catch {
    return null
  }
}
