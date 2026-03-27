import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { calculateBPStats } from '@/lib/blood-pressure'

export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'blood_pressure',
  },
  async (_request, { user, supabase }) => {
    const { data, error } = await supabase
      .from('blood_pressure_logs')
      .select('id, systolic, diastolic, pulse, arm, time_of_day, notes, measured_at')
      .eq('user_id', user!.id)
      .order('measured_at', { ascending: false })
      .limit(30)
    if (error) return secureErrorResponse('Failed to fetch blood pressure logs', 500)

    const readings = (data ?? []).map((r) => ({
      ...r,
      date: r.measured_at?.split('T')[0] ?? '',
      arm: (r.arm ?? 'left') as 'left' | 'right',
      time_of_day: (r.time_of_day ?? 'morning') as 'morning' | 'midday' | 'evening' | 'night',
    }))

    const stats = readings.length > 0 ? calculateBPStats(readings) : null
    return secureJsonResponse({ data, stats })
  }
)

export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'CREATE',
    auditResource: 'blood_pressure',
  },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const { systolic, diastolic, pulse, arm, time_of_day, notes, measured_at } = body
    if (!systolic || !diastolic) {
      return secureErrorResponse('systolic and diastolic required', 400)
    }

    const { data, error } = await supabase
      .from('blood_pressure_logs')
      .insert({
        user_id: user!.id,
        systolic: Number(systolic),
        diastolic: Number(diastolic),
        pulse: pulse ? Number(pulse) : null,
        arm: arm ?? 'left',
        time_of_day: time_of_day ?? 'morning',
        notes: notes || null,
        measured_at: measured_at ?? new Date().toISOString(),
      })
      .select()
      .single()
    if (error) return secureErrorResponse('Failed to save blood pressure log', 500)
    return secureJsonResponse({ data }, 201)
  }
)

export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'DELETE',
    auditResource: 'blood_pressure',
  },
  async (request, { user, supabase }) => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return secureErrorResponse('id required', 400)

    const { error } = await supabase
      .from('blood_pressure_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)
    if (error) return secureErrorResponse('Failed to delete blood pressure log', 500)
    return secureJsonResponse({ success: true })
  }
)
