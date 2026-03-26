import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const results: Record<string, number> = {}

  const { count: rateLimitCount } = await supabase
    .from('rate_limit_events')
    .delete({ count: 'exact' })
    .lt('created_at', new Date(Date.now() - 86400000).toISOString())
  results.rate_limit_events = rateLimitCount ?? 0

  const { count: metricsCount } = await supabase
    .from('api_metrics')
    .delete({ count: 'exact' })
    .lt('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
  results.api_metrics = metricsCount ?? 0

  const { count: crashCount } = await supabase
    .from('crash_reports')
    .delete({ count: 'exact' })
    .lt('created_at', new Date(Date.now() - 90 * 86400000).toISOString())
  results.crash_reports = crashCount ?? 0

  console.log('DB cleanup results:', results)
  return new Response(JSON.stringify({ cleaned: results, timestamp: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
