import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InviteClient } from './invite-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata: Metadata = { title: 'Invite Friends | GetZen' }

export default async function InvitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <InviteClient />
      <BottomNav />
    </>
  )
}
