import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscriptionClient from './subscription-client'

export const metadata = { title: 'Subscription' }

export default async function SubscriptionPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user's subscription tier
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const currentTier = userData?.subscription_tier || 'free'

  return <SubscriptionClient userId={user.id} currentTier={currentTier} />
}
