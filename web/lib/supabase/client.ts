import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // During SSR pre-render, env vars may be absent; all real queries run in useEffect (client-only)
  if (typeof window === 'undefined' &&
      (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    return null as unknown as ReturnType<typeof createBrowserClient>
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
