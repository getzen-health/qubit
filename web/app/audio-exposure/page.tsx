import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { AudioExposureClient } from './audio-exposure-client'

export const metadata = { title: 'Audio Exposure' }

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiskLevel = 'Safe' | 'Moderate' | 'High' | 'Very High'

export interface AudioDay {
  date: string        // 'YYYY-MM-DD'
  envAvg: number      // dB
  envPeak: number     // dB
  hpAvg: number       // headphone dB
  risk: RiskLevel
}

export interface AudioSummary {
  avgEnvNoise: number
  peakEnvNoise: number
  avgHeadphone: number
  peakHeadphone: number
  daysAbove85: number
  overallRisk: RiskLevel
}

export interface AudioExposureData {
  days: AudioDay[]
  summary: AudioSummary
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function generateMockData(): AudioExposureData {
  const today = new Date('2026-03-19')
  const days: AudioDay[] = []

  // Seed values — realistic daily noise patterns over 30 days
  const baseEnvValues = [
    65, 71, 68, 74, 69, 63, 67, 72, 70, 66,
    78, 75, 68, 64, 82, 73, 69, 91, 76, 65,
    70, 68, 73, 67, 85, 74, 71, 66, 69, 72,
  ]
  const baseHpValues = [
    68, 74, 70, 77, 72, 65, 69, 75, 73, 67,
    79, 76, 69, 63, 81, 74, 70, 73, 77, 66,
    71, 69, 75, 68, 78, 75, 72, 67, 70, 73,
  ]

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)

    const idx = 29 - i
    const envAvg = baseEnvValues[idx]
    const envPeak = envAvg + Math.round(8 + Math.random() * 10)
    const hpAvg = baseHpValues[idx]

    let risk: RiskLevel
    if (envAvg < 70 && hpAvg < 70) risk = 'Safe'
    else if (envAvg < 80 && hpAvg < 75) risk = 'Moderate'
    else if (envAvg < 90) risk = 'High'
    else risk = 'Very High'

    days.push({ date: dateStr, envAvg, envPeak, hpAvg, risk })
  }

  const envAvgs = days.map((d) => d.envAvg)
  const hpAvgs = days.map((d) => d.hpAvg)
  const envPeaks = days.map((d) => d.envPeak)
  const hpAll = days.map((d) => d.hpAvg)

  const avgEnvNoise = Math.round(envAvgs.reduce((s, v) => s + v, 0) / envAvgs.length)
  const peakEnvNoise = Math.max(...envPeaks)
  const avgHeadphone = Math.round(hpAvgs.reduce((s, v) => s + v, 0) / hpAvgs.length)
  const peakHeadphone = Math.max(...hpAll)
  const daysAbove85 = days.filter((d) => d.envAvg >= 85 || d.hpAvg >= 85).length

  let overallRisk: RiskLevel
  if (avgEnvNoise < 70 && avgHeadphone < 70) overallRisk = 'Safe'
  else if (avgEnvNoise < 80 && avgHeadphone < 75) overallRisk = 'Moderate'
  else if (avgEnvNoise < 90) overallRisk = 'High'
  else overallRisk = 'Very High'

  return {
    days,
    summary: {
      avgEnvNoise,
      peakEnvNoise,
      avgHeadphone,
      peakHeadphone,
      daysAbove85,
      overallRisk,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AudioExposurePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = generateMockData()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">👂 Audio Exposure</h1>
            <p className="text-sm text-text-secondary">Environmental noise & headphone levels · last 30 days</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <AudioExposureClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
