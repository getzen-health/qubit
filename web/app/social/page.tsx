import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { SocialClient } from './social-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Social' }

export default async function SocialPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)

  // Fetch accepted friendships
  const { data: friendships } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  const friendIds = (friendships ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  )

  const [{ data: profiles }, { data: summaries }, { data: participations }] = await Promise.all([
    friendIds.length
      ? supabase.from('users').select('id, display_name, email').in('id', friendIds)
      : Promise.resolve({ data: [] }),
    friendIds.length
      ? supabase
          .from('daily_summaries')
          .select('user_id, steps, recovery_score, sleep_duration_minutes')
          .in('user_id', friendIds)
          .eq('date', today)
      : Promise.resolve({ data: [] }),
    supabase
      .from('challenge_participants')
      .select(
        `current_value, joined_at,
         challenges(id, title, metric, target_value, starts_at, ends_at)`
      )
      .eq('user_id', user.id),
  ])

  const summaryMap = Object.fromEntries((summaries ?? []).map((s) => [s.user_id, s]))

  const friends = (profiles ?? []).map((p) => ({
    id: p.id,
    display_name: p.display_name ?? p.email?.split('@')[0] ?? 'User',
    steps_today: summaryMap[p.id]?.steps ?? null,
    recovery_score: summaryMap[p.id]?.recovery_score ?? null,
    sleep_minutes: summaryMap[p.id]?.sleep_duration_minutes ?? null,
  }))

  const activeChallenges = (participations ?? []).filter((p) => {
    const c = p.challenges as unknown as { starts_at: string; ends_at: string } | null
    return c && c.starts_at <= today && c.ends_at >= today
  }) as unknown as Array<{
    current_value: number
    joined_at: string
    challenges: {
      id: string
      title: string
      metric: string
      target_value: number
      starts_at: string
      ends_at: string
    } | null
  }>

  return (
    <main role="main" aria-label="Friends" id="main-content">
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
            <h1 className="text-xl font-bold text-text-primary">Social</h1>
            <p className="text-sm text-text-secondary">Friends &amp; weekly challenges</p>
          </div>
          <Users className="w-5 h-5 text-text-secondary" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <SocialClient friends={friends} activeChallenges={activeChallenges} />
      </main>
      <BottomNav />
    </div>
    </main>
  )
}
