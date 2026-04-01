import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingClient } from './onboarding-client'

export const metadata: Metadata = {
  title: 'Welcome to GetZen',
  description: 'Set up your health profile to get started.',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const userId = (user as NonNullable<typeof user>).id

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', userId)
    .single()

  if (profile?.onboarding_completed) redirect('/dashboard')

  return <OnboardingClient userId={userId} />
}
