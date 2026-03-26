import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { compileHealthContext } from '@/lib/health-context'
import { AICoachHub } from './coach-client'

export default async function CoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await compileHealthContext(user.id, supabase)

  return (
    <main role="main" aria-label="AI Health Coach" id="main-content">
      <AICoachHub initialContext={ctx} />
    </main>
  )
}
