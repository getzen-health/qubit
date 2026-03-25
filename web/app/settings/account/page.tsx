import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountForm } from './account-form'

export const metadata = { title: 'Account' }

export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <AccountForm
      email={user.email ?? ''}
      displayName={profile?.display_name ?? ''}
      avatarUrl={profile?.avatar_url ?? null}
      userId={user.id}
    />
  )
}
