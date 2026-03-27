import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

function getMonday(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date.toISOString().slice(0, 10)
}

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const weekStart = request.nextUrl.searchParams.get('week') ?? getMonday(new Date())

    const [{ data: plans }, { data: recipes }] = await Promise.all([
      supabase.from('meal_plans').select('*, recipe:meal_recipes(*)').eq('user_id', user!.id).eq('week_start', weekStart),
      supabase.from('meal_recipes').select('*').eq('is_public', true).order('name'),
    ])

    return secureJsonResponse({ plans: plans ?? [], recipes: recipes ?? [], week_start: weekStart })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const weekStart = body.week_start ?? getMonday(new Date())
    const { data, error } = await supabase
      .from('meal_plans')
      .upsert(
        { ...body, user_id: user!.id, week_start: weekStart },
        { onConflict: 'user_id,week_start,day_of_week,meal_slot' }
      )
      .select('*, recipe:meal_recipes(*)')
      .single()
    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ plan: data })
  }
)

export const DELETE = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const { id } = await request.json()
    const { error: deleteErr } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)
    if (deleteErr) return secureErrorResponse(deleteErr.message, 500)
    return secureJsonResponse({ success: true })
  }
)
