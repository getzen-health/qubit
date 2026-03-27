import { createClient } from '@/lib/supabase/server'
import { Progress } from '@/components/ui/progress'

function getMacroPct(val: number, total: number) {
  return total ? Math.round((val/total)*100) : 0
}

export default async function NutritionSummaryCard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date()
  today.setHours(0,0,0,0)
  const iso = today.toISOString()
  const [{ data, error }, { data: profile }] = await Promise.all([
    supabase
      .from('food_diary_entries')
      .select('calories,protein_g,carbs_g,fat_g')
      .eq('user_id', user.id)
      .gte('logged_at', iso),
    supabase
      .from('users')
      .select('calorie_goal')
      .eq('id', user.id)
      .maybeSingle(),
  ])
  if (error) return null
  let totals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  for (const entry of data) {
    totals.calories += entry.calories || 0
    totals.protein_g += Number(entry.protein_g) || 0
    totals.carbs_g += Number(entry.carbs_g) || 0
    totals.fat_g += Number(entry.fat_g) || 0
  }
  const calorieBudget = profile?.calorie_goal ?? 2000
  const pct = Math.min(100, Math.round((totals.calories / calorieBudget) * 100))
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">🍽️ Nutrition</span>
        <span className="text-xs text-muted-foreground">{pct}%</span>
      </div>
      <p className="text-2xl font-bold">{totals.calories} <span className="text-sm text-muted-foreground font-normal">kcal</span></p>
      <Progress value={pct} className="h-2 bg-muted mb-2" />
      <div className="flex gap-2 mt-2">
        <div className="flex-1">
          <div className="text-xs text-blue-500 font-bold">Protein</div>
          <Progress value={getMacroPct(totals.protein_g, totals.protein_g+totals.carbs_g+totals.fat_g)} className="h-1.5 bg-muted" style={{ backgroundColor: '#3b82f6' }} />
          <div className="text-xs">{totals.protein_g}g</div>
        </div>
        <div className="flex-1">
          <div className="text-xs text-yellow-500 font-bold">Carbs</div>
          <Progress value={getMacroPct(totals.carbs_g, totals.protein_g+totals.carbs_g+totals.fat_g)} className="h-1.5 bg-muted" style={{ backgroundColor: '#f59e0b' }} />
          <div className="text-xs">{totals.carbs_g}g</div>
        </div>
        <div className="flex-1">
          <div className="text-xs text-red-500 font-bold">Fat</div>
          <Progress value={getMacroPct(totals.fat_g, totals.protein_g+totals.carbs_g+totals.fat_g)} className="h-1.5 bg-muted" style={{ backgroundColor: '#ef4444' }} />
          <div className="text-xs">{totals.fat_g}g</div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-2">Goal: {calorieBudget} kcal</div>
    </div>
  )
}
