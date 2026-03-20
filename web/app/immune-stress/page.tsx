import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { ImmuneStressClient } from './immune-stress-client'

export const metadata = { title: 'Immune Stress Index' }

export default async function ImmuneStressPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <ImmuneStressClient />
      <BottomNav />
    </>
  )
}
