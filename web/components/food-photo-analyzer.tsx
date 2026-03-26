"use client"
import { useState, useRef } from 'react'
import { Camera, Upload, Loader2, X } from 'lucide-react'
import Image from 'next/image'

interface FoodPhotoAnalyzerProps {
  onResult?: (result: FoodAnalysisResult) => void
}

interface FoodItem {
  name: string
  portion_estimate: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  confidence: string
}

interface FoodAnalysisResult {
  foods: FoodItem[]
  total: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }
  meal_description: string
}

export function FoodPhotoAnalyzer({ onResult }: FoodPhotoAnalyzerProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<FoodAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImage(file: File) {
    if (!file.type.startsWith('image/')) return
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      setResult(null)
      setError(null)
      setAnalyzing(true)

      try {
        // Extract base64 (remove data:image/...;base64, prefix)
        const base64 = dataUrl.split(',')[1]
        const res = await fetch('/api/food/photo-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        })
        const data = await res.json()
        if (data.error) {
          setError(data.error)
        } else {
          setResult(data.result)
          onResult?.(data.result)
        }
      } catch {
        setError('Analysis failed. Please try again.')
      } finally {
        setAnalyzing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  function reset() {
    setPreview(null)
    setResult(null)
    setError(null)
  }

  const confidenceColor = (c: string) => c === 'high' ? 'text-green-500' : c === 'medium' ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="space-y-3">
      {!preview ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImage(f) }}
          onDragOver={(e) => e.preventDefault()}>
          <Camera className="w-10 h-10 text-text-secondary mx-auto mb-2" />
          <p className="font-semibold text-text-primary text-sm">Take or upload a food photo</p>
          <p className="text-xs text-text-secondary mt-1">AI will estimate calories and macros</p>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f) }} />
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden">
          <Image src={preview} alt="Food photo" width={400} height={300} className="w-full object-cover max-h-48" />
          <button onClick={reset} className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
            <X className="w-4 h-4 text-white" />
          </button>
          {analyzing && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <p className="text-white text-sm font-medium">Analysing food...</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm text-text-secondary italic">{result.meal_description}</p>
          
          {/* Total summary */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Calories', value: result.total.calories, unit: 'kcal' },
              { label: 'Protein', value: result.total.protein_g, unit: 'g' },
              { label: 'Carbs', value: result.total.carbs_g, unit: 'g' },
              { label: 'Fat', value: result.total.fat_g, unit: 'g' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="bg-surface-secondary rounded-xl p-2">
                <div className="text-lg font-bold text-text-primary">{value}</div>
                <div className="text-xs text-text-secondary">{unit}</div>
                <div className="text-xs text-text-secondary">{label}</div>
              </div>
            ))}
          </div>

          {/* Individual foods */}
          <div className="space-y-2">
            {result.foods.map((food, i) => (
              <div key={i} className="flex items-start justify-between gap-2 py-2 border-t border-border">
                <div>
                  <p className="text-sm font-medium text-text-primary">{food.name}</p>
                  <p className="text-xs text-text-secondary">{food.portion_estimate} · <span className={confidenceColor(food.confidence)}>{food.confidence} confidence</span></p>
                </div>
                <span className="text-sm font-semibold text-text-primary shrink-0">{food.calories} kcal</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-text-secondary text-center">AI estimates — actual values may vary by ±20%</p>
        </div>
      )}
    </div>
  )
}
