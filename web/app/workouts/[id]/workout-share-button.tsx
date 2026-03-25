'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { ShareCard } from '@/components/ShareCard'

interface WorkoutShareButtonProps {
  date: string
  calories?: number
  avgHeartRate?: number
}

export function WorkoutShareButton({ date, calories, avgHeartRate }: WorkoutShareButtonProps) {
  const [showShareCard, setShowShareCard] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setShowShareCard(true)}
        className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
        aria-label="Share workout"
        title="Share workout"
      >
        <Share2 className="w-5 h-5 text-text-secondary" />
      </button>

      {showShareCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowShareCard(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <ShareCard
              metrics={{
                steps: 0,
                calories: calories && calories > 0 ? calories : undefined,
                restingHR: avgHeartRate && avgHeartRate > 0 ? avgHeartRate : undefined,
                date,
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
