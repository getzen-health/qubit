import { NextRequest } from 'next/server'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import { analyzeGoal, type HealthGoal, type GoalCheckin } from '@/lib/health-goals'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const [{ data: goals, error: goalsErr }, { data: checkins, error: checkinsErr }] =
      await Promise.all([
        supabase
          .from('health_goals')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('goal_checkins')
          .select('*')
          .eq('user_id', user!.id)
          .order('date', { ascending: false })
          .limit(500),
      ])

    if (goalsErr) return secureErrorResponse(goalsErr.message, 500)
    if (checkinsErr) return secureErrorResponse(checkinsErr.message, 500)

    const checkinsByGoal = new Map<string, GoalCheckin[]>()
    for (const c of checkins ?? []) {
      const arr = checkinsByGoal.get(c.goal_id) ?? []
      arr.push(c as GoalCheckin)
      checkinsByGoal.set(c.goal_id, arr)
    }

    const goalsWithAnalysis = (goals ?? []).map((g) => {
      const goalCheckins = checkinsByGoal.get(g.id) ?? []
      const analysis = analyzeGoal(g as HealthGoal, goalCheckins)
      return { ...g, checkins: goalCheckins, analysis }
    })

    const yearStart = new Date()
    yearStart.setMonth(0, 1)
    const completedThisYear = (goals ?? []).filter(
      (g) => g.status === 'completed' && g.updated_at >= yearStart.toISOString()
    ).length
    const totalThisYear = (goals ?? []).filter(
      (g) => g.created_at >= yearStart.toISOString()
    ).length

    return secureJsonResponse({
      goals: goalsWithAnalysis,
      stats: {
        total: goals?.length ?? 0,
        active: goals?.filter((g) => g.status === 'active').length ?? 0,
        completed: goals?.filter((g) => g.status === 'completed').length ?? 0,
        completedThisYear,
        totalThisYear,
      },
    })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req: NextRequest, { user, supabase }) => {
    let body: { type: string; [key: string]: unknown }
    try {
      body = await req.json()
    } catch {
      return secureErrorResponse('Invalid JSON body', 400)
    }

    const { type, ...payload } = body

    if (type === 'goal') {
      const {
        title, category, specific, metric, target_value, current_value,
        unit, start_date, target_date, wish, outcome, obstacle, plan,
        status, motivation_level,
      } = payload as unknown as HealthGoal

      if (!title || !target_date) {
        return secureErrorResponse('title and target_date are required', 400)
      }

      const { data, error } = await supabase
        .from('health_goals')
        .insert({
          user_id: user!.id,
          title,
          category: category ?? 'custom',
          specific: specific ?? '',
          metric: metric ?? '',
          target_value: target_value ?? 0,
          current_value: current_value ?? 0,
          unit: unit ?? '',
          start_date: start_date ?? new Date().toISOString().slice(0, 10),
          target_date,
          wish: wish ?? '',
          outcome: outcome ?? '',
          obstacle: obstacle ?? '',
          plan: plan ?? '',
          status: status ?? 'active',
          motivation_level: motivation_level ?? 7,
        })
        .select()
        .single()

      if (error) return secureErrorResponse(error.message, 500)
      return secureJsonResponse({ goal: data }, 201)
    }

    if (type === 'checkin') {
      const {
        goal_id, date, current_value, progress_rating, obstacle_encountered,
        plan_executed, motivation_level, notes,
      } = payload as unknown as GoalCheckin & { type: string }

      if (!goal_id || current_value === undefined || !progress_rating || !motivation_level) {
        return secureErrorResponse(
          'goal_id, current_value, progress_rating, and motivation_level are required',
          400
        )
      }

      const { data: goal, error: goalErr } = await supabase
        .from('health_goals')
        .select('id, target_value')
        .eq('id', goal_id)
        .eq('user_id', user!.id)
        .single()

      if (goalErr || !goal) return secureErrorResponse('Goal not found', 404)

      const { data: checkin, error: checkinErr } = await supabase
        .from('goal_checkins')
        .insert({
          user_id: user!.id,
          goal_id,
          date: date ?? new Date().toISOString().slice(0, 10),
          current_value,
          progress_rating,
          obstacle_encountered: obstacle_encountered ?? null,
          plan_executed: plan_executed ?? false,
          motivation_level,
          notes: notes ?? null,
        })
        .select()
        .single()

      if (checkinErr) return secureErrorResponse(checkinErr.message, 500)

      await supabase
        .from('health_goals')
        .update({ current_value })
        .eq('id', goal_id)
        .eq('user_id', user!.id)

      if (Number(current_value) >= Number(goal.target_value)) {
        await supabase
          .from('health_goals')
          .update({ status: 'completed' })
          .eq('id', goal_id)
          .eq('user_id', user!.id)
          .eq('status', 'active')
      }

      return secureJsonResponse({ checkin }, 201)
    }

    if (type === 'update_status') {
      const { goal_id, status } = payload as { goal_id: string; status: string }
      if (!goal_id || !status) {
        return secureErrorResponse('goal_id and status are required', 400)
      }
      const { error } = await supabase
        .from('health_goals')
        .update({ status })
        .eq('id', goal_id)
        .eq('user_id', user!.id)
      if (error) return secureErrorResponse(error.message, 500)
      return secureJsonResponse({ success: true })
    }

    return secureErrorResponse(`Unknown type: ${type}`, 400)
  }
)
