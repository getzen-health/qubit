import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function getBodyFatCategory(pct: number, sex: string): { label: string; color: string } {
  if (sex === 'male') {
    if (pct < 6) return { label: 'Essential Fat', color: 'text-blue-600' }
    if (pct < 14) return { label: 'Athletic', color: 'text-green-600' }
    if (pct < 18) return { label: 'Fit', color: 'text-lime-600' }
    if (pct < 25) return { label: 'Average', color: 'text-yellow-600' }
    return { label: 'Obese', color: 'text-red-600' }
  }
  if (pct < 14) return { label: 'Essential Fat', color: 'text-blue-600' }
  if (pct < 21) return { label: 'Athletic', color: 'text-green-600' }
  if (pct < 25) return { label: 'Fit', color: 'text-lime-600' }
  if (pct < 32) return { label: 'Average', color: 'text-yellow-600' }
  return { label: 'Obese', color: 'text-red-600' }
}

import MeasurementsForm from './measurements-form'

export default async function MeasurementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: latest } = await supabase.from('body_measurements').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single()
  const bf = latest?.body_fat_pct ? Number(latest.body_fat_pct) : null
  const category = bf && latest?.sex ? getBodyFatCategory(bf, latest.sex) : null

  return (
    <div className="container mx-auto py-8 max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Body Measurements</h1>
      {bf ? (
        <div className="rounded-xl border border-border p-6 text-center space-y-2">
          <p className="text-xs text-muted-foreground">Body Fat Percentage (US Navy Method)</p>
          <p className="text-5xl font-extrabold">{bf}<span className="text-xl">%</span></p>
          <p className={`text-sm font-semibold ${category?.color}`}>{category?.label}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border p-6 text-center text-muted-foreground">
          <p className="text-3xl mb-2">📏</p>
          <p className="font-medium">No measurements recorded</p>
          <p className="text-sm mt-1">Log your neck, waist, and hips to calculate body fat %</p>
        </div>
      )}
      {latest && (
        <div className="rounded-xl border border-border p-4 space-y-2">
          <p className="font-semibold text-sm">Latest Measurements ({latest.date})</p>
          {[['Neck', latest.neck_cm], ['Waist', latest.waist_cm], ['Hips', latest.hips_cm], ['Height', latest.height_cm]].filter(([, v]) => v).map(([label, val]) => (
            <div key={String(label)} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{val} cm</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
