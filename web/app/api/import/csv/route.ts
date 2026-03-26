import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const metricType = formData.get('metric_type') as string ?? 'steps'
    const dateCol = formData.get('date_column') as string ?? 'date'
    const valueCol = formData.get('value_column') as string ?? 'value'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const text = await file.text()
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) return NextResponse.json({ error: 'CSV must have header + data rows' }, { status: 422 })

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
    const dateIdx = headers.indexOf(dateCol.toLowerCase())
    const valueIdx = headers.indexOf(valueCol.toLowerCase())

    if (dateIdx === -1 || valueIdx === -1) {
      return NextResponse.json({
        error: `Columns not found. Available: ${headers.join(', ')}`,
        available_columns: headers,
      }, { status: 422 })
    }

    const records = []
    for (let i = 1; i < Math.min(lines.length, 10001); i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/['"]/g, ''))
      const dateStr = cols[dateIdx]
      const value = parseFloat(cols[valueIdx])
      if (!dateStr || isNaN(value)) continue
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) continue
      records.push({ user_id: user.id, metric_type: metricType, value, unit: 'csv_import', recorded_at: date.toISOString() })
    }

    if (records.length === 0) return NextResponse.json({ error: 'No valid records found' }, { status: 422 })

    const CHUNK = 500
    let inserted = 0
    for (let i = 0; i < records.length; i += CHUNK) {
      const { error } = await supabase.from('health_metrics').upsert(records.slice(i, i + CHUNK), {
        onConflict: 'user_id,metric_type,recorded_at',
        ignoreDuplicates: true,
      })
      if (!error) inserted += CHUNK
    }

    return NextResponse.json({ success: true, total_inserted: inserted })
  } catch {
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
