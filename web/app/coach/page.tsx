import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CoachPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main role="main" aria-label="AI Health Coach" id="main-content">
      <div className="container mx-auto py-8 max-w-3xl">
      <Breadcrumbs items={[{label:'Dashboard',href:'/dashboard'},{label:'AI Coach'}]} />
      <h1 className="text-2xl font-bold mb-2">AI Health Coach</h1>
      <p className="text-muted-foreground mb-8">Personalized guidance based on your health data.</p>
      <div className="grid gap-4">
        <div className="rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">🤖</div>
            <div>
              <p className="font-semibold">Daily Check-In</p>
              <p className="text-sm text-muted-foreground">How are you feeling today?</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['Great', 'Good', 'Tired', 'Sore', 'Stressed'].map(mood => (
              <button key={mood} className="px-3 py-1.5 rounded-full border border-border text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                {mood}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border p-5 space-y-2">
          <p className="font-semibold">Today&apos;s Recommendations</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>Your HRV is trending up — good recovery. Moderate training is safe.</li>
            <li className="flex items-start gap-2"><span className="text-yellow-500 mt-0.5">!</span>Sleep was below 7h last night. Consider a lighter workout today.</li>
            <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">→</span>Drink 2.5L of water today based on your activity level.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-border p-5">
          <p className="font-semibold mb-3">Personalized Programs</p>
          <p className="text-sm text-muted-foreground">AI-curated programs based on your health profile coming soon. Connect Apple Health to unlock personalized recommendations.</p>
          <div className="mt-3 grid gap-2">
            {[
              { name: 'Sleep Optimization', icon: '😴', status: 'Available' },
              { name: 'Stress Reduction', icon: '🧘', status: 'Available' },
              { name: 'Endurance Builder', icon: '🏃', status: 'Coming Soon' },
            ].map(p => (
              <div key={p.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <span>{p.icon}</span>
                  <span className="text-sm font-medium">{p.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'Available' ? 'bg-green-50 text-green-600' : 'bg-muted text-muted-foreground'}`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </main>
  )
}
