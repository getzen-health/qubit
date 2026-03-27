import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateSchema = z.object({
  name: z.string().optional(),
  icon: z.string().optional(),
  category: z.enum(['health', 'fitness', 'nutrition', 'sleep', 'mental', 'custom']).optional(),
  target_value: z.number().optional(),
  target_unit: z.string().optional(),
  frequency: z.enum(['daily', 'weekdays', 'weekends', 'custom']).optional(),
  reminder_time: z.string().optional(),
  reminder_enabled: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await checkRateLimit(req, 'healthData')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: habit_id } = await params
  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { error } = await supabase
    .from('user_habits')
    .update(parsed.data)
    .eq('user_id', user.id)
    .eq('id', habit_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await checkRateLimit(req, 'healthData')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: habit_id } = await params
  const { error } = await supabase
    .from('user_habits')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('id', habit_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
