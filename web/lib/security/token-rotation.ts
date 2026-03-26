// PKCE + refresh token rotation utilities
import { createClient } from '@/lib/supabase/server'

export async function rotateSessionIfNeeded(): Promise<boolean> {
  try {
    const supabase = createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) return false

    // Refresh if token expires in less than 5 minutes
    const expiresAt = session.expires_at ?? 0
    const fiveMinutes = 5 * 60
    if (expiresAt - Date.now() / 1000 < fiveMinutes) {
      const { error: refreshError } = await supabase.auth.refreshSession()
      return !refreshError
    }
    return true
  } catch {
    return false
  }
}
