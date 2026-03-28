import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

function fmtSteps(n: number | null | undefined): string {
  if (n == null || n === 0) return '—'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function fmtSleep(mins: number | null | undefined): string {
  if (mins == null || mins === 0) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  return Math.round(n).toLocaleString()
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  if (!userId) {
    return new Response('Missing userId', { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return new Response('Server misconfiguration', { status: 500 })
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const { data: summary } = await supabase
    .from('daily_summaries')
    .select('steps, active_calories, sleep_duration_minutes, avg_hrv, recovery_score, date')
    .eq('user_id', userId)
    .eq('date', date)
    .single()

  const metrics = [
    { label: 'Steps', value: fmtSteps(summary?.steps), color: '#22c55e' },
    { label: 'Active Cal', value: fmt(summary?.active_calories), color: '#f97316' },
    { label: 'Sleep', value: fmtSleep(summary?.sleep_duration_minutes), color: '#60a5fa' },
    { label: 'HRV', value: summary?.avg_hrv != null ? `${Math.round(summary.avg_hrv)} ms` : '—', color: '#a78bfa' },
    { label: 'Recovery', value: summary?.recovery_score != null ? String(summary.recovery_score) : '—', color: '#34d399' },
  ]

  const displayDate = summary?.date ? fmtDate(summary.date) : fmtDate(date)

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '52px 64px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Purple glow top-right */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        {/* Green glow bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
          >
            ⚡
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ color: '#a78bfa', fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>
              KQuarks
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Health Summary</div>
          </div>
        </div>

        {/* Metrics grid */}
        <div style={{ display: 'flex', gap: 20, flex: 1, alignItems: 'center', marginTop: 40, marginBottom: 40 }}>
          {metrics.map((m) => (
            <div
              key={m.label}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '28px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: m.color,
                  boxShadow: `0 0 8px ${m.color}`,
                }}
              />
              <div style={{ color: 'white', fontSize: 30, fontWeight: 800, lineHeight: 1, letterSpacing: -1 }}>
                {m.value}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 500 }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14, letterSpacing: 1 }}>
            kquarks.vercel.app
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
            {displayDate}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    }
  )
}
