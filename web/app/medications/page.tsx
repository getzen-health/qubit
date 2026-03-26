import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { MedicationsClient } from './medications-client'

export const metadata = { title: 'Medications' }

export default async function MedicationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)

  const [{ data: medications }, { data: todayLogs }] = await Promise.all([
    supabase
      .from('medications')
      .select('*')
      .eq('user_id', user.id)
      .order('name'),
    supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('taken_at', `${today}T00:00:00`)
      .lte('taken_at', `${today}T23:59:59`),
  ])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Medications</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track your medications</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        <MedicationsClient
          initialMedications={medications ?? []}
          initialTodayLogs={todayLogs ?? []}
          userId={user.id}
        />
      </main>

      <BottomNav />
    </div>
  )
}
