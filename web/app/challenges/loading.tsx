import { SkeletonCard } from '@/components/ui/skeleton-card'
export default function ChallengesLoading() {
  return (
    <div className="container mx-auto py-8 space-y-4">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  )
}
