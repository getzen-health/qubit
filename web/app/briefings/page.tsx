import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles, CalendarDays } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = {
  title: 'Morning Briefings',
}

interface Briefing {
  id: string
  date: string
  content: string
  created_at: string
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10)
}

function isYesterday(dateStr: string): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return dateStr === yesterday.toISOString().slice(0, 10)
}

function getDateLabel(dateStr: string): string {
  if (isToday(dateStr)) return 'Today'
  if (isYesterday(dateStr)) return 'Yesterday'
  return formatDate(dateStr)
}

export default async function BriefingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: briefings } = await supabase
    .from('briefings')
    .select('id, date, content, created_at')
    .eq('user_id', user.id)
    .gte('date', thirtyDaysAgo.toISOString().slice(0, 10))
    .order('date', { ascending: false })

  const items = (briefings ?? []) as Briefing[]

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary leading-tight">Morning Briefings</h1>
            <p className="text-[10px] text-text-tertiary leading-tight">Last 30 days</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <CalendarDays className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">No briefings yet</h2>
              <p className="text-sm text-text-secondary mt-1 max-w-xs">
                Your daily AI health briefings will appear here once the morning briefing service is active.
              </p>
            </div>
          </div>
        ) : (
          items.map((briefing) => (
            <article
              key={briefing.id}
              className="rounded-2xl border border-border bg-surface p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {getDateLabel(briefing.date)}
                </span>
                <span className="text-[10px] text-text-tertiary">
                  {new Date(briefing.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed">{briefing.content}</p>
            </article>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  )
}
