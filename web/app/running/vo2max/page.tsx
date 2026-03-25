import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Wind } from 'lucide-react'
import { VO2maxClient } from './vo2max-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'VO₂max Trend' }

export default async function VO2maxPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: estimates } = await supabase
    .from('vo2max_estimates')
    .select('date, vo2max, source')
    .eq('user_id', user.id)
    .order('date', { ascending: true })
    .limit(90)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/running"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to running"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <Wind className="w-5 h-5 text-purple-400" />
          <div>
            <h1 className="text-xl font-bold text-text-primary">VO₂max Trend</h1>
            <p className="text-sm text-text-secondary">Last 90 entries</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <VO2maxClient estimates={estimates ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}
