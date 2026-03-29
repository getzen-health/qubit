import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Activity } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
const ECGClient = dynamic(() => import('./ecg-client').then(m => ({ default: m.ECGClient })), { ssr: false })

export const metadata = { title: 'ECG History' }

export type ECGClass =
  | 'sinusRhythm'
  | 'atrialFibrillation'
  | 'inconclusiveHighHR'
  | 'inconclusiveLowHR'
  | 'inconclusive'
  | 'notClassified'

export interface ECGRecord {
  id: string
  date: string // ISO
  classification: ECGClass
  heartRate: number | null
}

export interface MonthBucket {
  month: string // YYYY-MM
  sinusCount: number
  afibCount: number
  inconclusiveCount: number
}

export interface ECGData {
  records: ECGRecord[]
  monthBuckets: MonthBucket[]
  sinusPct: number
  afibPct: number
  inconclusivePct: number
  total: number
}

// ─── Classification helpers ───────────────────────────────────────────────────

function normaliseClassification(raw: string): ECGClass {
  const s = (raw ?? '').toLowerCase().replace(/[\s_-]/g, '')
  if (s === 'sinusrhythm' || s === 'sinus') return 'sinusRhythm'
  if (s === 'atrialfibrillation' || s === 'afib' || s === 'af') return 'atrialFibrillation'
  if (s === 'inconclusivehighheartratedetected' || s === 'inconclusivehr' || s === 'inconclusivehighr') return 'inconclusiveHighHR'
  if (s === 'inconclusivelowheartratedetected' || s === 'inconclusivelowr') return 'inconclusiveLowHR'
  if (s.startsWith('inconclusive')) return 'inconclusive'
  return 'notClassified'
}

function isSinus(c: ECGClass): boolean {
  return c === 'sinusRhythm'
}

function isAfib(c: ECGClass): boolean {
  return c === 'atrialFibrillation'
}

function isInconclusive(c: ECGClass): boolean {
  return c === 'inconclusiveHighHR' || c === 'inconclusiveLowHR' || c === 'inconclusive' || c === 'notClassified'
}

// ─── Month bucket helpers ─────────────────────────────────────────────────────

function toMonthKey(iso: string): string {
  // iso may be a full timestamp or YYYY-MM-DD
  return iso.slice(0, 7)
}

function buildMonthBuckets(records: ECGRecord[]): MonthBucket[] {
  const map = new Map<string, MonthBucket>()

  for (const r of records) {
    const month = toMonthKey(r.date)
    if (!map.has(month)) {
      map.set(month, { month, sinusCount: 0, afibCount: 0, inconclusiveCount: 0 })
    }
    const bucket = map.get(month)!
    if (isSinus(r.classification)) bucket.sinusCount++
    else if (isAfib(r.classification)) bucket.afibCount++
    else bucket.inconclusiveCount++
  }

  // Sort chronologically
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ECGPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const emptyData: ECGData = {
    records: [],
    monthBuckets: [],
    sinusPct: 0,
    afibPct: 0,
    inconclusivePct: 0,
    total: 0,
  }

  // Attempt to fetch from ecg_records table. If the table doesn't exist the
  // Postgres error code will be 42P01 (undefined_table) and we fall back to
  // the empty-state gracefully.
  const { data: rawRows, error } = await supabase
    .from('ecg_records')
    .select('id, recorded_at, classification, heart_rate')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(500)

  let data: ECGData = emptyData

  if (!error && rawRows && rawRows.length > 0) {
    const records: ECGRecord[] = rawRows.map((row) => ({
      id: String(row.id),
      date: String(row.recorded_at ?? ''),
      classification: normaliseClassification(String(row.classification ?? '')),
      heartRate: row.heart_rate != null ? Number(row.heart_rate) : null,
    }))

    const total = records.length
    const sinusCount = records.filter((r) => isSinus(r.classification)).length
    const afibCount = records.filter((r) => isAfib(r.classification)).length
    const inconclusiveCount = records.filter((r) => isInconclusive(r.classification)).length

    data = {
      records,
      monthBuckets: buildMonthBuckets(records),
      sinusPct: total > 0 ? Math.round((sinusCount / total) * 100) : 0,
      afibPct: total > 0 ? Math.round((afibCount / total) * 100) : 0,
      inconclusivePct: total > 0 ? Math.round((inconclusiveCount / total) * 100) : 0,
      total,
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">ECG History</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Apple Watch electrocardiogram classifications</p>
          </div>
          <Activity className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">
        <ECGClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
