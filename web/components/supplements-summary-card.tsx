import { ProgressSummaryCard } from '@/components/ui/progress-summary-card'

interface SupplementsSummaryProps { taken: number; total?: number }
export function SupplementsSummaryCard({ taken, total = 8 }: SupplementsSummaryProps) {
  return (
    <ProgressSummaryCard
      href="/supplements"
      emoji="💊"
      title="Supplements"
      value={String(taken)}
      valueLabel={`/${total} taken`}
      percentage={(taken / total) * 100}
      footer="Today&apos;s supplements"
      barColor="bg-purple-500"
    />
  )
}
