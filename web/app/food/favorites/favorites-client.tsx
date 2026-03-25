'use client'

import { useState } from 'react'
import { Bookmark, BookmarkX } from 'lucide-react'

interface FavoriteRecord {
  id: string
  barcode: string | null
  product_name: string
  brand: string | null
  health_score: number | null
  nova_group: number | null
  thumbnail_url: string | null
  created_at: string
}

function gradeFromScore(score: number | null): { grade: string; color: string } {
  if (score == null) return { grade: 'unknown', color: 'bg-gray-400' }
  if (score >= 75) return { grade: 'excellent', color: 'bg-green-500' }
  if (score >= 55) return { grade: 'good', color: 'bg-lime-500' }
  if (score >= 35) return { grade: 'mediocre', color: 'bg-orange-500' }
  return { grade: 'poor', color: 'bg-red-500' }
}

export function FavoritesClient({ favorites: initial }: { favorites: FavoriteRecord[] }) {
  const [favorites, setFavorites] = useState<FavoriteRecord[]>(initial)
  const [removing, setRemoving] = useState<string | null>(null)

  async function handleUnfavorite(barcode: string | null) {
    if (!barcode) return
    setRemoving(barcode)
    try {
      const res = await fetch(`/api/food/favorites?barcode=${encodeURIComponent(barcode)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.barcode !== barcode))
      }
    } finally {
      setRemoving(null)
    }
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <Bookmark className="w-14 h-14 text-text-secondary opacity-30" />
        <p className="text-text-secondary font-medium">No favourites yet</p>
        <p className="text-xs text-text-secondary">Bookmark products from the scanner to save them here</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {favorites.map((fav) => {
        const { grade, color } = gradeFromScore(fav.health_score)
        const isRemoving = removing === fav.barcode
        return (
          <div
            key={fav.id}
            className="bg-surface rounded-2xl border border-border p-4 flex items-center gap-3"
          >
            {fav.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fav.thumbnail_url}
                alt={fav.product_name}
                className="w-12 h-12 object-contain rounded-xl bg-surface-secondary shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-surface-secondary shrink-0 flex items-center justify-center text-xl">
                🍎
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-primary truncate">{fav.product_name}</p>
              {fav.brand && (
                <p className="text-xs text-text-secondary truncate">{fav.brand}</p>
              )}
              {fav.nova_group && (
                <p className="text-xs text-text-secondary mt-0.5">NOVA {fav.nova_group}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {fav.health_score != null && (
                <div
                  className={`flex flex-col items-center justify-center rounded-full ${color} text-white w-11 h-11`}
                >
                  <span className="text-sm font-black leading-none">{fav.health_score}</span>
                  <span className="text-[9px] font-semibold capitalize leading-none mt-0.5">{grade}</span>
                </div>
              )}
              <button
                onClick={() => handleUnfavorite(fav.barcode)}
                disabled={isRemoving}
                className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                aria-label="Remove from favourites"
              >
                <BookmarkX className="w-5 h-5" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
