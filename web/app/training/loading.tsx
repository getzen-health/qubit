import { SkeletonCard } from '@/components/ui/skeleton-card'
export default function TrainingLoading() {
  return (
    <div className="container mx-auto py-8 space-y-4">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2"><SkeletonCard lines={4} /><SkeletonCard lines={4} /></div>
    </div>
  )
}
