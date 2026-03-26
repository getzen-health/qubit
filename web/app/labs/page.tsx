import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LabsClient from './labs-client'

export const metadata: Metadata = {
  title: 'Lab Results & Health Records',
  description: 'Track biomarkers, view optimal ranges, and log doctor visits.',
}

export default async function LabsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: results }, { data: visits }] = await Promise.all([
    supabase
      .from('lab_results')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: false })
      .limit(20),
    supabase
      .from('doctor_visits')
      .select('*')
      .eq('user_id', user.id)
      .order('visit_date', { ascending: false })
      .limit(20),
  ])

  return <LabsClient initialResults={results ?? []} initialVisits={visits ?? []} />
}
