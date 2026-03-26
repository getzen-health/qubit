import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/security'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const grade = searchParams.get('grade')
  const exportCsv = searchParams.get('export') === 'csv'

  let query = supabase
    .from('scan_history')
    .select('*')
    .eq('user_id', user.id)
    .order('scanned_at', { ascending: false })
    .limit(100)

  if (q) query = query.ilike('product_name', `%${q}%`)
  if (grade === 'green') query = query.gte('health_score', 70)
  else if (grade === 'yellow') query = query.gte('health_score', 40).lt('health_score', 70)
  else if (grade === 'red') query = query.lt('health_score', 40)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (exportCsv) {
    const csv = ['Product,Brand,Score,Date',
      ...(data ?? []).map(r => `"${r.product_name}","${r.brand ?? ''}",${r.health_score},"${r.scanned_at}"`)
    ].join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="scan-history.csv"'
      }
    })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rateLimitResult = await checkRateLimit(user.id, 'foodScan')
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }
  const { barcode, product_name, brand, score, image_url } = await request.json()
  if (!product_name) return NextResponse.json({ error: 'product_name required' }, { status: 400 })
  const { data, error } = await supabase
    .from('scan_history')
    .upsert({ user_id: user.id, barcode, product_name, brand, score, image_url }, { onConflict: 'user_id,barcode' })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
