import { NextResponse } from 'next/server'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const grade = searchParams.get('grade')
    const exportCsv = searchParams.get('export') === 'csv'

    let query = supabase
      .from('scan_history')
      .select('*')
      .eq('user_id', user!.id)
      .order('scanned_at', { ascending: false })
      .limit(100)

    if (q) query = query.ilike('product_name', `%${q}%`)
    if (grade === 'green') query = query.gte('health_score', 70)
    else if (grade === 'yellow') query = query.gte('health_score', 40).lt('health_score', 70)
    else if (grade === 'red') query = query.lt('health_score', 40)

    const { data, error } = await query
    if (error) return secureErrorResponse('Failed to fetch scan history', 500)

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

    return secureJsonResponse({ data })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'foodScan', requireAuth: true },
  async (request, { user, supabase }) => {
    const { barcode, product_name, brand, score, image_url } = await request.json()
    if (!product_name) return secureErrorResponse('product_name required', 400)
    const { data, error } = await supabase
      .from('scan_history')
      .upsert({ user_id: user!.id, barcode, product_name, brand, score, image_url }, { onConflict: 'user_id,barcode' })
      .select().single()
    if (error) return secureErrorResponse('Failed to save scan', 500)
    return secureJsonResponse({ data }, 201)
  }
)
