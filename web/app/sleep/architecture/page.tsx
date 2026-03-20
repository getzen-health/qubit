import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SleepArchitectureClient } from './sleep-architecture-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Sleep Architecture' }

export interface SleepNight {
  date: string          // "Feb 18" short label
  dateISO: string       // full ISO for sorting / tooltip
  deep: number          // minutes
  rem: number           // minutes
  core: number          // minutes
  total: number         // minutes (deep + rem + core)
  efficiency: number    // 0–100
}

// ─── Deterministic mock data (30 nights) ──────────────────────────────────────
// Natural variation seeded so it looks realistic every render.
function buildMockNights(): SleepNight[] {
  // Base date: 30 nights ago from 2026-03-19
  const nights: SleepNight[] = []

  const deepBases    = [73,80,68,91,55,78,84,60,95,70,63,88,75,50,82,69,77,59,100,66,85,73,58,90,72,61,79,87,65,74]
  const remBases     = [98,85,112,76,120,103,91,128,82,109,117,88,95,125,80,106,99,118,73,110,87,102,121,84,96,115,108,78,113,93]
  const coreBases    = [258,272,245,290,230,263,280,218,295,255,242,285,268,210,278,252,260,237,300,248,271,258,225,288,256,240,274,282,244,261]

  for (let i = 0; i < 30; i++) {
    const d = new Date('2026-03-19')
    d.setDate(d.getDate() - (29 - i))

    const deep = deepBases[i]
    const rem  = remBases[i]
    const core = coreBases[i]
    const total = deep + rem + core
    // efficiency: roughly (total / (total + awake)) * 100
    // awake modelled as 5–13% of total
    const awakeRatio = 0.05 + (i % 7) * 0.01
    const efficiency = Math.round((1 / (1 + awakeRatio)) * 100)

    nights.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dateISO: d.toISOString(),
      deep,
      rem,
      core,
      total,
      efficiency,
    })
  }

  return nights
}

export default async function SleepArchitecturePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nights = buildMockNights()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/sleep"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to sleep"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Sleep Architecture</h1>
            <p className="text-sm text-text-secondary">30 nights · stage breakdown</p>
          </div>
          <span className="text-2xl">🌙</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <SleepArchitectureClient nights={nights} />
      </main>
      <BottomNav />
    </div>
  )
}
