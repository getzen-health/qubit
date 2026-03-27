import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { z } from 'zod'
import { scoreCosmeticsProduct } from '@/lib/cosmetics-scoring'

const querySchema = z.object({
  barcode: z.string().min(8).max(14),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateLimitOk = await checkRateLimit(user.id, 'cosmeticsScan')
    if (!rateLimitOk) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const params = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
    const { barcode } = params

    const response = await fetch(
      `https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'KQuarks/1.0' }, next: { revalidate: 86400 } }
    )

    if (!response.ok) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    const data = await response.json()
    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = data.product
    // Fetch user profile for personalisation
    const { data: userProfile, error: profileErr } = await supabase.from('user_profiles').select('health_conditions, dietary_preferences').eq('user_id', user.id).single()

    const { score, grade, concerns, highlights } = scoreCosmeticsProduct(product, userProfile ?? undefined)

    // Save to cosmetics_scan_history (fire-and-forget)
    supabase.from('cosmetics_scan_history').upsert({
      user_id: user.id,
      barcode,
      product_name: product.product_name ?? 'Unknown',
      brand: product.brands ?? null,
      score,
      grade,
      image_url: product.image_url ?? null,
    }, { onConflict: 'user_id,barcode' }).then(() => {}).catch(() => {})

    return NextResponse.json({
      product: {
        name: product.product_name ?? 'Unknown Product',
        brand: product.brands,
        barcode: product.code ?? barcode,
        imageUrl: product.image_url,
        ingredients: product.ingredients_text,
        categories: product.categories_tags?.slice(0, 5) ?? [],
        labels: product.labels_tags ?? [],
      },
      score,
      grade,
      concerns,
      highlights,
    }, { headers: { 'Cache-Control': 'public, max-age=86400' } })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
