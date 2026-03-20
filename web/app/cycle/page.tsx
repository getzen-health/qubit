import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CycleClient } from './cycle-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Cycle Tracking' }

export default async function CyclePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // cycle_records table may not exist — handle error gracefully
  const { data: records, error } = await supabase
    .from('cycle_records')
    .select('id, start_date, end_date, cycle_length_days, period_length_days, phase, notes')
    .eq('user_id', user.id)
    .order('start_date', { ascending: false })

  // Treat a missing-table error the same as an empty result
  const cycles = error ? [] : (records ?? [])

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
            <h1 className="text-xl font-bold text-text-primary">Cycle Tracking</h1>
            <p className="text-sm text-text-secondary">
              {cycles.length > 0 ? `${cycles.length} cycles logged` : 'Phase-based training'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <CycleClient cycles={cycles} />
      </main>
      <BottomNav />
    </div>
  )
}
