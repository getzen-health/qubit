import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'ECG History' }

interface EcgRecord {
  id: string
  recorded_at: string
  classification: string
  average_hr_bpm: number | null
  symptoms_status: string | null
}

function classificationBadge(c: string): { label: string; classes: string } {
  switch (c) {
    case 'sinusRhythm':
      return { label: 'Sinus Rhythm', classes: 'bg-green-500/15 text-green-400 border border-green-500/30' }
    case 'atrialFibrillation':
      return { label: 'Atrial Fibrillation', classes: 'bg-red-500/15 text-red-400 border border-red-500/30' }
    default:
      return { label: formatClassification(c), classes: 'bg-orange-500/15 text-orange-400 border border-orange-500/30' }
  }
}

function formatClassification(c: string): string {
  switch (c) {
    case 'inconclusiveLowHR':   return 'Inconclusive — Low HR'
    case 'inconclusiveHighHR':  return 'Inconclusive — High HR'
    case 'inconclusiveOther':   return 'Inconclusive'
    case 'unrecognized':        return 'Unrecognized'
    default:                    return c
  }
}

function fmtDatetime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function EcgPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: records } = await supabase
    .from('ecg_records')
    .select('id, recorded_at, classification, average_hr_bpm, symptoms_status')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(20)

  const ecgs: EcgRecord[] = records ?? []

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/hrv"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to HRV"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">ECG History</h1>
            <p className="text-sm text-text-secondary">Apple Watch recordings · Last 20</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-3">
        {ecgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <span className="text-5xl">🫀</span>
            <h2 className="text-lg font-semibold text-text-primary">No ECG recordings found</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              Record an ECG on your Apple Watch to see results here.
            </p>
          </div>
        ) : (
          ecgs.map((ecg) => {
            const badge = classificationBadge(ecg.classification)
            return (
              <div
                key={ecg.id}
                className="bg-surface rounded-xl border border-border p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {fmtDatetime(ecg.recorded_at)}
                  </p>
                  {ecg.average_hr_bpm != null && (
                    <p className="text-xs text-text-secondary mt-0.5">
                      Avg HR: {ecg.average_hr_bpm} bpm
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${badge.classes}`}
                >
                  {badge.label}
                </span>
              </div>
            )
          })
        )}
      </main>

      <BottomNav />
    </div>
  )
}
