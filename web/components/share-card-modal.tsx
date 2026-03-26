'use client'
import { useState } from 'react'
import { generateShareCard, downloadCard, shareCard, ShareCardData } from '@/lib/share-card'

interface ShareCardModalProps {
  data: ShareCardData
  onClose: () => void
}

export function ShareCardModal({ data, onClose }: ShareCardModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [shared, setShared] = useState(false)

  const generate = async () => {
    setIsGenerating(true)
    const blob = await generateShareCard(data)
    setPreviewUrl(URL.createObjectURL(blob))
    setIsGenerating(false)
    return blob
  }

  const handleDownload = async () => {
    const blob = await generateShareCard(data)
    downloadCard(blob)
    setShared(true)
  }

  const handleShare = async () => {
    const blob = await generateShareCard(data)
    const ok = await shareCard(blob, data.title, data.subtitle ?? 'Tracked with KQuarks')
    if (!ok) downloadCard(blob)
    setShared(true)
  }

  // Auto-generate preview on mount
  useState(() => { generate() })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Preview */}
        <div className="aspect-square bg-surface flex items-center justify-center">
          {isGenerating ? (
            <div className="text-center">
              <div className="text-4xl mb-2">🎨</div>
              <p className="text-text-secondary text-sm">Generating card...</p>
            </div>
          ) : previewUrl ? (
            <img src={previewUrl} alt="Share card preview" className="w-full h-full object-cover" />
          ) : null}
        </div>

        {/* Actions */}
        <div className="p-4">
          {shared ? (
            <div className="text-center py-2">
              <p className="text-green-600 font-semibold">✅ Shared!</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={handleShare} className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold">
                📤 Share
              </button>
              <button onClick={handleDownload} className="flex-1 border border-border py-3 rounded-xl font-medium text-text-secondary">
                ⬇️ Save
              </button>
            </div>
          )}
          <button onClick={onClose} className="w-full text-center text-text-secondary text-sm mt-3">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
