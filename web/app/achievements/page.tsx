import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Achievements' }

interface Achievement {
  id: string
  achievement_type: string
  title: string
  description: string
  icon: string
  granted_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: achievements } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', user.id)
    .order('granted_at', { ascending: false })

  const earned = achievements ?? []

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Achievements</h1>
            <p className="text-sm text-text-secondary">
              {earned.length === 0 ? 'Sync data to earn badges' : `${earned.length} earned`}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {earned.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Trophy className="w-16 h-16 text-text-secondary opacity-30" />
            <p className="text-text-secondary text-lg font-medium">No achievements yet</p>
            <p className="text-text-secondary text-sm text-center max-w-xs">
              Sync your Apple Health data and hit milestones to earn your first badge.
            </p>
            <Link
              href="/sync"
              className="mt-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Sync Health Data
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {earned.map((achievement: Achievement) => (
              <div
                key={achievement.id}
                className="bg-surface rounded-xl p-4 flex items-start gap-4 border border-border"
              >
                <div className="text-4xl w-14 h-14 flex items-center justify-center bg-orange-500/10 rounded-xl shrink-0">
                  {achievement.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-text-primary text-sm">{achievement.title}</p>
                  <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                    {achievement.description}
                  </p>
                  <p className="text-text-secondary text-xs mt-2 opacity-60">
                    Earned {formatDate(achievement.granted_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
