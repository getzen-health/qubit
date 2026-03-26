// GET /api/food/ingredients?q=aspartame → returns IngredientInfo or null
import { NextRequest, NextResponse } from 'next/server'
import { lookupIngredient } from '@/lib/ingredient-glossary'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (!q || q.length < 2) return NextResponse.json({ result: null })
  const result = lookupIngredient(q.trim())
  return NextResponse.json({ result })
}
