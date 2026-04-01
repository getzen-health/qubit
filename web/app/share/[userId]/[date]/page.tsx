import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Activity, Moon, Heart, Flame, Wind, Download, ExternalLink } from 'lucide-react'

interface Props {
  params: Promise<{ userId: string; date: string }>
}

type DailySummary = {
  steps: number | null
  active_calories: number | null
  sleep_duration_minutes: number | null
  avg_hrv: number | null
  recovery_score: number | null
  date: string
}

async function fetchSummary(userId: string, date: string): Promise<DailySummary | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const { data } = await supabase
    .from('daily_summaries')
    .select('steps, active_calories, sleep_duration_minutes, avg_hrv, recovery_score, date')
    .eq('user_id', userId)
    .eq('date', date)
    .single()

  return data ?? null
}

function fmtSteps(n: number | null): string {
  if (n == null || n === 0) return '—'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function fmtSleep(mins: number | null): string {
  if (mins == null || mins === 0) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId, date } = await params
  const ogImageUrl = `/api/share-card?userId=${encodeURIComponent(userId)}&date=${encodeURIComponent(date)}`
  const title = `Health Summary — ${date} | GetZen`
  const description = 'Daily health metrics powered by GetZen'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: 'GetZen Health Summary Card' }],
      siteName: 'GetZen',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function SharePage({ params }: Props) {
  const { userId, date } = await params
  const summary = await fetchSummary(userId, date)
  const ogImageUrl = `/api/share-card?userId=${encodeURIComponent(userId)}&date=${encodeURIComponent(date)}`

  const metrics = [
    {
      icon: <Activity className="w-5 h-5 text-green-400" />,
      label: 'Steps',
      value: fmtSteps(summary?.steps ?? null),
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    },
    {
      icon: <Flame className="w-5 h-5 text-orange-400" />,
      label: 'Active Cal',
      value: summary?.active_calories != null ? Math.round(summary.active_calories).toLocaleString() : '—',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
    },
    {
      icon: <Moon className="w-5 h-5 text-blue-400" />,
      label: 'Sleep',
      value: fmtSleep(summary?.sleep_duration_minutes ?? null),
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      icon: <Heart className="w-5 h-5 text-purple-400" />,
      label: 'HRV',
      value: summary?.avg_hrv != null ? `${Math.round(summary.avg_hrv)} ms` : '—',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      icon: <Wind className="w-5 h-5 text-emerald-400" />,
      label: 'Recovery',
      value: summary?.recovery_score != null ? String(summary.recovery_score) : '—',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
      {/* Branding */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-lg">
          ⚡
        </div>
        <div>
          <p className="text-xs font-bold tracking-widest text-purple-400 uppercase">GetZen</p>
          <p className="text-xs text-white/40">Health Summary</p>
        </div>
      </div>

      {/* Date */}
      <p className="text-white/50 text-sm mb-6">{summary?.date ? fmtDate(summary.date) : fmtDate(date)}</p>

      {/* Card preview */}
      <div className="w-full max-w-2xl rounded-2xl bg-white/5 border border-white/10 p-8 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className={`rounded-xl ${m.bg} border ${m.border} p-4 flex flex-col gap-2`}
            >
              <div className="flex items-center gap-2">
                {m.icon}
                <span className="text-xs text-white/50 font-medium">{m.label}</span>
              </div>
              <p className="text-2xl font-bold text-white leading-none">{m.value}</p>
            </div>
          ))}
        </div>

        {!summary && (
          <p className="text-center text-white/30 text-sm mt-4">No data found for this date.</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <a
          href={ogImageUrl}
          download={`getzen-${date}.png`}
          className="flex items-center justify-center gap-2 flex-1 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Card
        </a>
        <Link
          href="https://kquarks.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 flex-1 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/10 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open App
        </Link>
      </div>

      <p className="mt-8 text-white/20 text-xs">kquarks.vercel.app</p>
    </div>
  )
}
