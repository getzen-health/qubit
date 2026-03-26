/**
 * push-reminders Edge Function
 *
 * Sends push notifications to users for hydration and medication reminders.
 *
 * @param {Request} req - HTTP request
 * @returns {Response} JSON response
 *
 * Environment variables required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function sendPush(subscription: { endpoint: string; keys: { auth: string; p256dh: string } }, payload: { title: string; body: string; url?: string }) {
  // Web Push via Supabase Edge (basic implementation)
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TTL': '86400',
    },
    body: JSON.stringify({ notification: payload }),
  })
  return response.ok
}

Deno.serve(async (req) => {
  const { type } = await req.json().catch(() => ({ type: 'water' }))
  const now = new Date()
  const hour = now.getUTCHours()

  try {
    if (type === 'water' || hour === 11) {
      // Get users with <500ml water today
      const today = now.toISOString().split('T')[0]
      const { data: lowWaterUsers } = await supabase
        .from('water_logs')
        .select('user_id, amount_ml')
        .gte('logged_at', `${today}T00:00:00Z`)
      
      const userTotals: Record<string, number> = {}
      for (const log of lowWaterUsers || []) {
        userTotals[log.user_id] = (userTotals[log.user_id] || 0) + log.amount_ml
      }

      // Get push subscriptions for users below goal
      const lowUsers = Object.entries(userTotals).filter(([, ml]) => ml < 500).map(([id]) => id)
      if (lowUsers.length > 0) {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('user_id', lowUsers)
        for (const sub of subs || []) {
          await sendPush(sub.subscription, {
            title: '💧 Stay hydrated!',
            body: `You've logged less than 500ml today. Time to drink up!`,
            url: '/water',
          })
        }
      }
    }

    if (type === 'medication' || hour === 8 || hour === 20) {
      const { data: meds } = await supabase
        .from('medications')
        .select('user_id, name, frequency')
        .eq('active', true)
      
      const medUsers = [...new Set((meds || []).map(m => m.user_id))]
      if (medUsers.length > 0) {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('user_id', medUsers)
        for (const sub of subs || []) {
          await sendPush(sub.subscription, {
            title: '💊 Medication reminder',
            body: 'Time to take your medications.',
            url: '/medications',
          })
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
