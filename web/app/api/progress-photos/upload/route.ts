import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await checkRateLimit(user.id, 'progress-photos-upload-url')
  const { category = 'front' } = await req.json()
  const filename = `${user.id}/${Date.now()}-${category}.jpg`
  const { data, error } = await supabase.storage.from('progress-photos')
    .createSignedUploadUrl(filename)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ signedUrl: data.signedUrl, path: data.path })
}
