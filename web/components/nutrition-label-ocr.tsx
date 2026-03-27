'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, Loader2, CheckCircle2, AlertTriangle, Edit3 } from 'lucide-react'

// ── Nutrition Facts Parser ─────────────────────────────────────────────────

export interface ParsedNutritionLabel {
  productName?: string
  servingSize?: string
  servingsPerContainer?: number
  calories: number
  fatG: number
  saturatedFatG: number
  transFatG: number
  cholesterolMg: number
  sodiumMg: number
  carbsG: number
  fiberG: number
  sugarsG: number
  addedSugarsG: number
  proteinG: number
  vitaminDMcg: number
  calciumMg: number
  ironMg: number
  potassiumMg: number
  confidence: number  // 0–1
  rawText: string
  estimatedScore: number
}

function extractNum(text: string, patterns: RegExp[]): number {
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return parseFloat(m[1])
  }
  return 0
}

/** Parse US / Canada / EU Nutrition Facts label from OCR text. */
export function parseNutritionLabel(ocrText: string): ParsedNutritionLabel {
  const tl = ocrText.toLowerCase().replace(/\n/g, ' ').replace(/\s+/g, ' ')

  const calories   = extractNum(tl, [/calories\s+(\d+)/i, /energy[^0-9]*(\d+)\s*kcal/i, /(\d+)\s*kcal/i])
  const fatG       = extractNum(tl, [/total\s*fat\s+(\d+\.?\d*)\s*g/i, /\bfat\s+(\d+\.?\d*)\s*g/i])
  const saturatedFatG = extractNum(tl, [/saturated\s*fat\s+(\d+\.?\d*)\s*g/i])
  const transFatG  = extractNum(tl, [/trans\s*fat\s+(\d+\.?\d*)\s*g/i])
  const cholesterolMg = extractNum(tl, [/cholesterol\s+(\d+)\s*mg/i])
  const sodiumMg   = extractNum(tl, [/sodium\s+(\d+)\s*mg/i, /salt\s+(\d+\.?\d*)\s*g/i])
  const carbsG     = extractNum(tl, [/total\s*carbohydrate[s]?\s+(\d+\.?\d*)\s*g/i, /carbohydrate[s]?\s+(\d+\.?\d*)\s*g/i])
  const fiberG     = extractNum(tl, [/dietary\s*fiber\s+(\d+\.?\d*)\s*g/i, /fibre\s+(\d+\.?\d*)\s*g/i])
  const sugarsG    = extractNum(tl, [/total\s*sugars?\s+(\d+\.?\d*)\s*g/i, /\bsugars?\s+(\d+\.?\d*)\s*g/i])
  const addedSugarsG = extractNum(tl, [/added\s*sugars?\s+(\d+\.?\d*)\s*g/i])
  const proteinG   = extractNum(tl, [/protein\s+(\d+\.?\d*)\s*g/i])
  const vitaminDMcg = extractNum(tl, [/vitamin\s*d\s+(\d+\.?\d*)\s*mcg/i])
  const calciumMg  = extractNum(tl, [/calcium\s+(\d+)\s*mg/i])
  const ironMg     = extractNum(tl, [/\biron\s+(\d+\.?\d*)\s*mg/i])
  const potassiumMg = extractNum(tl, [/potassium\s+(\d+)\s*mg/i])

  const servingMatch = ocrText.match(/serving\s*size[:\s]+([^\n]{1,30})/i)
  const servingSize = servingMatch?.[1]?.trim()
  const servingsMatch = ocrText.match(/servings?\s*per\s*container[:\s]+(\d+\.?\d*)/i)
  const servingsPerContainer = servingsMatch ? parseFloat(servingsMatch[1]) : undefined

  // Confidence: fraction of key fields that were parsed as non-zero
  const keyFields = [calories, fatG, carbsG, proteinG, sodiumMg]
  const confidence = keyFields.filter(v => v > 0).length / keyFields.length

  // Simple score estimate
  let score = 60
  if (calories > 500) score -= 10
  if (saturatedFatG > 5) score -= 10
  if (sugarsG > 15) score -= 10
  if (sodiumMg > 600) score -= 10
  if (fiberG >= 3) score += 10
  if (proteinG >= 10) score += 10
  if (fatG < 3 && calories < 200) score += 10
  const estimatedScore = Math.max(0, Math.min(100, score))

  return {
    servingSize, servingsPerContainer,
    calories, fatG, saturatedFatG, transFatG, cholesterolMg, sodiumMg,
    carbsG, fiberG, sugarsG, addedSugarsG, proteinG,
    vitaminDMcg, calciumMg, ironMg, potassiumMg,
    confidence, rawText: ocrText, estimatedScore,
  }
}

// ── Component ──────────────────────────────────────────────────────────────

interface NutritionLabelOCRProps {
  onResult?: (parsed: ParsedNutritionLabel) => void
}

type OCRState = 'idle' | 'loading' | 'done' | 'error'

const EDITABLE_FIELDS: { key: keyof ParsedNutritionLabel; label: string; unit: string }[] = [
  { key: 'calories',     label: 'Calories',       unit: 'kcal' },
  { key: 'fatG',         label: 'Total Fat',      unit: 'g'    },
  { key: 'saturatedFatG',label: 'Saturated Fat',  unit: 'g'    },
  { key: 'sodiumMg',     label: 'Sodium',         unit: 'mg'   },
  { key: 'carbsG',       label: 'Total Carbs',    unit: 'g'    },
  { key: 'fiberG',       label: 'Dietary Fiber',  unit: 'g'    },
  { key: 'sugarsG',      label: 'Total Sugars',   unit: 'g'    },
  { key: 'proteinG',     label: 'Protein',        unit: 'g'    },
]

export function NutritionLabelOCR({ onResult }: NutritionLabelOCRProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [state, setState] = useState<OCRState>('idle')
  const [parsed, setParsed] = useState<ParsedNutritionLabel | null>(null)
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, number>>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const runOCR = useCallback(async (imageData: string) => {
    setState('loading')
    setErrorMsg(null)
    setProgress(0)

    try {
      // Dynamic import — only loaded when needed (client-side, ~2 MB)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Tesseract = await import('tesseract.js').catch(() => null) as any

      if (!Tesseract) {
        setErrorMsg('OCR engine not available. Run `npm install tesseract.js` in the web/ directory.')
        setState('error')
        return
      }

      const { data } = await Tesseract.recognize(imageData, 'eng', {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100))
        },
      })

      const result = parseNutritionLabel(data.text)
      setParsed(result)
      setEditValues(Object.fromEntries(
        EDITABLE_FIELDS.map(f => [f.key, result[f.key] as number])
      ))
      setState('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'OCR failed. Try a clearer photo with good lighting.')
      setState('error')
    }
  }, [])

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => {
      const src = e.target?.result as string
      setPreview(src)
      setParsed(null)
      setEditing(false)
      runOCR(src)
    }
    reader.readAsDataURL(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function applyEdits() {
    if (!parsed) return
    const updated: ParsedNutritionLabel = {
      ...parsed,
      ...Object.fromEntries(
        Object.entries(editValues).map(([k, v]) => [k, Number(v)])
      ),
    }
    // Recompute score with edited values
    let score = 60
    if (updated.calories > 500) score -= 10
    if (updated.saturatedFatG > 5) score -= 10
    if (updated.sugarsG > 15) score -= 10
    if (updated.sodiumMg > 600) score -= 10
    if (updated.fiberG >= 3) score += 10
    if (updated.proteinG >= 10) score += 10
    updated.estimatedScore = Math.max(0, Math.min(100, score))
    setParsed(updated)
    setEditing(false)
    onResult?.(updated)
  }

  function confidenceColor(c: number) {
    if (c >= 0.8) return 'text-green-600 dark:text-green-400'
    if (c >= 0.5) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="space-y-4">
      {/* Upload / capture area */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Label preview" className="max-h-48 mx-auto rounded-xl object-contain" />
        ) : (
          <>
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <Camera className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">Photo the nutrition label</p>
            <p className="text-xs text-muted-foreground">Tap to take a photo or drag & drop an image</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>

      {/* Upload button for existing photos */}
      {!preview && (
        <button
          onClick={() => {
            if (fileRef.current) {
              fileRef.current.removeAttribute('capture')
              fileRef.current.click()
            }
          }}
          className="w-full flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload from gallery
        </button>
      )}

      {/* Progress */}
      {state === 'loading' && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Reading nutrition label…</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {state === 'error' && errorMsg && (
        <div className="flex gap-3 items-start p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 dark:text-red-300 text-sm">{errorMsg}</p>
            <button
              onClick={() => { setPreview(null); setState('idle'); setErrorMsg(null) }}
              className="text-primary text-sm mt-1 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {state === 'done' && parsed && (
        <div className="border border-border rounded-2xl overflow-hidden bg-surface">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">Label scanned</span>
              <span className={`text-xs font-medium ${confidenceColor(parsed.confidence)}`}>
                {Math.round(parsed.confidence * 100)}% confidence
              </span>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {/* Serving info */}
          {parsed.servingSize && (
            <div className="px-4 pt-3 text-xs text-muted-foreground">
              Serving size: <span className="font-medium text-foreground">{parsed.servingSize}</span>
              {parsed.servingsPerContainer && (
                <span className="ml-3">Servings: <span className="font-medium text-foreground">{parsed.servingsPerContainer}</span></span>
              )}
            </div>
          )}

          {/* Editable fields */}
          {editing ? (
            <div className="px-4 py-3 space-y-2">
              {EDITABLE_FIELDS.map(({ key, label, unit }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-sm text-muted-foreground w-32 flex-shrink-0">{label}</label>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="number"
                      min={0}
                      value={editValues[key] ?? 0}
                      onChange={e => setEditValues(v => ({ ...v, [key]: parseFloat(e.target.value) || 0 }))}
                      className="w-20 border border-border rounded-lg px-2 py-1 text-sm text-right bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground">{unit}</span>
                  </div>
                </div>
              ))}
              <button
                onClick={applyEdits}
                className="w-full mt-3 bg-primary text-white py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Apply corrections
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-4">
              {EDITABLE_FIELDS.map(({ key, label, unit }) => (
                <div key={key} className="flex justify-between text-sm py-1 border-b border-border/50">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{parsed[key] as number} {unit}</span>
                </div>
              ))}
            </div>
          )}

          {/* Score & use button */}
          {!editing && (
            <div className="flex items-center gap-3 px-4 py-3 border-t border-border bg-muted/30">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">QuarkScore estimate</p>
                <p className="text-xl font-bold">{parsed.estimatedScore}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
              </div>
              <button
                onClick={() => onResult?.(parsed)}
                className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Use this →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tip */}
      {state === 'idle' && (
        <p className="text-xs text-muted-foreground text-center">
          💡 Tip: lay the package flat in good lighting for best results. OCR works on US, Canadian, and EU labels.
        </p>
      )}
    </div>
  )
}
