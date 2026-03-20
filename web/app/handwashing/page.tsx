import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { HandwashingClient } from './handwashing-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Handwashing Analytics' }

export default async function HandwashingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 30-day window
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data: events } = await supabase
    .from('health_records')
    .select('id, start_time, value, source')
    .eq('user_id', user.id)
    .eq('type', 'handwashingEvent')
    .gte('start_time', since.toISOString())
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
            <h1 className="text-xl font-bold text-text-primary">Handwashing</h1>
            <p className="text-sm text-text-secondary">
              {(events ?? []).length} events · last 30 days
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HandwashingClient events={events ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}
