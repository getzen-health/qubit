import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { CompareClient } from './compare-client'

interface Props {
  searchParams: Promise<{ a?: string; b?: string }>
}

export default async function ComparePage({ searchParams }: Props) {
  const { a, b } = await searchParams
  if (!a || !b) redirect('/food/scanner')

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-text-primary">Compare Products</h1>
          <p className="text-xs text-text-secondary">Side-by-side nutrition comparison</p>
        </div>
      </header>

      <CompareClient barcodeA={a} barcodeB={b} />

      <BottomNav />
    </div>
  )
}
