import type { SupabaseClient } from '@supabase/supabase-js'

export type Theme = 'light' | 'dark' | 'system'

export async function syncThemeFromServer(
  supabase: SupabaseClient,
  userId: string
): Promise<Theme> {
  const { data } = await supabase
    .from('user_preferences')
    .select('theme')
    .eq('user_id', userId)
    .single()
  return (data?.theme as Theme) ?? 'dark'
}

export async function saveThemeToServer(
  supabase: SupabaseClient,
  userId: string,
  theme: Theme
) {
  await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, theme }, { onConflict: 'user_id' })
}
