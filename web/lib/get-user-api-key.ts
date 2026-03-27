import { decryptApiKey } from '@/lib/api-key-encryption'

/**
 * Retrieve and decrypt the authenticated user's custom Anthropic API key.
 * Returns null when no custom key is stored or decryption fails.
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
