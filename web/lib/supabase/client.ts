import { createBrowserClient } from '@supabase/ssr'

export type SupabaseClient = ReturnType<typeof createBrowserClient>

export function createClient(): SupabaseClient | null {
  // During SSR pre-render, env vars may be absent; all real queries run in useEffect (client-only)
  if (typeof window === 'undefined' &&
      (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    return null
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
