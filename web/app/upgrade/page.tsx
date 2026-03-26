import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const PLANS = [
  { name: 'Free', price: '$0', period: 'forever', features: ['Basic health dashboard', 'Food barcode scanning', 'Apple Health sync (7 days)', '1 AI insight/week'], cta: 'Current Plan', highlight: false },
  { name: 'Pro', price: '$9.99', period: 'per month', features: ['Everything in Free', 'Unlimited history', 'Daily AI insights', 'All integrations', 'Injury risk scoring', 'Export data', 'Priority support'], cta: 'Upgrade to Pro', highlight: true },
  { name: 'Team', price: '$24.99', period: 'per month', features: ['Everything in Pro', 'Up to 5 members', 'Coach dashboard', 'Shared challenges', 'Team analytics'], cta: 'Start Team Trial', highlight: false },
]

export default async function UpgradePage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main role="main" aria-label="Upgrade Plan" id="main-content">
      <div className="container mx-auto py-12 max-w-4xl">
      <Breadcrumbs items={[{label:'Dashboard',href:'/dashboard'},{label:'Upgrade'}]} />
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground">Unlock the full power of your health data</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map(plan => (
          <div key={plan.name} className={`rounded-xl border p-6 space-y-4 ${plan.highlight ? 'border-primary shadow-lg' : 'border-border'}`}>
            {plan.highlight && <p className="text-xs font-semibold text-primary uppercase tracking-wide">Most Popular</p>}
            <div>
              <p className="text-xl font-bold">{plan.name}</p>
              <p className="text-3xl font-extrabold mt-1">{plan.price}<span className="text-sm font-normal text-muted-foreground"> / {plan.period}</span></p>
            </div>
            <ul className="space-y-2 text-sm">
              {plan.features.map(f => <li key={f} className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>{f}</li>)}
            </ul>
            <button className={`w-full py-2.5 rounded-lg text-sm font-medium transition-opacity ${plan.highlight ? 'bg-primary text-primary-foreground hover:opacity-90' : 'border border-border hover:bg-muted'}`}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
    </main>
  )
}
