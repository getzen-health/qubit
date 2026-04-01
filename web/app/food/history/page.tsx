import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { HistoryClient, type ScanRecord } from './history-client'

export const metadata = { title: 'Scan History — GetZen' }

const PAGE_SIZE = 20

export default async function ScanHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { offset: offsetParam } = await searchParams
  const offset = Math.max(0, parseInt(offsetParam ?? '0', 10))

  const { data: scans } = await supabase
    .from('product_scans')
    .select('*')
    .eq('user_id', user.id)
    .order('scanned_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const hasMore = (scans?.length ?? 0) === PAGE_SIZE

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/food/scanner" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Scan History</h1>
            <p className="text-xs text-text-secondary">Showing {scans?.length ?? 0} scanned products</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <HistoryClient scans={(scans ?? []) as ScanRecord[]} initialOffset={offset} hasMore={hasMore} />
      </div>

      <BottomNav />
    </div>
  )
}
