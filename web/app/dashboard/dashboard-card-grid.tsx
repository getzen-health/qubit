'use client'

import { useState, useEffect } from 'react'
import { SleepSummaryCard } from '@/components/sleep-summary-card'
import { WorkoutSummaryCard } from '@/components/workout-summary-card'
import { MoodSummaryCard } from '@/components/mood-summary-card'
import { MacroRingsCard } from '@/components/macro-rings-card'
import NutritionSummaryCard from '@/components/nutrition-summary-card'

interface Props {
  workoutCount: number
  workoutMinutes: number
  sleepHours: number
  sleepQuality?: number
  todayMood?: number
}

const DEFAULT_CARD_ORDER = [
  'health-score', 'steps', 'sleep', 'water', 'workout', 'mood', 'macro-progress', 'nutrition',
]

export function DashboardCardGrid({ workoutCount, workoutMinutes, sleepHours, sleepQuality, todayMood }: Props) {
  const [preferences, setPreferences] = useState<{
    dashboard_card_order: string[]
    dashboard_hidden_cards: string[]
  } | null>(null)

  useEffect(() => {
    fetch('/api/preferences')
      .then(r => r.json())
      .then(setPreferences)
      .catch(() => setPreferences(null))
  }, [])

  const cardOrder = preferences?.dashboard_card_order ?? DEFAULT_CARD_ORDER
  const hiddenCards = preferences?.dashboard_hidden_cards ?? []

  const CARD_COMPONENTS: Record<string, React.ReactNode> = {
    'health-score': <div key="health-score" />,
    'steps': <div key="steps" />,
    'sleep': <SleepSummaryCard key="sleep" hours={sleepHours} quality={sleepQuality} />,
    'water': <div key="water" />,
    'workout': <WorkoutSummaryCard key="workout" count={workoutCount} totalMinutes={workoutMinutes} />,
    'mood': <MoodSummaryCard key="mood" todayScore={todayMood} />,
    'nutrition': <NutritionSummaryCard key="nutrition" />,
    'macro-progress': <MacroRingsCard key="macro-progress" />,
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      {cardOrder.map((key: string) => {
        if (hiddenCards.includes(key)) return null
        return CARD_COMPONENTS[key] ?? null
      })}
    </div>
  )
}
