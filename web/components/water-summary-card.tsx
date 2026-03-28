import { ProgressSummaryCard } from '@/components/ui/progress-summary-card'

interface WaterSummaryProps { totalMl: number; goalMl?: number }
export function WaterSummaryCard({ totalMl, goalMl = 2000 }: WaterSummaryProps) {
  return (
    <ProgressSummaryCard
      href="/water"
      emoji="💧"
      title="Water"
      value={String(totalMl)}
      valueLabel="ml"
      percentage={(totalMl / goalMl) * 100}
      footer={`Goal: ${goalMl}ml`}
      barColor="bg-blue-500"
    />
  )
}
