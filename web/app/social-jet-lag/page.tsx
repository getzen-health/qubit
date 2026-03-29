import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Moon } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
const SocialJetLagClient = dynamic(() => import('./social-jet-lag-client').then(m => ({ default: m.SocialJetLagClient })))

export const metadata = { title: 'Social Jet Lag' }

export default async function SocialJetLagPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Social Jet Lag</h1>
            <p className="text-sm text-text-secondary">Circadian Clock Misalignment</p>
          </div>
          <Moon className="w-5 h-5 text-text-secondary" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">
        <SocialJetLagClient />
      </main>
      <BottomNav />
    </div>
  )
}
