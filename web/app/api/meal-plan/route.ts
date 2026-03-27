import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data: plan } = await supabase
      .from('meal_plans')
      .select('*, meal_plan_items(*)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return secureJsonResponse({ data: plan ?? null })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const { dietType, allergies } = await request.json()

    // Get user's macro targets
    const { data: goals } = await supabase
      .from('user_goals')
      .select('target_calories, target_protein_g')
      .eq('user_id', user!.id)
      .single()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-meal-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
      body: JSON.stringify({
        userId: user!.id,
        dietType,
        allergies,
        targetCalories: goals?.target_calories ?? 2000,
        targetProtein: goals?.target_protein_g ?? 150,
      }),
    })

    const data = await response.json()
    if (!response.ok) return secureErrorResponse(data.error, response.status)
    return secureJsonResponse(data)
  }
)
