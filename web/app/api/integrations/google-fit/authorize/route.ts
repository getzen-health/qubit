import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createSecureApiHandler } from '@/lib/security'

export const GET = createSecureApiHandler(
  { requireAuth: true },
  async () => {
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      return NextResponse.json({ error: 'Google Fit not configured' }, { status: 503 })
    }

    const state = crypto.randomUUID()

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-fit/callback`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read',
      access_type: 'offline',
      state,
      prompt: 'consent',
    })

    const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
    response.cookies.set('google_fit_state', state, { httpOnly: true, secure: true, maxAge: 600 })
    return response
  }
)
