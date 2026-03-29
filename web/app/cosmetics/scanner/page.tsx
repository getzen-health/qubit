'use client'
import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

function gradeColor(grade: string) {
  switch (grade) {
    case 'A+': return 'bg-green-600 text-white'
    case 'A': return 'bg-green-500 text-white'
    case 'B': return 'bg-yellow-400 text-black'
    case 'C': return 'bg-orange-400 text-black'
    case 'D': return 'bg-red-400 text-white'
    default: return 'bg-red-700 text-white'
  }
}

export default function CosmeticsScannerPage() {
  const [barcode, setBarcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleScan() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`/api/cosmetics/scan?barcode=${barcode}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Not found')
        setLoading(false)
        return
      }
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError('Scan failed')
    }
    setLoading(false)
  }

  // Camera barcode scan (Html5Qrcode)
  async function handleCameraScan() {
    setError('')
    setResult(null)
    setLoading(true)
    try {
      // Dynamically import to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode')
      const html5QrCode = new Html5Qrcode('qr-reader')
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText: string) => {
          setBarcode(decodedText)
          html5QrCode.stop()
          setTimeout(handleScan, 100)
        },
        () => {}
      )
    } catch (e) {
      setError('Camera scan failed')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <button className="mb-4 text-blue-600" onClick={() => router.push('/dashboard')}>{'<'} Back to Dashboard</button>
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">🧴 Cosmetics Scanner</h1>
      <p className="mb-4 text-gray-600">Scan or enter a barcode to check ingredient safety and clean beauty score.</p>
      <div className="flex gap-2 mb-4">
        <input
          ref={inputRef}
          className="border rounded px-3 py-2 flex-1"
          placeholder="Enter barcode"
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleScan()}
          inputMode="numeric"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleScan} disabled={loading}>Scan</button>
        <button className="bg-gray-200 px-3 py-2 rounded" onClick={handleCameraScan} disabled={loading}>📷</button>
      </div>
      <div id="qr-reader" className="mb-4" style={{ width: 300, height: 240 }}></div>
      {loading && <div className="mb-4">Scanning...</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {result && (
        <div className="border rounded-lg p-4 mb-4 bg-white shadow">
          <div className="flex gap-4 items-center mb-2">
            {result.product.imageUrl && <Image src={result.product.imageUrl} alt="Product" width={80} height={80} className="object-contain rounded" unoptimized />}
            <div>
              <div className="font-bold text-lg">{result.product.name}</div>
              <div className="text-gray-500">{result.product.brand}</div>
              <div className={`inline-block px-2 py-1 rounded text-xs font-bold mt-1 ${gradeColor(result.grade)}`}>{result.grade} ({result.score})</div>
            </div>
          </div>
          <div className="mb-2">
            <span className="font-semibold">Barcode:</span> {result.product.barcode}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Ingredients:</span>
            <div className="text-sm text-gray-700 whitespace-pre-line">{result.product.ingredients || 'N/A'}</div>
          </div>
          {result.concerns.length > 0 && (
            <div className="mb-2">
              <span className="font-semibold">What to watch out for:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {result.concerns.map((c: string, i: number) => (
                  <span key={i} className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs">{c}</span>
                ))}
              </div>
            </div>
          )}
          {result.highlights.length > 0 && (
            <div className="mb-2">
              <span className="font-semibold">Highlights:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {result.highlights.map((h: string, i: number) => (
                  <span key={i} className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">{h}</span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-400">Powered by Open Beauty Facts</div>
        </div>
      )}
    </div>
  )
}
