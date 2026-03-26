import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await checkRateLimit(user.id, 'progress-photos-list')
  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', user.id)
    .order('taken_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ photos: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await checkRateLimit(user.id, 'progress-photos-upload')
  const body = await req.json()
  const { storage_path, photo_url, category, notes, weight_kg, taken_at } = body
  const { error } = await supabase.from('progress_photos').insert({
    user_id: user.id,
    storage_path,
    photo_url,
    category,
    notes,
    weight_kg,
    taken_at
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
