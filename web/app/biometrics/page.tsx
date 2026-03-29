import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/bottom-nav'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
const BiometricsClient = dynamic(() => import('./biometrics-client').then(m => ({ default: m.BiometricsClient })), { ssr: false })
import type { BiometricLog, BiometricSettings } from '@/lib/biometrics'

export default async function BiometricsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const since = new Date()
  since.setDate(since.getDate() - 180)

  const [{ data: logs }, { data: settings }] = await Promise.all([
    supabase
      .from('biometric_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', since.toISOString().split('T')[0])
      .order('date', { ascending: true }),
    supabase
      .from('biometric_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Biometrics</h1>
            <p className="text-sm text-text-secondary">Weight, body composition & measurements</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-28">
        <BiometricsClient
          initialLogs={(logs ?? []) as BiometricLog[]}
          initialSettings={(settings ?? {}) as BiometricSettings}
        />
      </main>

      <BottomNav />
    </div>
  )
}
