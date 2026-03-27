'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, Trash2, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ScanRecord {
  id: string
  barcode: string | null
  product_name: string
  brand: string | null
  health_score: number | null
  nova_group: number | null
  nutriscore: string | null
  thumbnail_url: string | null
  scanned_at: string
  is_favorite?: boolean // Added for favorites
}

function gradeFromScore(score: number | null): { grade: string; color: string } {
  if (score == null) return { grade: 'unknown', color: 'bg-gray-400' }
  if (score >= 75) return { grade: 'excellent', color: 'bg-green-500' }
  if (score >= 55) return { grade: 'good', color: 'bg-lime-500' }
  if (score >= 35) return { grade: 'mediocre', color: 'bg-orange-500' }
  return { grade: 'poor', color: 'bg-red-500' }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HistoryClient({
  scans: initial,
  initialOffset = 0,
  hasMore: initialHasMore = false,
}: {
  scans: ScanRecord[]
  initialOffset?: number
  hasMore?: boolean
}) {
  const [scans, setScans] = useState<ScanRecord[]>(initial)
  const [clearing, setClearing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [offset, setOffset] = useState(initialOffset + initial.length)

  async function handleLoadMore() {
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/food/history?offset=${offset}&limit=20`)
      if (!res.ok) return
      const json = await res.json()
      setScans((prev) => [...prev, ...(json.scans ?? [])])
      setOffset(offset + (json.scans?.length ?? 0))
      setHasMore(json.hasMore ?? false)
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleClearHistory() {
    if (!confirm('Clear all scan history?')) return
    setClearing(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('product_scans').delete().eq('user_id', user.id)
      setScans([])
      setHasMore(false)
      setOffset(0)
    } finally {
      setClearing(false)
    }
  }

  if (scans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <Clock className="w-14 h-14 text-text-secondary opacity-30" />
        <p className="text-text-secondary font-medium">No scan history yet</p>
        <p className="text-xs text-text-secondary">Products you scan will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{scans.length} scans</p>
        <button
          onClick={handleClearHistory}
          disabled={clearing}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {clearing ? 'Clearing…' : 'Clear history'}
        </button>
      </div>

      <div className="space-y-2">
        {scans.map((scan) => {
          const { grade, color } = gradeFromScore(scan.health_score)
          return (
            <div
              key={scan.id}
              className="bg-surface rounded-2xl border border-border p-4 flex items-center gap-3"
            >
              {scan.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={scan.thumbnail_url}
                  alt={scan.product_name}
                  className="w-12 h-12 object-contain rounded-xl bg-surface-secondary shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-surface-secondary shrink-0 flex items-center justify-center text-xl">
                  🍎
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary truncate">{scan.product_name}</p>
                {scan.brand && (
                  <p className="text-xs text-text-secondary truncate">{scan.brand}</p>
                )}
                <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(scan.scanned_at)}
                </p>
                {scan.barcode && (
                  <Link href={`/food/product/${scan.barcode}`} className="text-primary text-xs font-medium underline mt-1 block">View full details →</Link>
                )}
              </div>

              {scan.health_score != null && (
                <div
                  className={`flex flex-col items-center justify-center rounded-full ${color} text-white w-11 h-11 shrink-0`}
                >
                  <span className="text-sm font-black leading-none">{scan.health_score}</span>
                  <span className="text-[9px] font-semibold capitalize leading-none mt-0.5">{grade}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="w-full py-3 rounded-2xl border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}
