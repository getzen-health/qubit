import { createServerClient } from '@/lib/supabase/server'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import Link from 'next/link'

export default async function ScanHistoryPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let scans: any[] = []
  if (user) {
    const { data } = await supabase
      .from('scan_history')
      .select('*')
      .eq('user_id', user.id)
      .order('scanned_at', { ascending: false })
      .limit(50)
    scans = data || []
  }

  function scoreColor(score: number) {
    if (score >= 75) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Scanner', href: '/scanner' }, { label: 'History' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Scan History</h1>
        <Link href="/scanner" className="text-sm text-primary hover:underline">Scan New</Link>
      </div>
      {scans.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">📦</p>
          <p>No scans yet. Start scanning products!</p>
          <Link href="/scanner" className="mt-4 inline-block text-primary hover:underline">Open Scanner →</Link>
        </div>
      )}
      <div className="space-y-3">
        {scans.map((scan: any) => (
          <div key={scan.id} className="flex items-center gap-4 border border-border rounded-xl p-4">
            {scan.image_url && <img src={scan.image_url} alt={scan.product_name} className="w-12 h-12 rounded-lg object-cover" />}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{scan.product_name}</p>
              {scan.brand && <p className="text-xs text-muted-foreground">{scan.brand}</p>}
              <p className="text-xs text-muted-foreground">{new Date(scan.scanned_at).toLocaleDateString()}</p>
            </div>
            {scan.score != null && (
              <span className={`text-lg font-bold ${scoreColor(scan.score)}`}>{scan.score}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
