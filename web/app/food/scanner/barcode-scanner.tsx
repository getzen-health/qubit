'use client'

import { useEffect, useRef } from 'react'

interface BarcodeScannerProps {
  onResult: (code: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onResult, onClose }: BarcodeScannerProps) {
  const divId = 'kq-barcode-scanner'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true

    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      if (!mounted) return
      scannerRef.current = new Html5QrcodeScanner(
        divId,
        {
          fps: 10,
          qrbox: { width: 280, height: 160 },
          rememberLastUsedCamera: true,
          supportedScanTypes: [0], // 0 = SCAN_TYPE_CAMERA only (no file upload)
        },
        /* verbose= */ false
      )
      scannerRef.current.render(
        (decodedText: string) => {
          // Stop scanner then bubble result up
          scannerRef.current?.clear().catch(() => {})
          onResult(decodedText)
        },
        () => {
          // Ignore individual scan errors (e.g. frame not yet readable)
        }
      )
    })

    return () => {
      mounted = false
      scannerRef.current?.clear().catch(() => {})
    }
  }, [onResult])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="bg-surface rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-text-primary">Scan Barcode</h2>
          <button
            onClick={onClose}
            aria-label="Close scanner"
            className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
          >
            ✕
          </button>
        </div>

        {/* Scanner viewport */}
        <div id={divId} className="w-full" />

        <p className="text-xs text-text-secondary text-center pb-4 px-4">
          Point your camera at the product barcode (EAN / UPC)
        </p>
      </div>
    </div>
  )
}
