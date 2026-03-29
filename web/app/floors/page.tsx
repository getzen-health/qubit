import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const FloorsClient = dynamic(() => import('./floors-client').then(m => ({ default: m.FloorsClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Floors Climbed' }

export default async function FloorsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, floors_climbed, steps')
    .eq('user_id', user.id)
    .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))
    .not('floors_climbed', 'is', null)
    .gt('floors_climbed', 0)
    .order('date', { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/steps"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to steps"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Floors Climbed</h1>
            <p className="text-sm text-text-secondary">Last 90 days · Stair climbing</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <FloorsClient days={summaries ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}
