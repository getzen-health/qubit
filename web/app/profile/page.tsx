import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings, Calendar, Ruler, Scale, Activity, Target } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

function StatCard({ icon: Icon, label, value, unit }: { icon: React.ElementType; label: string; value: string | number | null; unit?: string }) {
  return (
    <div className="bg-surface-secondary rounded-xl p-4 flex flex-col gap-1 text-center">
      <Icon className="w-4 h-4 text-accent mx-auto mb-0.5" />
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="font-bold text-text-primary text-lg leading-tight">
        {value ?? '—'}{value && unit ? <span className="text-xs font-normal text-text-secondary ml-0.5">{unit}</span> : null}
      </p>
    </div>
  )
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: stats }] = await Promise.all([
    supabase.from('users')
      .select('full_name, age, biological_sex, height_cm, weight_kg, fitness_goal, calorie_goal, display_name')
      .eq('id', user.id)
      .single(),
    supabase.from('daily_summaries')
      .select('steps, active_calories, resting_heart_rate')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7),
  ])

  const recentSteps = stats?.length ? Math.round(stats.reduce((s, r) => s + (r.steps ?? 0), 0) / stats.length) : null
  const recentRHR = stats?.length ? Math.round(stats.filter(r => r.resting_heart_rate).reduce((s, r) => s + (r.resting_heart_rate ?? 0), 0) / (stats.filter(r => r.resting_heart_rate).length || 1)) : null

  const displayName = profile?.display_name || profile?.full_name || user.email?.split('@')[0] || 'You'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <h1 className="text-xl font-bold text-text-primary flex-1">Profile</h1>
          <Link href="/settings/account" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Edit profile">
            <Settings className="w-5 h-5 text-text-secondary" />
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Avatar + name */}
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center text-center gap-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-accent/20 flex items-center justify-center text-2xl font-bold text-accent">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{displayName}</h2>
            <p className="text-sm text-text-secondary mt-0.5">{user.email}</p>
          </div>
          {profile?.fitness_goal && (
            <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium capitalize">
              🎯 {profile.fitness_goal.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Body stats */}
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3 px-1">Body</p>
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Calendar} label="Age" value={profile?.age} unit="yrs" />
            <StatCard icon={Ruler} label="Height" value={profile?.height_cm} unit="cm" />
            <StatCard icon={Scale} label="Weight" value={profile?.weight_kg} unit="kg" />
          </div>
        </div>

        {/* 7-day averages */}
        {(recentSteps || recentRHR) && (
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3 px-1">7-Day Averages</p>
            <div className="grid grid-cols-2 gap-3">
              {recentSteps !== null && <StatCard icon={Activity} label="Daily Steps" value={recentSteps.toLocaleString()} />}
              {recentRHR !== null && <StatCard icon={Activity} label="Resting HR" value={recentRHR} unit="bpm" />}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3 px-1">Settings</p>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {[
              { href: '/settings/goals', label: 'Health Goals', icon: '🎯' },
              { href: '/settings/account', label: 'Account & Profile', icon: '👤' },
              { href: '/settings/notifications', label: 'Notifications', icon: '🔔' },
              { href: '/insights/benchmarks', label: 'How I Compare', icon: '📊' },
            ].map(({ href, label, icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-secondary transition-colors">
                <span className="text-lg w-6 text-center">{icon}</span>
                <span className="text-sm font-medium text-text-primary flex-1">{label}</span>
                <span className="text-text-secondary text-sm">›</span>
              </Link>
            ))}
          </div>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
