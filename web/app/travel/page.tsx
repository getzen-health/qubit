import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TravelClient } from './travel-client'

export const metadata = {
  title: 'Travel Health — KQuarks',
  description: 'Jet lag calculator, vaccination tracker, altitude AMS screening, and travel health kit.',
}

export default async function TravelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <TravelClient />
}
