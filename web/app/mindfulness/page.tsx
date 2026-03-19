import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { MindfulnessClient } from './mindfulness-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Mindfulness' }

export default async function MindfulnessPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: records } = await supabase
    .from('health_records')
    .select('value, start_time, end_time, source')
    .eq('user_id', user.id)
    .eq('type', 'mindfulness')
    .gte('start_time', thirtyDaysAgo.toISOString())
    .order('start_time', { ascending: false })

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
            <h1 className="text-xl font-bold text-text-primary">Mindfulness</h1>
            <p className="text-sm text-text-secondary">
              {records && records.length > 0 ? `${records.length} sessions` : 'Last 30 days'}
            </p>
          </div>
          <Link
            href="/mindfulness/impact"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Mindfulness impact on HRV"
            title="Impact Analysis"
          >
            <TrendingUp className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <MindfulnessClient sessions={records ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}
