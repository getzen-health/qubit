import { SkeletonCard } from '@/components/ui/skeleton-card'
export default function CoachLoading() {
  return (
    <div className="container mx-auto py-8 max-w-3xl space-y-4">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <SkeletonCard lines={4} />
      <SkeletonCard lines={3} />
    </div>
  )
}
