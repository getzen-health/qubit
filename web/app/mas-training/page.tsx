import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MasTrainingClient } from './mas-training-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'MAS Training Zones' }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MasTrainingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/running"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to running"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">MAS Training Zones</h1>
            <p className="text-sm text-text-secondary">
              Maximal Aerobic Speed · vVO₂max calculator
            </p>
          </div>
          <span className="text-2xl">🏃</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <MasTrainingClient />
      </main>
      <BottomNav />
    </div>
  )
}
