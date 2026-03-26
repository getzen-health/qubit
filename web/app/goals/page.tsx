import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Target } from 'lucide-react'
import { GoalsClient } from './goals-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = {
  title: 'Health Goals — KQuarks',
  description: 'Set SMART goals with the WOOP framework. Vision board, progress tracking, and weekly check-ins.',
}

export default async function GoalsPage() {
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
            href="/dashboard"
            className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-bold text-text-primary">Health Goals</h1>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <GoalsClient />
      </main>
      <BottomNav />
    </div>
  )
}
