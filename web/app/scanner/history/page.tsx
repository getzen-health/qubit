'use client'
import { useState, useEffect, useCallback } from 'react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import Link from 'next/link'
import { useDebounce } from '@/lib/useDebounce'

export default function ScanHistoryPage() {
  const [scans, setScans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [grade, setGrade] = useState<string>('all')
  const debouncedSearch = useDebounce(search, 300)

  const fetchScans = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('q', debouncedSearch)
    if (grade !== 'all') params.append('grade', grade)
    const res = await fetch(`/api/scanner/history?${params.toString()}`)
    const { data } = await res.json()
    setScans(data || [])
    setLoading(false)
  }, [debouncedSearch, grade])

  useEffect(() => { fetchScans() }, [fetchScans])

  function scoreBadge(score: number) {
    let color = 'bg-red-500'
    if (score >= 70) color = 'bg-green-500'
    else if (score >= 40) color = 'bg-yellow-400 text-black'
    return <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${color}`}>{score}</span>
  }

  function handleExport() {
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('q', debouncedSearch)
    if (grade !== 'all') params.append('grade', grade)
    params.append('export', 'csv')
    window.open(`/api/scanner/history?${params.toString()}`, '_blank')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Scanner', href: '/scanner' }, { label: 'History' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Scan History</h1>
        <Link href="/scanner" className="text-sm text-primary hover:underline">Scan New</Link>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={handleExport} className="border rounded px-3 py-1 text-sm bg-muted hover:bg-muted/70">Export CSV</button>
      </div>
      <div className="flex gap-2 mb-4">
        {['all','green','yellow','red'].map(g => (
          <button
            key={g}
            className={`px-3 py-1 rounded text-sm border ${grade===g?'bg-primary text-white':'bg-muted text-muted-foreground'}`}
            onClick={()=>setGrade(g)}
          >
            {g==='all'?'All':g.charAt(0).toUpperCase()+g.slice(1)}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : scans.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">📦</p>
          <p>No scans yet. Start scanning products!</p>
          <Link href="/scanner" className="mt-4 inline-block text-primary hover:underline">Open Scanner →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan: any) => (
            <div key={scan.id} className="flex items-center gap-4 border border-border rounded-xl p-4">
              {scan.image_url && <img src={scan.image_url} alt={scan.product_name} className="w-12 h-12 rounded-lg object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{scan.product_name}</p>
                {scan.brand && <p className="text-xs text-muted-foreground">{scan.brand}</p>}
                <p className="text-xs text-muted-foreground">{new Date(scan.scanned_at).toLocaleDateString()}</p>
              </div>
              {scan.health_score != null && scoreBadge(scan.health_score)}
              <Link href={`/scanner?barcode=${encodeURIComponent(scan.barcode)}`} className="ml-2 px-2 py-1 text-xs rounded bg-primary text-white hover:bg-primary/80">Scan again</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
