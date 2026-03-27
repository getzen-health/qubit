'use client'

import { useState, useEffect } from 'react'
import { SleepSummaryCard } from '@/components/sleep-summary-card'
import { WorkoutSummaryCard } from '@/components/workout-summary-card'
import { MoodSummaryCard } from '@/components/mood-summary-card'
import { MacroRingsCard } from '@/components/macro-rings-card'

interface Props {
  workoutCount: number
  workoutMinutes: number
  sleepHours: number
  sleepQuality?: number
  todayMood?: number
}

const DEFAULT_CARD_ORDER = ['sleep', 'workout', 'mood', 'macro-progress']

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

  // Only client-renderable cards live here.
  // Async server components (e.g. NutritionSummaryCard) are rendered in the parent server component.
  const CARD_COMPONENTS: Record<string, React.ReactNode> = {
    'sleep': <SleepSummaryCard key="sleep" hours={sleepHours} quality={sleepQuality} />,
    'workout': <WorkoutSummaryCard key="workout" count={workoutCount} totalMinutes={workoutMinutes} />,
    'mood': <MoodSummaryCard key="mood" todayScore={todayMood} />,
    'macro-progress': <MacroRingsCard key="macro-progress" />,
  }

  const visibleCards = cardOrder
    .filter(key => !hiddenCards.includes(key) && key in CARD_COMPONENTS)
    .map(key => CARD_COMPONENTS[key])

  if (visibleCards.length === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
      {visibleCards}
    </div>
  )
}
