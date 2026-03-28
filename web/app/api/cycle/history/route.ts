import { apiLogger } from '@/lib/api-logger'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

// GET /api/cycle/history – last 12 cycles with computed lengths
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'health_data',
  },
  async (_request, { user, supabase }) => {
    const { data: cycles, error } = await supabase
      .from('menstrual_cycles')
      .select('*')
      .eq('user_id', user!.id)
      .order('start_date', { ascending: false })
      .limit(13) // fetch one extra to compute length of the oldest visible cycle

    if (error) {
      apiLogger('Error fetching cycle history:', error)
      return secureErrorResponse('Failed to fetch cycle history', 500)
    }

    const msPerDay = 86_400_000

    // For each cycle (except the oldest), compute actual cycle_length from next start_date
    const enriched = (cycles ?? []).slice(0, 12).map((cycle, i) => {
      const nextCycle = cycles![i + 1] // one older cycle (may be undefined for last item)
      const computedLength =
        nextCycle
          ? Math.round(
              (new Date(cycle.start_date).getTime() - new Date(nextCycle.start_date).getTime()) /
                msPerDay
            )
          : (cycle.cycle_length ?? null)

      return {
        id: cycle.id,
        start_date: cycle.start_date,
        end_date: cycle.end_date,
        cycle_length: computedLength,
        flow_intensity: cycle.flow_intensity,
        symptoms: cycle.symptoms ?? [],
        notes: cycle.notes,
        created_at: cycle.created_at,
        updated_at: cycle.updated_at,
      }
    })

    const lengths = enriched.map((c) => c.cycle_length).filter((l): l is number => l !== null)
    const avgLength =
      lengths.length > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : null

    return secureJsonResponse({
      cycles: enriched,
      summary: {
        total: enriched.length,
        avg_cycle_length: avgLength,
        min_cycle_length: lengths.length > 0 ? Math.min(...lengths) : null,
        max_cycle_length: lengths.length > 0 ? Math.max(...lengths) : null,
      },
    })
  }
)
