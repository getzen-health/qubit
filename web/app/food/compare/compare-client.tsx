'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'

interface FoodProduct {
  name: string
  brand?: string
  barcode?: string
  imageUrl?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  novaGroup?: number | null
  healthScore: {
    score: number
    grade: string
    nutriScore?: string | null
  }
}

interface CompareRow {
  label: string
  key: keyof Pick<FoodProduct, 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar'>
  higherIsBetter: boolean
  unit: string
}

const COMPARE_ROWS: CompareRow[] = [
  { label: 'Calories', key: 'calories', higherIsBetter: false, unit: 'kcal' },
  { label: 'Protein', key: 'protein', higherIsBetter: true, unit: 'g' },
  { label: 'Carbs', key: 'carbs', higherIsBetter: false, unit: 'g' },
  { label: 'Fat', key: 'fat', higherIsBetter: false, unit: 'g' },
  { label: 'Fiber', key: 'fiber', higherIsBetter: true, unit: 'g' },
  { label: 'Sugar', key: 'sugar', higherIsBetter: false, unit: 'g' },
]

const NUTRISCORE_ORDER = ['a', 'b', 'c', 'd', 'e']

function metricWinner(a: number, b: number, higherIsBetter: boolean): 'a' | 'b' | 'tie' {
  if (a === b) return 'tie'
  return higherIsBetter ? (a > b ? 'a' : 'b') : (a < b ? 'a' : 'b')
}

function ProductColumn({ product, label }: { product: FoodProduct | null; label: string }) {
  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center gap-2 p-4">
        <div className="w-16 h-16 rounded-xl bg-surface-secondary flex items-center justify-center text-2xl">🍎</div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-sm text-text-secondary italic">Loading…</p>
      </div>
    )
  }

  const scoreColor =
    product.healthScore.score >= 75
      ? 'text-green-500'
      : product.healthScore.score >= 55
      ? 'text-lime-500'
      : product.healthScore.score >= 35
      ? 'text-orange-500'
      : 'text-red-500'

  return (
    <div className="flex-1 flex flex-col items-center gap-2 p-4">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-16 h-16 object-contain rounded-xl bg-surface-secondary"
        />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-surface-secondary flex items-center justify-center text-2xl">🍎</div>
      )}
      <p className="text-xs text-text-secondary font-medium">{label}</p>
      <p className="font-semibold text-text-primary text-sm text-center leading-tight line-clamp-2">{product.name}</p>
      {product.brand && <p className="text-xs text-text-secondary line-clamp-1">{product.brand}</p>}
      <div className={`text-2xl font-black ${scoreColor}`}>{product.healthScore.score}</div>
      <p className="text-[10px] text-text-secondary -mt-1">health score</p>
    </div>
  )
}

export function CompareClient({ barcodeA, barcodeB }: { barcodeA: string; barcodeB: string }) {
  const [productA, setProductA] = useState<FoodProduct | null>(null)
  const [productB, setProductB] = useState<FoodProduct | null>(null)
  const [errorA, setErrorA] = useState<string | null>(null)
  const [errorB, setErrorB] = useState<string | null>(null)

  async function fetchProduct(barcode: string): Promise<FoodProduct | null> {
    const res = await fetch(`/api/food/barcode?code=${encodeURIComponent(barcode)}`)
    if (!res.ok) return null
    const json = await res.json()
    return json.food ?? null
  }

  useEffect(() => {
    setProductA(null)
    setErrorA(null)
    fetchProduct(barcodeA).then((p) => {
      if (!p) setErrorA('Product not found')
      else setProductA(p)
    })
  }, [barcodeA])

  useEffect(() => {
    setProductB(null)
    setErrorB(null)
    fetchProduct(barcodeB).then((p) => {
      if (!p) setErrorB('Product not found')
      else setProductB(p)
    })
  }, [barcodeB])

  const novaWinner =
    productA && productB && productA.novaGroup != null && productB.novaGroup != null
      ? productA.novaGroup < productB.novaGroup
        ? 'a'
        : productA.novaGroup > productB.novaGroup
        ? 'b'
        : 'tie'
      : 'tie'

  const nutriWinner = (() => {
    const nsA = productA?.healthScore.nutriScore?.toLowerCase()
    const nsB = productB?.healthScore.nutriScore?.toLowerCase()
    if (!nsA || !nsB) return 'tie'
    const rankA = NUTRISCORE_ORDER.indexOf(nsA)
    const rankB = NUTRISCORE_ORDER.indexOf(nsB)
    if (rankA < rankB) return 'a'
    if (rankA > rankB) return 'b'
    return 'tie'
  })()

  const scoreWinner =
    productA && productB
      ? metricWinner(productA.healthScore.score, productB.healthScore.score, true)
      : 'tie'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <Link href="/food/scanner" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to scanner
      </Link>

      {/* Header columns */}
      <div className="bg-surface rounded-2xl border border-border flex divide-x divide-border">
        <ProductColumn product={productA} label="Product A" />
        <ProductColumn product={productB} label="Product B" />
      </div>

      {(errorA || errorB) && (
        <p className="text-sm text-red-500 text-center">
          {errorA ? `Product A: ${errorA}` : ''} {errorB ? `Product B: ${errorB}` : ''}
        </p>
      )}

      {/* Comparison table */}
      {productA && productB && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {/* Health score row */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-border">
            <span className={`p-3 text-center text-sm font-bold ${scoreWinner === 'a' ? 'text-green-500' : scoreWinner === 'b' ? 'text-red-500' : 'text-text-primary'}`}>
              {productA.healthScore.score}/100
            </span>
            <span className="px-3 text-xs text-text-secondary text-center w-28">Health Score</span>
            <span className={`p-3 text-center text-sm font-bold ${scoreWinner === 'b' ? 'text-green-500' : scoreWinner === 'a' ? 'text-red-500' : 'text-text-primary'}`}>
              {productB.healthScore.score}/100
            </span>
          </div>

          {/* NOVA group row */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-border">
            <span className={`p-3 text-center text-sm font-bold ${novaWinner === 'a' ? 'text-green-500' : novaWinner === 'b' ? 'text-red-500' : 'text-text-primary'}`}>
              {productA.novaGroup != null ? `NOVA ${productA.novaGroup}` : '—'}
            </span>
            <span className="px-3 text-xs text-text-secondary text-center w-28">NOVA Group</span>
            <span className={`p-3 text-center text-sm font-bold ${novaWinner === 'b' ? 'text-green-500' : novaWinner === 'a' ? 'text-red-500' : 'text-text-primary'}`}>
              {productB.novaGroup != null ? `NOVA ${productB.novaGroup}` : '—'}
            </span>
          </div>

          {/* Nutri-Score row */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-border">
            <span className={`p-3 text-center text-sm font-bold ${nutriWinner === 'a' ? 'text-green-500' : nutriWinner === 'b' ? 'text-red-500' : 'text-text-primary'}`}>
              {productA.healthScore.nutriScore?.toUpperCase() ?? '—'}
            </span>
            <span className="px-3 text-xs text-text-secondary text-center w-28">Nutri-Score</span>
            <span className={`p-3 text-center text-sm font-bold ${nutriWinner === 'b' ? 'text-green-500' : nutriWinner === 'a' ? 'text-red-500' : 'text-text-primary'}`}>
              {productB.healthScore.nutriScore?.toUpperCase() ?? '—'}
            </span>
          </div>

          {/* Macro rows */}
          {COMPARE_ROWS.map((row, i) => {
            const a = productA[row.key]
            const b = productB[row.key]
            const winner = metricWinner(a, b, row.higherIsBetter)
            const isLast = i === COMPARE_ROWS.length - 1
            return (
              <div
                key={row.key}
                className={`grid grid-cols-[1fr_auto_1fr] items-center ${isLast ? '' : 'border-b border-border'}`}
              >
                <span className={`p-3 text-center text-sm font-bold ${winner === 'a' ? 'text-green-500' : winner === 'b' ? 'text-red-500' : 'text-text-primary'}`}>
                  {a}{row.unit}
                </span>
                <span className="px-3 text-xs text-text-secondary text-center w-28">{row.label}</span>
                <span className={`p-3 text-center text-sm font-bold ${winner === 'b' ? 'text-green-500' : winner === 'a' ? 'text-red-500' : 'text-text-primary'}`}>
                  {b}{row.unit}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Swap barcodes link */}
      {productA && productB && (
        <Link
          href={`/food/compare?a=${encodeURIComponent(barcodeB)}&b=${encodeURIComponent(barcodeA)}`}
          className="flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors py-2"
        >
          <RefreshCw className="w-4 h-4" />
          Swap products
        </Link>
      )}
    </div>
  )
}
