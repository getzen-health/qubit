'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, Scan, History, AlertCircle, Search } from 'lucide-react'
import Link from 'next/link'
import { NutritionLabelOCR, ParsedNutritionLabel } from '@/components/nutrition-label-ocr'

type Tab = 'barcode' | 'ocr'

interface ProductResult {
  name: string
  brand?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
  servingSize: string
  healthScore?: { score: number; grade?: string }
  imageUrl?: string
  ingredients?: string
  novaGroup?: number
}

function scoreColor(score: number) {
  if (score >= 70) return 'bg-green-500 text-white'
  if (score >= 40) return 'bg-yellow-400 text-black'
  return 'bg-red-500 text-white'
}

function scoreBadge(score: number) {
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-bold ${scoreColor(score)}`}>
      {score}
    </span>
  )
}

export default function ScannerPage() {
  const [tab, setTab] = useState<Tab>('barcode')
  const [scanning, setScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [result, setResult] = useState<ProductResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const scannerContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null)

  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop()
        await html5QrRef.current.clear()
      } catch {
        // ignore
      }
      html5QrRef.current = null
    }
    setScanning(false)
  }, [])

  const lookupBarcode = useCallback(async (barcode: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/food/barcode?code=${encodeURIComponent(barcode.trim())}`)
      const data = await res.json()
      if (!res.ok || data.error || !data.food) {
        const msg = data.error ?? 'Product not found. Try scanning the nutrition label with OCR instead.'
        setError(msg)
      } else {
        setResult(data.food)
      }
    } catch {
      setError('Network error. Check your connection and try again.')
    }
    setLoading(false)
  }, [])

  const startScanner = useCallback(async () => {
    setError(null)
    setResult(null)
    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode')
      setScanning(true)
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
        false
      )
      html5QrRef.current = scanner
      scanner.render(
        async (decoded: string) => {
          await stopScanner()
          await lookupBarcode(decoded)
        },
        () => {}
      )
    } catch {
      setError('Camera access unavailable. Use manual entry or OCR mode.')
      setScanning(false)
    }
  }, [stopScanner, lookupBarcode])

  useEffect(() => () => { stopScanner() }, [stopScanner])

  function switchTab(t: Tab) {
    stopScanner()
    setResult(null)
    setError(null)
    setTab(t)
  }

  function handleOCRResult(parsed: ParsedNutritionLabel) {
    setResult({
      name: 'Scanned Product',
      calories: parsed.calories,
      protein: parsed.proteinG,
      carbs: parsed.carbsG,
      fat: parsed.fatG,
      fiber: parsed.fiberG,
      sodium: parsed.sodiumMg,
      servingSize: parsed.servingSize ?? '100g',
      healthScore: { score: parsed.estimatedScore },
    })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Food Scanner</h1>
        <Link
          href="/scanner/history"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <History className="w-4 h-4" /> History
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <button
          onClick={() => switchTab('barcode')}
          className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            tab === 'barcode'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Scan className="w-4 h-4 inline mr-1.5" />
          Barcode
        </button>
        <button
          onClick={() => switchTab('ocr')}
          className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            tab === 'ocr'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Camera className="w-4 h-4 inline mr-1.5" />
          Label OCR
        </button>
      </div>

      {/* ── Barcode tab ──────────────────────────────────────────────── */}
      {tab === 'barcode' && !result && (
        <div className="space-y-4">
          {/* Camera scanner */}
          {!scanning && !loading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Scan className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm mb-5">
                Point your camera at a barcode or enter it manually.
              </p>
              <button
                onClick={startScanner}
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Open Camera
              </button>
            </div>
          )}

          {scanning && <div id="qr-reader" ref={scannerContainerRef} className="rounded-2xl overflow-hidden" />}

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Looking up product…</p>
            </div>
          )}

          {error && (
            <div className="flex gap-3 items-start p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => { setError(null); startScanner() }} className="text-primary text-sm hover:underline">
                    Try again
                  </button>
                  <button onClick={() => switchTab('ocr')} className="text-primary text-sm hover:underline">
                    Use OCR instead →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manual barcode entry */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground mb-2">Or enter barcode manually:</p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 3017620422003"
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && manualBarcode.length >= 8 && lookupBarcode(manualBarcode)}
                className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={() => lookupBarcode(manualBarcode)}
                disabled={manualBarcode.length < 8}
                className="bg-primary text-white px-4 py-2 rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── OCR tab ──────────────────────────────────────────────────── */}
      {tab === 'ocr' && !result && (
        <NutritionLabelOCR onResult={handleOCRResult} />
      )}

      {/* ── Result card ──────────────────────────────────────────────── */}
      {result && (
        <div className="mt-2 border border-border rounded-2xl overflow-hidden bg-surface">
          <div className="flex items-center gap-4 p-4">
            {result.imageUrl && (
              <img
                src={result.imageUrl}
                alt={result.name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{result.name}</p>
              {result.brand && <p className="text-xs text-muted-foreground">{result.brand}</p>}
              <p className="text-xs text-muted-foreground">per {result.servingSize}</p>
            </div>
            {result.healthScore && scoreBadge(result.healthScore.score)}
          </div>

          {/* Macros row */}
          <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
            {[
              { label: 'Calories', value: result.calories },
              { label: 'Protein', value: `${result.protein}g` },
              { label: 'Carbs', value: `${result.carbs}g` },
              { label: 'Fat', value: `${result.fat}g` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center py-3 px-1">
                <p className="text-base font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Secondary macros */}
          {(result.fiber > 0 || result.sodium > 0) && (
            <div className="flex gap-4 px-4 py-2 border-t border-border text-xs text-muted-foreground">
              {result.fiber > 0 && <span>Fiber: <strong className="text-foreground">{result.fiber}g</strong></span>}
              {result.sodium > 0 && <span>Sodium: <strong className="text-foreground">{result.sodium}mg</strong></span>}
              {result.novaGroup && <span>NOVA: <strong className="text-foreground">{result.novaGroup}</strong></span>}
            </div>
          )}

          {/* Ingredients preview */}
          {result.ingredients && (
            <div className="px-4 py-3 border-t border-border bg-muted/30">
              <p className="text-xs font-medium mb-1">Ingredients</p>
              <p className="text-xs text-muted-foreground line-clamp-3">{result.ingredients}</p>
            </div>
          )}

          <div className="px-4 py-3 border-t border-border">
            <button
              onClick={() => { setResult(null); setError(null) }}
              className="w-full px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
            >
              Scan Another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
