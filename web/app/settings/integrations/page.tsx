import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IntegrationsClient from './integrations-client'

export const metadata = { title: 'Integrations' }

export default async function IntegrationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch existing integrations for this user
  const { data: integrations } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', user.id)
    .order('provider', { ascending: true })

  return (
    <IntegrationsClient 
      userId={user.id}
      existingIntegrations={integrations || []}
    />
  )
}
