import { createBrowserClient } from '@supabase/ssr'

export type SupabaseClient = ReturnType<typeof createBrowserClient>

export function createClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createBrowserClient(url, key)
}
