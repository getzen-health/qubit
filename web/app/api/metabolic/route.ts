import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_request, { user, supabase }) => {
    const [
      { data: assessments },
      { data: labRows },
      { data: bodyRows },
      { data: bpRows },
    ] = await Promise.all([
      supabase
        .from('metabolic_assessments')
        .select(
          'id, assessed_at, metabolic_score, metabolic_syndrome_criteria, has_metabolic_syndrome, insulin_resistance_proxy, tg_hdl_ratio, flexibility_score, inputs'
        )
        .eq('user_id', user!.id)
        .order('assessed_at', { ascending: false })
        .limit(30),
      supabase
        .from('lab_results')
        .select('biomarker_key, value, lab_date')
        .eq('user_id', user!.id)
        .in('biomarker_key', ['fasting_glucose', 'hba1c', 'triglycerides', 'hdl', 'ldl'])
        .order('lab_date', { ascending: false })
        .limit(20),
      supabase
        .from('body_measurements')
        .select('waist_cm, height_cm, weight_kg, measured_at')
        .eq('user_id', user!.id)
        .order('measured_at', { ascending: false })
        .limit(5),
      supabase
        .from('blood_pressure_logs')
        .select('systolic, diastolic, measured_at')
        .eq('user_id', user!.id)
        .order('measured_at', { ascending: false })
        .limit(5),
    ])

    const prefill: Record<string, number | undefined> = {}

    if (labRows) {
      const latestByKey: Record<string, number> = {}
      for (const row of labRows) {
        if (!(row.biomarker_key in latestByKey)) {
          latestByKey[row.biomarker_key] = row.value
        }
      }
      if (latestByKey.fasting_glucose !== undefined)
        prefill.fasting_glucose_mgdl = latestByKey.fasting_glucose
      if (latestByKey.hba1c !== undefined) prefill.hba1c_pct = latestByKey.hba1c
      if (latestByKey.triglycerides !== undefined)
        prefill.triglycerides_mgdl = latestByKey.triglycerides
      if (latestByKey.hdl !== undefined) prefill.hdl_mgdl = latestByKey.hdl
      if (latestByKey.ldl !== undefined) prefill.ldl_mgdl = latestByKey.ldl
    }

    if (bodyRows && bodyRows.length > 0) {
      const latest = bodyRows[0]
      if (latest.waist_cm) prefill.waist_cm = latest.waist_cm
      if (latest.height_cm) prefill.height_cm = latest.height_cm
      if (latest.weight_kg) prefill.weight_kg = latest.weight_kg
    }

    if (bpRows && bpRows.length > 0) {
      const latest = bpRows[0]
      prefill.systolic_bp = latest.systolic
      prefill.diastolic_bp = latest.diastolic
    }

    return secureJsonResponse({
      assessments: assessments ?? [],
      prefill,
    })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const {
      assessed_at,
      metabolic_score,
      metabolic_syndrome_criteria,
      has_metabolic_syndrome,
      insulin_resistance_proxy,
      tg_hdl_ratio,
      flexibility_score,
      inputs,
    } = body

    const { data, error } = await supabase
      .from('metabolic_assessments')
      .insert({
        user_id: user!.id,
        assessed_at: assessed_at ?? new Date().toISOString().slice(0, 10),
        metabolic_score: metabolic_score ?? null,
        metabolic_syndrome_criteria: metabolic_syndrome_criteria ?? null,
        has_metabolic_syndrome: has_metabolic_syndrome ?? null,
        insulin_resistance_proxy: insulin_resistance_proxy ?? null,
        tg_hdl_ratio: tg_hdl_ratio ?? null,
        flexibility_score: flexibility_score ?? null,
        inputs: inputs ?? null,
      })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save metabolic assessment', 500)
    return secureJsonResponse({ data }, 201)
  }
)
