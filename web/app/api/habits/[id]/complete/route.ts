import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const CompleteSchema = z.object({
  value_logged: z.number().optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await checkRateLimit(req, 'healthData')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const habit_id = params.id
  const body = await req.json()
  const parsed = CompleteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const today = new Date().toISOString().slice(0, 10)
  const { error } = await supabase
    .from('habit_completions')
    .upsert({
      user_id: user.id,
      habit_id,
      completed_date: today,
      value_logged: parsed.data.value_logged,
      notes: parsed.data.notes,
    }, { onConflict: 'habit_id,completed_date' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await checkRateLimit(req, 'healthData')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const habit_id = params.id
  const today = new Date().toISOString().slice(0, 10)
  const { error } = await supabase
    .from('habit_completions')
    .delete()
    .eq('user_id', user.id)
    .eq('habit_id', habit_id)
    .eq('completed_date', today)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
