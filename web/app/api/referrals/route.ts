import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const referralCode = crypto.createHash('sha256').update(user.id).digest('hex').slice(0, 8).toUpperCase()
  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referralCode}`
  
  const { data: referrals } = await supabase
    .from('referrals')
    .select('referred_email, status, created_at')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })
  
  return NextResponse.json({ referralCode, referralLink, referrals: referrals ?? [] })
}
