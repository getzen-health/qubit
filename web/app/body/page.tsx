import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2 } from 'lucide-react'
import { BodyClient } from './body-client'
import { LogWeightForm } from './log-weight-form'
import { BottomNav } from '@/components/bottom-nav'

export default async function BodyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: summaries }, { data: profile }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, weight_kg, body_fat_percent')
      .eq('user_id', user.id)
      .not('weight_kg', 'is', null)
      .gt('weight_kg', 0)
      .order('date', { ascending: true }),
    supabase
      .from('users')
      .select('height_cm')
      .eq('id', user.id)
      .single(),
  ])

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
            <h1 className="text-xl font-bold text-text-primary">Body Weight</h1>
            <p className="text-sm text-text-secondary">
              {summaries && summaries.length > 0
                ? `${summaries.length} measurements`
                : 'No data'}
            </p>
          </div>
          <Link
            href="/body/patterns"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Body weight trends"
            title="Weight Trends"
          >
            <BarChart2 className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Log Today&apos;s Weight</h2>
          <LogWeightForm latestKg={summaries && summaries.length > 0 ? summaries[summaries.length - 1].weight_kg : undefined} />
        </div>
        <BodyClient summaries={summaries ?? []} heightCm={profile?.height_cm ?? null} />
      </main>
      <BottomNav />
    </div>
  )
}
