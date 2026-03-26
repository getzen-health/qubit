import { SkeletonCard } from '@/components/ui/skeleton-card'
export default function UpgradeLoading() {
  return (
    <div className="container mx-auto py-12 max-w-4xl space-y-8">
      <div className="h-10 w-64 bg-muted rounded animate-pulse mx-auto" />
      <div className="grid gap-6 md:grid-cols-3">
        <SkeletonCard lines={6} />
        <SkeletonCard lines={6} />
        <SkeletonCard lines={6} />
      </div>
    </div>
  )
}
