import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

const DAILY_LIMIT = 10
const FUNCTION_NAME = 'recognize-food'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const { imageBase64, mimeType = 'image/jpeg' } = await req.json()
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 required' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Rate limiting: max DAILY_LIMIT recognitions per day per user
    const today = new Date().toISOString().slice(0, 10)
    const { data: usageData } = await supabase
      .from('ai_usage')
      .select('call_count')
      .eq('user_id', user.id)
      .eq('function_name', FUNCTION_NAME)
      .eq('used_at', today)
      .maybeSingle()

    if ((usageData?.call_count ?? 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ error: `Daily limit of ${DAILY_LIMIT} food recognitions reached. Try again tomorrow.` }),
        { status: 429, headers: corsHeaders },
      )
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageBase64 },
            },
            {
              type: 'text',
              text: 'Identify this food item. Return JSON: { "name": string, "calories_per_100g": number, "protein_per_100g": number, "carbs_per_100g": number, "fat_per_100g": number, "fiber_per_100g": number, "confidence": number (0-1) }',
            },
          ],
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const food = jsonMatch ? JSON.parse(jsonMatch[0]) : null

    // Increment usage counter on success
    if (usageData) {
      await supabase
        .from('ai_usage')
        .update({ call_count: usageData.call_count + 1 })
        .eq('user_id', user.id)
        .eq('function_name', FUNCTION_NAME)
        .eq('used_at', today)
    } else {
      await supabase
        .from('ai_usage')
        .insert({ user_id: user.id, function_name: FUNCTION_NAME, used_at: today, call_count: 1 })
    }

    return new Response(JSON.stringify({ food }), {
      headers: corsHeaders,
    })
  } catch (err) {
    console.error('recognize-food error:', err instanceof Error ? err.message : 'Unknown')
    return new Response(JSON.stringify({ error: 'Recognition failed' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
