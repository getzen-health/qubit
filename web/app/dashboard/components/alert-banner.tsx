import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export async function AlertBanner() {
  const supabase = await createClient()
  const { data } = await supabase.from('alert_history')
    .select('id, message, severity, triggered_at')
    .eq('acknowledged', false)
    .order('triggered_at', { ascending: false })
    .limit(3)
  const critical = (data ?? []).filter(a => a.severity === 'critical')
  const warning = (data ?? []).filter(a => a.severity === 'warning')
  if (critical.length === 0 && warning.length === 0) return null
  return (
    <Link href="/alerts" className="block mb-4">
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-2">
        <span className="text-red-600 text-xl">⛔</span>
        <span className="font-semibold text-red-700">{critical.length > 0 ? 'Critical alert' : 'Warning alert'}</span>
        <span className="text-sm text-gray-700">{critical.concat(warning).map(a => a.message).join(' | ')}</span>
        <Badge className="ml-auto bg-red-100 text-red-800">{critical.length + warning.length} new</Badge>
      </div>
    </Link>
  )
}
