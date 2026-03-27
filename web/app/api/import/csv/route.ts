import { NextRequest } from 'next/server'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const POST = createSecureApiHandler(
  { rateLimit: 'import', requireAuth: true },
  async (req: NextRequest, { user, supabase }) => {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const metricType = (formData.get('metric_type') as string) ?? 'steps'
    const dateCol = (formData.get('date_column') as string) ?? 'date'
    const valueCol = (formData.get('value_column') as string) ?? 'value'

    if (!file) return secureErrorResponse('No file provided', 400)

    const text = await file.text()
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) return secureErrorResponse('CSV must have header + data rows', 422)

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''))
    const dateIdx = headers.indexOf(dateCol.toLowerCase())
    const valueIdx = headers.indexOf(valueCol.toLowerCase())

    if (dateIdx === -1 || valueIdx === -1) {
      return secureErrorResponse(`Columns not found. Available: ${headers.join(', ')}`, 422)
    }

    const records = []
    for (let i = 1; i < Math.min(lines.length, 10001); i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/['"]/g, ''))
      const dateStr = cols[dateIdx]
      const value = parseFloat(cols[valueIdx])
      if (!dateStr || isNaN(value)) continue
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) continue
      records.push({
        user_id: user!.id,
        metric_type: metricType,
        value,
        unit: 'csv_import',
        recorded_at: date.toISOString(),
      })
    }

    if (records.length === 0) return secureErrorResponse('No valid records found', 422)

    const CHUNK = 500
    let inserted = 0
    for (let i = 0; i < records.length; i += CHUNK) {
      const { error } = await supabase.from('health_metrics').upsert(records.slice(i, i + CHUNK), {
        onConflict: 'user_id,metric_type,recorded_at',
        ignoreDuplicates: true,
      })
      if (!error) inserted += CHUNK
    }

    return secureJsonResponse({ success: true, total_inserted: inserted })
  }
)
