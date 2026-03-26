import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat') ?? '40.7128'
  const lon = searchParams.get('lon') ?? '-74.0060'

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=uv_index_max&timezone=auto&forecast_days=1`,
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()
    const uvi = data?.daily?.uv_index_max?.[0] ?? null
    return NextResponse.json({ uvi })
  } catch {
    return NextResponse.json({ uvi: null })
  }
}
