import { NextResponse } from 'next/server'
import { createSecureApiHandler } from '@/lib/security'

export const GET = createSecureApiHandler(
  { requireAuth: true },
  async () => {
    const consumerKey = process.env.GARMIN_CONSUMER_KEY
    if (!consumerKey) {
      return NextResponse.json(
        { error: 'Garmin not configured. Set GARMIN_CONSUMER_KEY and GARMIN_CONSUMER_SECRET.' },
        { status: 503 }
      )
    }

    // OAuth 1.0a request token flow placeholder
    // Full implementation requires oauth-1.0a library
    return NextResponse.redirect('https://connect.garmin.com/oauthConfirm')
  }
)
