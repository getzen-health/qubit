import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { FallRiskClient } from './fall-risk-client'

export const metadata = { title: 'Fall Risk Assessment' }

export default async function FallRiskPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <FallRiskClient />
      <BottomNav />
    </>
  )
}
