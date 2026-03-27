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
    .select('display_name, avatar_url, biological_sex, age, fitness_goal, height_cm, weight_kg')
    .eq('id', user.id)
    .single()

  return (
    <AccountForm
      email={user.email ?? ''}
      displayName={profile?.display_name ?? ''}
      avatarUrl={profile?.avatar_url ?? null}
      userId={user.id}
      biologicalSex={(profile?.biological_sex as string) ?? ''}
      age={profile?.age ? String(profile.age) : ''}
      fitnessGoal={(profile?.fitness_goal as string) ?? ''}
      heightCm={profile?.height_cm ? String(profile.height_cm) : ''}
      weightKg={profile?.weight_kg ? String(profile.weight_kg) : ''}
    />
  )
}
