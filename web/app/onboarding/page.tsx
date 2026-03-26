'use client'
import { OnboardingClient } from './onboarding-client'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <OnboardingClient userId={user?.id ?? ''} initialName={user?.user_metadata?.full_name ?? ''} />
}

