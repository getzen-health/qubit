import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BodyClient } from './body-client'
import { LogWeightForm } from './log-weight-form'
import { BottomNav } from '@/components/bottom-nav'

export default async function BodyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, weight_kg')
    .eq('user_id', user.id)
    .not('weight_kg', 'is', null)
    .gt('weight_kg', 0)
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
            <h1 className="text-xl font-bold text-text-primary">Body Weight</h1>
            <p className="text-sm text-text-secondary">
              {summaries && summaries.length > 0
                ? `${summaries.length} measurements`
                : 'No data'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Log Today&apos;s Weight</h2>
          <LogWeightForm latestKg={summaries && summaries.length > 0 ? summaries[summaries.length - 1].weight_kg : undefined} />
        </div>
        <BodyClient summaries={summaries ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}
