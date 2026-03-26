import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rateLimitResult = await checkRateLimit(user.id, 'healthData')
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    const body = await request.json()
    const { name, brand, category, dosage_amount, dosage_unit, frequency, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('supplements')
      .insert({
        user_id: user.id,
        name,
        brand: brand || null,
        category: category || null,
        dosage_amount: dosage_amount || null,
        dosage_unit: dosage_unit || 'mg',
        frequency: frequency || 'daily',
        notes: notes || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating supplement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
