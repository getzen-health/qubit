import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { YearClient } from './year-client'

export default async function YearPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, steps')
    .eq('user_id', user.id)
    .gt('steps', 0)
    .order('date', { ascending: false })

  const rows = summaries ?? []

  // Find available years from data
  const yearSet = new Set(rows.map((r) => parseInt(r.date.slice(0, 4), 10)))
  const currentYear = new Date().getFullYear()
  yearSet.add(currentYear)
  const availableYears = Array.from(yearSet).sort((a, b) => b - a)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/steps"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to Steps"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Year View</h1>
            <p className="text-sm text-text-secondary">
              {rows.length > 0 ? `${rows.length} days tracked` : 'No data yet'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">📅</span>
            <h2 className="text-lg font-semibold text-text-primary mb-2">No data yet</h2>
            <p className="text-sm text-text-secondary">Sync your health data to see your year at a glance.</p>
          </div>
        ) : (
          <YearClient
            summaries={rows}
            availableYears={availableYears}
            initialYear={currentYear}
          />
        )}
      </main>
      <BottomNav />
    </div>
  )
}
