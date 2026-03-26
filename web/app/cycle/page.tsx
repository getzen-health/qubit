import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CyclePageClient } from './cycle-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Menstrual Cycle' }

const MS_PER_DAY = 86_400_000

export default async function CyclePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch one extra cycle to compute the length of the oldest visible cycle
  const { data: rawCycles, error } = await supabase
    .from('cycle_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('period_start', { ascending: false })
    .limit(6)

  const allCycles = error ? [] : (rawCycles ?? [])

  // Enrich with computed cycle lengths (distance between consecutive period_start)
  const enrichedCycles = allCycles.slice(0, 5).map((cycle, i) => {
    const nextCycle = allCycles[i + 1]
    const computedLength = nextCycle
      ? Math.round(
          (new Date(cycle.period_start).getTime() - new Date(nextCycle.period_start).getTime()) /
            MS_PER_DAY,
        )
      : (cycle.cycle_length ?? null)
    return { ...cycle, symptoms: cycle.symptoms ?? [], computed_cycle_length: computedLength }
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto mt-4">
          import CycleForm from './cycle-form'
// ...rest of file

        </div>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Menstrual Cycle</h1>
            <p className="text-sm text-text-secondary">
              {enrichedCycles.length > 0
                ? `${enrichedCycles.length} cycles tracked`
                : 'Track your cycle'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <CyclePageClient cycles={enrichedCycles} />
      </main>
      <BottomNav />
    </div>
  )
}
