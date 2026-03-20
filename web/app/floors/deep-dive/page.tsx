import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FloorsDeepDiveClient, type FloorsDeepDiveData, type DailyFloors, type DowAvg } from './floors-deep-dive-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Floors Climbed Deep Dive' }

// ─── Mock data ────────────────────────────────────────────────────────────────

function classifyLevel(floors: number): 'dark' | 'medium' | 'light' {
  if (floors >= 15) return 'dark'
  if (floors >= 10) return 'medium'
  return 'light'
}

function buildMockData(): FloorsDeepDiveData {
  // 30-day daily floors ending today (2026-03-19)
  // Mostly 5–12, occasional 18–20 spikes, today = 8
  const rawValues: Array<{ offset: number; floors: number }> = [
    { offset: 29, floors: 7  },
    { offset: 28, floors: 10 },
    { offset: 27, floors: 5  },
    { offset: 26, floors: 12 },
    { offset: 25, floors: 9  },
    { offset: 24, floors: 18 }, // spike — weekend hike
    { offset: 23, floors: 20 }, // spike
    { offset: 22, floors: 6  },
    { offset: 21, floors: 8  },
    { offset: 20, floors: 11 },
    { offset: 19, floors: 7  },
    { offset: 18, floors: 9  },
    { offset: 17, floors: 10 },
    { offset: 16, floors: 5  },
    { offset: 15, floors: 6  },
    { offset: 14, floors: 13 },
    { offset: 13, floors: 12 },
    { offset: 12, floors: 8  },
    { offset: 11, floors: 7  },
    { offset: 10, floors: 19 }, // spike
    { offset: 9,  floors: 11 },
    { offset: 8,  floors: 5  },
    { offset: 7,  floors: 9  },
    { offset: 6,  floors: 10 },
    { offset: 5,  floors: 6  },
    { offset: 4,  floors: 7  },
    { offset: 3,  floors: 12 },
    { offset: 2,  floors: 10 },
    { offset: 1,  floors: 6  },
    { offset: 0,  floors: 8  }, // today
  ]

  const today = new Date('2026-03-19')

  const daily: DailyFloors[] = rawValues
    .sort((a, b) => b.offset - a.offset) // descending offset → ascending date
    .map(({ offset, floors }) => {
      const d = new Date(today)
      d.setDate(d.getDate() - offset)
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return {
        date: label,
        floors,
        level: classifyLevel(floors),
      }
    })
    .reverse() // oldest → newest (left → right on chart)

  // Day-of-week averages (Mon–Sun)
  const DOW_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dowBuckets: number[][] = Array.from({ length: 7 }, () => [])

  for (const { offset, floors } of rawValues) {
    const d = new Date(today)
    d.setDate(d.getDate() - offset)
    // getDay() returns 0=Sun … 6=Sat; convert to Mon=0 … Sun=6
    const jsDay = d.getDay()
    const monIdx = jsDay === 0 ? 6 : jsDay - 1
    dowBuckets[monIdx].push(floors)
  }

  const dowAvg: DowAvg[] = DOW_NAMES.map((day, i) => {
    const vals = dowBuckets[i]
    const avg = vals.length > 0
      ? +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1)
      : 0
    return { day, avg }
  })

  const allFloors = rawValues.map((v) => v.floors)
  const bestEntry = rawValues.reduce((best, cur) => cur.floors > best.floors ? cur : best)
  const bestDate = new Date(today)
  bestDate.setDate(bestDate.getDate() - bestEntry.offset)
  const bestDayDate = bestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const avg30d = +(allFloors.reduce((s, v) => s + v, 0) / allFloors.length).toFixed(1)
  const goalFloors = 10
  const daysMetGoal = allFloors.filter((f) => f >= goalFloors).length

  // Streak: count consecutive days from today backward where floors >= goal
  let streak = 0
  for (const { offset, floors } of rawValues.sort((a, b) => a.offset - b.offset)) {
    if (offset === streak && floors >= goalFloors) {
      streak++
    } else if (offset === streak) {
      break
    }
  }

  return {
    todayFloors: 8,
    goalFloors,
    avg30d,
    bestDay: bestEntry.floors,
    bestDayDate,
    daysMetGoal,
    currentStreak: streak,
    daily,
    dowAvg,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FloorsDeepDivePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = buildMockData()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/floors"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to floors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Floors Climbed Deep Dive</h1>
            <p className="text-sm text-text-secondary">
              30-day trends · goal tracking · stair science
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <FloorsDeepDiveClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
