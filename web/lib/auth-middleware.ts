/**
 * Authentication Middleware for API Routes
 * Provides withAuth wrapper and utilities for protecting sensitive endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface AuthContext {
  user: {
    id: string
    email?: string
  }
}

/**
 * Higher-order function to wrap an API handler with authentication
 * @param handler The route handler to protect
 * @returns Protected route handler
 */
export function withAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const supabase = await createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      return await handler(request, {
        user: {
          id: user.id,
          email: user.email,
        },
      })
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

/**
 * Verify user authentication without wrapping
 * Useful for routes that have custom handling
 */
export async function verifyAuth(request: NextRequest): Promise<
  | {
      authenticated: true
      user: { id: string; email?: string }
    }
  | {
      authenticated: false
      response: NextResponse
    }
> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        authenticated: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return {
      authenticated: false,
      response: NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
    }
  }
}
