import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const MindfulClient = dynamic(() => import('./mindful-client').then(m => ({ default: m.MindfulClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Mindful Minutes Analytics' }

export default async function MindfulPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()

  const { data: sessions } = await supabase
    .from('health_records')
    .select('value, start_time, end_time, source')
    .eq('user_id', user.id)
    .eq('type', 'mindfulness')
    .gte('start_time', startIso)
    .order('start_time', { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Mindful Minutes</h1>
            <p className="text-sm text-text-secondary">Last 90 days</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <MindfulClient sessions={sessions ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}
