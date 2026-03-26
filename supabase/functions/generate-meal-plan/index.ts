import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { userId, dietType, allergies, targetCalories, targetProtein } = await req.json()

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

    const prompt = `Generate a 7-day meal plan for someone with these preferences:
- Diet type: ${dietType || 'omnivore'}
- Allergies/Avoid: ${allergies || 'none'}
- Daily calorie target: ${targetCalories || 2000} kcal
- Daily protein target: ${targetProtein || 150}g

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "days": [
    {
      "day": 1,
      "meals": [
        { "type": "breakfast", "name": "Meal Name", "description": "Brief description", "calories": 400, "protein_g": 25, "carbs_g": 45, "fat_g": 15 },
        { "type": "lunch", "name": "...", "description": "...", "calories": 600, "protein_g": 35, "carbs_g": 60, "fat_g": 20 },
        { "type": "dinner", "name": "...", "description": "...", "calories": 700, "protein_g": 45, "carbs_g": 65, "fat_g": 25 },
        { "type": "snack", "name": "...", "description": "...", "calories": 200, "protein_g": 10, "carbs_g": 25, "fat_g": 8 }
      ]
    }
  ]
}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const planData = JSON.parse(text)

    // Save to database
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    
    const { data: plan, error: planError } = await supabase
      .from('meal_plans')
      .insert({ user_id: userId, diet_type: dietType || 'omnivore', title: `${dietType || 'Balanced'} 7-Day Plan` })
      .select()
      .single()

    if (planError) throw planError

    const items = planData.days.flatMap((day: { day: number; meals: Array<{ type: string; name: string; description: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }> }) =>
      day.meals.map((meal) => ({
        plan_id: plan.id,
        day_number: day.day,
        meal_type: meal.type,
        name: meal.name,
        description: meal.description,
        calories: meal.calories,
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fat_g: meal.fat_g,
      }))
    )

    await supabase.from('meal_plan_items').insert(items)

    return new Response(JSON.stringify({ planId: plan.id, plan: planData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
