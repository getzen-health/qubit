'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function logWeight(weightKg: number): Promise<{ error?: string }> {
  if (weightKg <= 0 || weightKg > 500) return { error: 'Invalid weight' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const today = new Date().toISOString().slice(0, 10)

  const { error } = await supabase
    .from('daily_summaries')
    .upsert(
      { user_id: user.id, date: today, weight_kg: weightKg },
      { onConflict: 'user_id,date', ignoreDuplicates: false }
    )

  if (error) return { error: error.message }

  revalidatePath('/body')
  return {}
}
