'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Html5Qrcode } from 'html5-qrcode'

interface FoodItem {
  name: string
  brand?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  servingSize: string
  barcode?: string
  imageUrl?: string
}

interface BarcodeScannerProps {
  onFoodFound: (food: FoodItem) => void
  onClose: () => void
}

export function BarcodeScanner({ onFoodFound, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualBarcode, setManualBarcode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch {
        // Scanner might already be stopped
      }
      scannerRef.current = null
    }
    setIsScanning(false)
  }, [])

  const lookupBarcode = async (barcode: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/food/barcode?code=${barcode}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else if (data.food) {
        onFoodFound(data.food)
      } else {
        setError('Food not found. Try manual entry.')
      }
    } catch {
      setError('Failed to lookup barcode. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const startScanner = async () => {
    if (!containerRef.current) return

    setError(null)
    setIsScanning(true)

    try {
      scannerRef.current = new Html5Qrcode('barcode-reader')

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777,
        },
        async (decodedText) => {
          await stopScanner()
          await lookupBarcode(decodedText)
        },
        () => {
          // QR code scan error (ignore, keep scanning)
        }
      )
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions or enter barcode manually.')
      setIsScanning(false)
    }
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (manualBarcode.trim()) {
      await lookupBarcode(manualBarcode.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scan Barcode</h3>
          <button
            onClick={() => {
              stopScanner()
              onClose()
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {/* Scanner container */}
          <div
            ref={containerRef}
            className="relative bg-gray-900 rounded-xl overflow-hidden mb-4"
            style={{ minHeight: '200px' }}
          >
            <div id="barcode-reader" className="w-full" />

            {!isScanning && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">📷</div>
                <button
                  onClick={startScanner}
                  className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition"
                >
                  Start Camera
                </button>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80">
                <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mb-4" />
                <p className="text-white">Looking up food...</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Manual entry */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-500 mb-3">Or enter barcode manually:</p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Enter barcode number"
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isLoading || !manualBarcode.trim()}
                className="px-4 py-2 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition disabled:opacity-50"
              >
                Look Up
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FoodImageRecognitionProps {
  onFoodRecognized: (foods: FoodItem[]) => void
  onClose: () => void
}

export function FoodImageRecognition({ onFoodRecognized, onClose }: FoodImageRecognitionProps) {
  const [image, setImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recognizedFoods, setRecognizedFoods] = useState<FoodItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsCameraActive(true)
      setError(null)
    } catch {
      setError('Camera access denied. Please use file upload instead.')
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setImage(dataUrl)
      stopCamera()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const analyzeImage = async () => {
    if (!image) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/food/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else if (data.foods && data.foods.length > 0) {
        setRecognizedFoods(data.foods)
      } else {
        setError('Could not recognize any food in the image. Try a clearer photo.')
      }
    } catch {
      setError('Failed to analyze image. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAddFoods = () => {
    onFoodRecognized(recognizedFoods)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recognize Food</h3>
          <button
            onClick={() => {
              stopCamera()
              onClose()
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {!image && !recognizedFoods.length && (
            <>
              {/* Camera/Photo capture area */}
              <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4" style={{ minHeight: '250px' }}>
                {isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <button
                        onClick={capturePhoto}
                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition"
                      >
                        <div className="w-12 h-12 bg-purple-500 rounded-full" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="text-6xl">🍽️</div>
                    <p className="text-white/70 text-sm">Take a photo of your food</p>
                    <div className="flex gap-3">
                      <button
                        onClick={startCamera}
                        className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Camera
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Gallery
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </>
          )}

          {image && !recognizedFoods.length && (
            <>
              <div className="relative rounded-xl overflow-hidden mb-4">
                <Image 
                  src={image} 
                  alt="Food" 
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover" 
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mb-4" />
                    <p className="text-white">Analyzing food...</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setImage(null)}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Retake
                </button>
                <button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition disabled:opacity-50"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Food'}
                </button>
              </div>
            </>
          )}

          {recognizedFoods.length > 0 && (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-3">Recognized foods:</p>
                <div className="space-y-3">
                  {recognizedFoods.map((food, i) => (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{food.name}</span>
                        <span className="text-purple-500 font-bold">{food.calories} kcal</span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>P: {food.protein}g</span>
                        <span>C: {food.carbs}g</span>
                        <span>F: {food.fat}g</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{food.servingSize}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setImage(null)
                    setRecognizedFoods([])
                  }}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Scan Another
                </button>
                <button
                  onClick={handleAddFoods}
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition"
                >
                  Add to Log
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function AddFoodButton({ onScanBarcode, onRecognizeFood }: { onScanBarcode: () => void; onRecognizeFood: () => void }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Food
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            <button
              onClick={() => {
                setIsOpen(false)
                onScanBarcode()
              }}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Scan Barcode</div>
                <div className="text-xs text-gray-500">Scan product barcode</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsOpen(false)
                onRecognizeFood()
              }}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left border-t border-gray-100 dark:border-gray-700"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Photo AI</div>
                <div className="text-xs text-gray-500">Recognize food from image</div>
              </div>
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left border-t border-gray-100 dark:border-gray-700"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Manual Entry</div>
                <div className="text-xs text-gray-500">Enter food details</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
