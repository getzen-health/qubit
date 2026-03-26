import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/security'
import { analyzeGoal, type HealthGoal, type GoalCheckin } from '@/lib/health-goals'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: goals, error: goalsErr }, { data: checkins, error: checkinsErr }] =
    await Promise.all([
      supabase
        .from('health_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('goal_checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(500),
    ])

  if (goalsErr) return NextResponse.json({ error: goalsErr.message }, { status: 500 })
  if (checkinsErr) return NextResponse.json({ error: checkinsErr.message }, { status: 500 })

  // Group checkins by goal_id and attach analysis
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

  // Year-level stats
  const yearStart = new Date()
  yearStart.setMonth(0, 1)
  const completedThisYear = (goals ?? []).filter(
    (g) => g.status === 'completed' && g.updated_at >= yearStart.toISOString()
  ).length
  const totalThisYear = (goals ?? []).filter(
    (g) => g.created_at >= yearStart.toISOString()
  ).length

  return NextResponse.json({
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

export async function POST(req: NextRequest) {
  const identifier = getClientIdentifier(req)
  const { allowed } = await checkRateLimit(identifier, 'healthData')
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, ...payload } = body

  if (type === 'goal') {
    const {
      title, category, specific, metric, target_value, current_value,
      unit, start_date, target_date, wish, outcome, obstacle, plan,
      status, motivation_level,
    } = payload as HealthGoal

    if (!title || !target_date) {
      return NextResponse.json({ error: 'title and target_date are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('health_goals')
      .insert({
        user_id: user.id,
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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ goal: data }, { status: 201 })
  }

  if (type === 'checkin') {
    const {
      goal_id, date, current_value, progress_rating, obstacle_encountered,
      plan_executed, motivation_level, notes,
    } = payload as GoalCheckin & { type: string }

    if (!goal_id || current_value === undefined || !progress_rating || !motivation_level) {
      return NextResponse.json(
        { error: 'goal_id, current_value, progress_rating, and motivation_level are required' },
        { status: 400 }
      )
    }

    // Verify goal belongs to user
    const { data: goal, error: goalErr } = await supabase
      .from('health_goals')
      .select('id, target_value')
      .eq('id', goal_id)
      .eq('user_id', user.id)
      .single()

    if (goalErr || !goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const { data: checkin, error: checkinErr } = await supabase
      .from('goal_checkins')
      .insert({
        user_id: user.id,
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

    if (checkinErr) return NextResponse.json({ error: checkinErr.message }, { status: 500 })

    // Update goal's current_value to latest checkin value
    await supabase
      .from('health_goals')
      .update({ current_value })
      .eq('id', goal_id)
      .eq('user_id', user.id)

    // Auto-complete if target reached
    if (Number(current_value) >= Number(goal.target_value)) {
      await supabase
        .from('health_goals')
        .update({ status: 'completed' })
        .eq('id', goal_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
    }

    return NextResponse.json({ checkin }, { status: 201 })
  }

  if (type === 'update_status') {
    const { goal_id, status } = payload as { goal_id: string; status: string }
    if (!goal_id || !status) {
      return NextResponse.json({ error: 'goal_id and status are required' }, { status: 400 })
    }
    const { error } = await supabase
      .from('health_goals')
      .update({ status })
      .eq('id', goal_id)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
}
