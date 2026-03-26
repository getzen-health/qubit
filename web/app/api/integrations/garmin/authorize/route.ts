import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect('/login')

  // Garmin uses OAuth 1.0a - redirect to auth page with instructions
  const consumerKey = process.env.GARMIN_CONSUMER_KEY
  if (!consumerKey) {
    return NextResponse.json({ error: 'Garmin not configured. Set GARMIN_CONSUMER_KEY and GARMIN_CONSUMER_SECRET.' }, { status: 503 })
  }

  // OAuth 1.0a request token flow placeholder
  // Full implementation requires oauth-1.0a library
  return NextResponse.redirect('https://connect.garmin.com/oauthConfirm')
}
