import { NextResponse } from 'next/server'
import { createSecureApiHandler } from '@/lib/security'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  message: z.string().min(1).max(5000),
})

export const POST = createSecureApiHandler(
  {
    rateLimit: 'default',
    requireAuth: false,
    bodySchema,
  },
  async () => {
    return NextResponse.json({ success: true })
  }
)
