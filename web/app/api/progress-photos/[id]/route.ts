import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await checkRateLimit(user.id, 'progress-photos-delete')
  const { id } = await params
  // Get photo record
  const { data, error } = await supabase
    .from('progress_photos')
    .select('id,storage_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // Delete from storage
  await supabase.storage.from('progress-photos').remove([data.storage_path])
  // Delete from DB
  const { error: photoDelErr } = await supabase.from('progress_photos').delete().eq('id', id)
  if (photoDelErr) console.error('progress_photos delete error', photoDelErr)
  return NextResponse.json({ success: true })
}
