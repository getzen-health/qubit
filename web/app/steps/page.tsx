import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { StepsClient } from './steps-client'

export default async function StepsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, steps, active_calories, distance_meters')
    .eq('user_id', user.id)
    .gte('date', thirtyDaysAgo.toISOString().slice(0, 10))
    .order('date', { ascending: true })

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
          <div>
            <h1 className="text-xl font-bold text-text-primary">Activity</h1>
            <p className="text-sm text-text-secondary">Last 30 days</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <StepsClient summaries={summaries ?? []} />
      </main>
    </div>
  )
}
