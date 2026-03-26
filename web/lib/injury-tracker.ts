export type PainType = 'sharp' | 'dull' | 'aching' | 'burning' | 'tingling' | 'pressure'
export type OnsetType = 'acute' | 'gradual' | 'chronic'
export type RecoveryStatus = 'active' | 'improving' | 'resolved' | 'recurring'

export interface BodyRegion {
  id: string
  name: string
  side?: 'left' | 'right' | 'bilateral'
  category: 'head' | 'neck' | 'shoulder' | 'arm' | 'chest' | 'back' | 'hip' | 'leg' | 'foot'
}

export const BODY_REGIONS: BodyRegion[] = [
  // Head
  { id: 'head_front', name: 'Forehead / Scalp', category: 'head' },
  { id: 'jaw', name: 'Jaw (TMJ)', category: 'head' },
  { id: 'eye_left', name: 'Left Eye Area', side: 'left', category: 'head' },
  { id: 'eye_right', name: 'Right Eye Area', side: 'right', category: 'head' },
  // Neck
  { id: 'neck_front', name: 'Neck (Front)', category: 'neck' },
  { id: 'neck_back', name: 'Neck (Back)', category: 'neck' },
  // Shoulder
  { id: 'shoulder_left', name: 'Left Shoulder', side: 'left', category: 'shoulder' },
  { id: 'shoulder_right', name: 'Right Shoulder', side: 'right', category: 'shoulder' },
  // Arm
  { id: 'elbow_left', name: 'Left Elbow', side: 'left', category: 'arm' },
  { id: 'elbow_right', name: 'Right Elbow', side: 'right', category: 'arm' },
  { id: 'forearm_left', name: 'Left Forearm', side: 'left', category: 'arm' },
  { id: 'forearm_right', name: 'Right Forearm', side: 'right', category: 'arm' },
  { id: 'wrist_left', name: 'Left Wrist', side: 'left', category: 'arm' },
  { id: 'wrist_right', name: 'Right Wrist', side: 'right', category: 'arm' },
  { id: 'hand_left', name: 'Left Hand', side: 'left', category: 'arm' },
  { id: 'hand_right', name: 'Right Hand', side: 'right', category: 'arm' },
  // Chest
  { id: 'chest', name: 'Chest', category: 'chest' },
  { id: 'ribs_left', name: 'Left Ribs', side: 'left', category: 'chest' },
  { id: 'ribs_right', name: 'Right Ribs', side: 'right', category: 'chest' },
  // Back
  { id: 'upper_back', name: 'Upper Back', category: 'back' },
  { id: 'mid_back', name: 'Mid Back', category: 'back' },
  { id: 'lower_back', name: 'Lower Back', category: 'back' },
  // Hip
  { id: 'hip_left', name: 'Left Hip', side: 'left', category: 'hip' },
  { id: 'hip_right', name: 'Right Hip', side: 'right', category: 'hip' },
  { id: 'groin', name: 'Groin', category: 'hip' },
  // Leg
  { id: 'quad_left', name: 'Left Quad', side: 'left', category: 'leg' },
  { id: 'quad_right', name: 'Right Quad', side: 'right', category: 'leg' },
  { id: 'hamstring_left', name: 'Left Hamstring', side: 'left', category: 'leg' },
  { id: 'hamstring_right', name: 'Right Hamstring', side: 'right', category: 'leg' },
  { id: 'knee_left', name: 'Left Knee', side: 'left', category: 'leg' },
  { id: 'knee_right', name: 'Right Knee', side: 'right', category: 'leg' },
  { id: 'calf_left', name: 'Left Calf', side: 'left', category: 'leg' },
  { id: 'calf_right', name: 'Right Calf', side: 'right', category: 'leg' },
  { id: 'shin_left', name: 'Left Shin', side: 'left', category: 'leg' },
  { id: 'shin_right', name: 'Right Shin', side: 'right', category: 'leg' },
  // Foot
  { id: 'ankle_left', name: 'Left Ankle', side: 'left', category: 'foot' },
  { id: 'ankle_right', name: 'Right Ankle', side: 'right', category: 'foot' },
  { id: 'foot_left', name: 'Left Foot', side: 'left', category: 'foot' },
  { id: 'foot_right', name: 'Right Foot', side: 'right', category: 'foot' },
]

export interface InjuryLog {
  id: string
  body_region: string
  pain_type: PainType
  intensity: number // 0-10 NRS
  onset: OnsetType
  onset_date: string
  aggravating_factors: string[]
  relieving_factors: string[]
  recovery_status: RecoveryStatus
  notes: string
}

export interface RecoveryProtocol {
  name: string
  phase: 'acute' | 'subacute' | 'rehabilitation'
  steps: { label: string; description: string; duration: string }[]
  exercises: { name: string; sets_reps: string; cue: string }[]
  warning_signs: string[]
  return_to_sport_days: string
}

export const PROTOCOLS: Record<string, RecoveryProtocol> = {
  general: {
    name: 'PEACE & LOVE',
    phase: 'acute',
    steps: [
      { label: 'Protect', description: 'Unload or restrict movement for 1–3 days to minimise bleeding and prevent aggravation.', duration: '1–3 days' },
      { label: 'Elevate', description: 'Elevate the injured limb above heart level to reduce swelling.', duration: '20–30 min, multiple times/day' },
      { label: 'Avoid anti-inflammatories', description: 'Avoid NSAIDs & ice — inflammation is part of healing. Do not take anti-inflammatory medications.', duration: 'First 72 hours' },
      { label: 'Compress', description: 'Use elastic bandage or taping to reduce swelling.', duration: 'Continuously first 24–48 h' },
      { label: 'Educate', description: 'Understand that an active approach accelerates recovery. Avoid passive treatments.', duration: 'Ongoing' },
      { label: 'Load', description: 'Let pain guide a gradual return to normal activities. Optimal loading promotes healing.', duration: 'Day 3 onwards' },
      { label: 'Optimism', description: 'Positive expectations correlate with better outcomes. Avoid catastrophising.', duration: 'Ongoing' },
      { label: 'Vascularisation', description: 'Pain-free cardio (cycling, swimming) started early to boost blood flow to tissues.', duration: 'Day 3–7' },
      { label: 'Exercise', description: 'Restore mobility, strength, and proprioception progressively.', duration: 'Week 1 onwards' },
    ],
    exercises: [
      { name: 'Ankle Circles', sets_reps: '3 × 15 each direction', cue: 'Slow controlled circles, no pain' },
      { name: 'Gentle Range of Motion', sets_reps: '3 × 10 reps', cue: 'Move to comfortable end-range only' },
      { name: 'Stationary Bike (easy)', sets_reps: '10–15 min, low resistance', cue: 'Pain-free, conversational pace' },
    ],
    warning_signs: [
      'Severe or worsening pain not responding to rest',
      'Numbness or tingling down arm or leg',
      'Inability to bear weight after lower-limb injury',
      'Visible deformity or significant swelling',
      'Fever or chills alongside injury',
    ],
    return_to_sport_days: '7–21 days',
  },

  ankle_sprain: {
    name: 'Ankle Sprain — PEACE & LOVE',
    phase: 'acute',
    steps: [
      { label: 'Protect', description: 'Avoid weight-bearing for 24–48 h. Use crutches if needed.', duration: '24–48 hours' },
      { label: 'Elevate', description: 'Keep ankle above hip level when resting.', duration: 'First 48 hours' },
      { label: 'Avoid anti-inflammatories', description: 'Let natural swelling peak and resolve; NSAIDs may impair ligament healing.', duration: 'First 72 hours' },
      { label: 'Compress', description: 'Figure-8 elastic bandage from foot to mid-calf.', duration: '48–72 hours' },
      { label: 'Educate', description: 'Most Grade I–II sprains heal fully with active rehabilitation.', duration: 'Ongoing' },
      { label: 'Load', description: 'Begin weight-bearing as tolerated once acute pain eases.', duration: 'Day 2–4' },
      { label: 'Optimism', description: 'High likelihood of full recovery with consistent rehab.', duration: 'Ongoing' },
      { label: 'Vascularisation', description: 'Pool walking or cycling to maintain fitness without loading.', duration: 'Day 3–7' },
      { label: 'Exercise', description: 'Proprioception and strengthening exercises.', duration: 'Week 2 onwards' },
    ],
    exercises: [
      { name: 'Alphabet Tracing', sets_reps: '2 × full alphabet', cue: 'Trace with big toe, keep leg still' },
      { name: 'Calf Raises (bilateral)', sets_reps: '3 × 15', cue: 'Slow eccentric, no sharp pain' },
      { name: 'Single-Leg Balance', sets_reps: '3 × 30 sec', cue: 'Slight knee bend, eyes open then closed' },
      { name: 'Resistance Band Dorsiflexion', sets_reps: '3 × 15', cue: 'Controlled throughout range' },
    ],
    warning_signs: [
      'Unable to bear weight after 48 h',
      'Bone tenderness at the tip of fibula or 5th metatarsal',
      'Swelling not reducing after 72 h',
      'Tingling or numbness in foot',
    ],
    return_to_sport_days: '14–42 days',
  },

  knee: {
    name: 'Knee Injury Protocol',
    phase: 'acute',
    steps: [
      { label: 'Protect', description: 'Avoid pivoting/twisting. Use knee brace or sleeve if helpful.', duration: 'Until pain-free at rest' },
      { label: 'Elevate', description: 'Prop leg on pillow above heart level.', duration: 'First 48 hours' },
      { label: 'Avoid anti-inflammatories', description: 'Especially important for cartilage or ligament injuries.', duration: 'First 72 hours' },
      { label: 'Compress', description: 'Compression sleeve or wrap around knee.', duration: '48 hours' },
      { label: 'Educate', description: 'Understand which structure is likely involved — different structures need different loads.', duration: 'Ongoing' },
      { label: 'Load', description: 'Gradual loading through pain-free range.', duration: 'Day 2–5' },
      { label: 'Optimism', description: 'Most knee injuries respond well to exercise-based rehabilitation.', duration: 'Ongoing' },
      { label: 'Vascularisation', description: 'Stationary cycling with high seat to minimise knee flexion.', duration: 'Week 1' },
      { label: 'Exercise', description: 'Quad strengthening, hip stability, proprioception.', duration: 'Week 1 onwards' },
    ],
    exercises: [
      { name: 'Quad Sets (isometric)', sets_reps: '3 × 10 × 10 sec hold', cue: 'Press back of knee into surface' },
      { name: 'Straight Leg Raise', sets_reps: '3 × 15', cue: 'Lock knee, lift to 45°' },
      { name: 'Step-Ups (low step)', sets_reps: '3 × 10 each leg', cue: 'Slow controlled descent' },
      { name: 'Terminal Knee Extension', sets_reps: '3 × 15', cue: 'Band behind knee, extend last 30°' },
    ],
    warning_signs: [
      'Locking or giving way of the knee',
      'Severe swelling within 2 hours of injury (haemarthrosis)',
      'Complete inability to straighten or bend the knee',
      'Obvious deformity',
    ],
    return_to_sport_days: '14–90 days',
  },

  lower_back: {
    name: 'Low Back Pain — Active Recovery',
    phase: 'subacute',
    steps: [
      { label: 'Protect', description: 'Avoid provocative postures/loads for 24–48 h. Do NOT rest in bed.', duration: '24–48 hours' },
      { label: 'Elevate', description: 'N/A for low back — focus on comfortable positioning.', duration: '—' },
      { label: 'Avoid anti-inflammatories', description: 'Evidence weak for NSAIDs in non-specific LBP. Movement is more effective.', duration: 'Ongoing' },
      { label: 'Compress', description: 'Lumbar support belt for heavy tasks only — avoid dependence.', duration: 'Activity-specific' },
      { label: 'Educate', description: '>90% of acute low back pain resolves within 6 weeks with active management.', duration: 'Ongoing' },
      { label: 'Load', description: 'Walking is the best medicine — stay active.', duration: 'Day 1 onwards' },
      { label: 'Optimism', description: 'Fear-avoidance beliefs predict chronicity more than tissue damage.', duration: 'Ongoing' },
      { label: 'Vascularisation', description: 'Walking, light cycling, or swimming daily.', duration: 'Week 1' },
      { label: 'Exercise', description: 'Core endurance, hip hinge mechanics, progressive loading.', duration: 'Week 1 onwards' },
    ],
    exercises: [
      { name: 'McGill Curl-Up', sets_reps: '3 × 8', cue: 'Neutral spine, hands under lumbar curve' },
      { name: 'Bird Dog', sets_reps: '3 × 8 each side', cue: 'Neutral pelvis, slow extension' },
      { name: 'Side Plank', sets_reps: '3 × 20–30 sec each side', cue: 'Hips stacked, body straight' },
      { name: 'Hip Hinge (Romanian Deadlift)', sets_reps: '3 × 10 @ light load', cue: 'Hinge at hips, maintain lumbar curve' },
    ],
    warning_signs: [
      'Saddle area numbness (groin/inner thigh)',
      'Loss of bowel or bladder control',
      'Pain at night not relieved by any position',
      'Progressive neurological symptoms (foot drop, etc.)',
      'Fever + back pain',
    ],
    return_to_sport_days: '7–28 days',
  },

  shoulder: {
    name: 'Shoulder Injury Protocol',
    phase: 'acute',
    steps: [
      { label: 'Protect', description: 'Use a sling only if truly needed (acute dislocation/fracture). Avoid prolonged immobilisation.', duration: '24–72 hours' },
      { label: 'Elevate', description: 'Keep arm elevated when sitting; avoid dependent positioning.', duration: 'First 48 hours' },
      { label: 'Avoid anti-inflammatories', description: 'Inflammation supports rotator cuff healing.', duration: 'First 72 hours' },
      { label: 'Compress', description: 'Not typically used for shoulder.', duration: '—' },
      { label: 'Educate', description: 'Shoulder impingement and RC injuries respond well to targeted exercise.', duration: 'Ongoing' },
      { label: 'Load', description: 'Pendulum exercises and pain-free active motion.', duration: 'Day 2 onwards' },
      { label: 'Optimism', description: 'Most shoulder injuries recover fully with proper rehabilitation.', duration: 'Ongoing' },
      { label: 'Vascularisation', description: 'Walking or lower-body cardio to maintain fitness.', duration: 'Week 1' },
      { label: 'Exercise', description: 'Scapular stability, rotator cuff strengthening, posterior capsule stretching.', duration: 'Week 1 onwards' },
    ],
    exercises: [
      { name: 'Pendulum Circles', sets_reps: '2 × 20 circles each direction', cue: 'Arm hangs freely, small circles' },
      { name: 'Scapular Retraction (band)', sets_reps: '3 × 15', cue: 'Squeeze shoulder blades together, hold 2 sec' },
      { name: 'External Rotation (band)', sets_reps: '3 × 15', cue: 'Elbow at 90°, rotate out keeping elbow at side' },
      { name: 'Sleeper Stretch', sets_reps: '3 × 30 sec each side', cue: 'Gentle posterior shoulder stretch' },
    ],
    warning_signs: [
      'Visible deformity (possible dislocation or fracture)',
      'Complete inability to raise arm',
      'Tingling down arm into hand',
      'Pain at night waking you from sleep',
    ],
    return_to_sport_days: '14–56 days',
  },

  tendinopathy: {
    name: 'Tendinopathy — Cook & Purdam Continuum',
    phase: 'subacute',
    steps: [
      { label: 'Protect', description: 'Reduce provocative load by 50–70%. Do NOT completely rest — tendons need load.', duration: 'Week 1–2' },
      { label: 'Elevate', description: 'Relevant for Achilles/patella — elevate when resting.', duration: 'First 48 hours' },
      { label: 'Avoid anti-inflammatories', description: 'NSAIDs may provide short-term pain relief but do not address tendon pathology.', duration: 'Ongoing preference' },
      { label: 'Compress', description: 'Compression sleeve for Achilles/patella may provide pain relief.', duration: 'During activity' },
      { label: 'Educate', description: 'Tendinopathy is a load management problem — progressive loading is the treatment.', duration: 'Ongoing' },
      { label: 'Load', description: 'Isometric loading first (30–45 sec holds) to reduce pain, then progressive isotonic loading.', duration: 'Week 1 onwards' },
      { label: 'Optimism', description: 'Tendinopathy responds well to structured loading programmes.', duration: 'Ongoing' },
      { label: 'Vascularisation', description: 'Low-impact cardio (cycling, swimming) to maintain fitness.', duration: 'Throughout' },
      { label: 'Exercise', description: 'Heavy slow resistance (HSR) programme — key evidence-based treatment.', duration: 'Week 2–12' },
    ],
    exercises: [
      { name: 'Isometric Hold (wall sit / calf hold)', sets_reps: '5 × 45 sec holds', cue: 'Moderate intensity, pain ≤ 3/10' },
      { name: 'Heavy Slow Resistance (eccentric)', sets_reps: '3 × 15 @ 70% 1RM', cue: '3 sec down, 3 sec up, no bounce' },
      { name: 'Single-Leg Calf Raise (Achilles)', sets_reps: '3 × 15 each leg', cue: 'Full range, slow eccentric, load as tolerated' },
      { name: 'Spanish Squat (patella)', sets_reps: '3 × 15', cue: 'Knee over toe, slow eccentric' },
    ],
    warning_signs: [
      'Pain > 5/10 during exercise (reduce load immediately)',
      'Pain persisting > 24 h after exercise (overloaded)',
      'Tendon becomes hard/nodular — see sports physician',
      'No improvement after 8–12 weeks of loading programme',
    ],
    return_to_sport_days: '42–120 days',
  },

  muscle_strain: {
    name: 'Muscle Strain — PEACE & LOVE',
    phase: 'acute',
    steps: [
      { label: 'Protect', description: 'Avoid painful contraction/stretch for 24–48 h.', duration: '24–48 hours' },
      { label: 'Elevate', description: 'Elevate limb if swelling present.', duration: '48 hours' },
      { label: 'Avoid anti-inflammatories', description: 'Satellite cell proliferation for muscle repair may be impaired by NSAIDs.', duration: 'First 72 hours' },
      { label: 'Compress', description: 'Compression bandage on limb muscle strains.', duration: '48 hours' },
      { label: 'Educate', description: 'Muscle strains heal predictably; grade determines timeline.', duration: 'Ongoing' },
      { label: 'Load', description: 'Begin gentle pain-free motion and contraction early.', duration: 'Day 2–3' },
      { label: 'Optimism', description: 'Grade I–II strains have excellent prognosis with active rehab.', duration: 'Ongoing' },
      { label: 'Vascularisation', description: 'Unaffected limb cardio and pool work.', duration: 'Day 3 onwards' },
      { label: 'Exercise', description: 'Progressive strengthening through full range.', duration: 'Week 1–6' },
    ],
    exercises: [
      { name: 'Isometric Contraction (pain-free)', sets_reps: '3 × 10 × 10 sec', cue: '30–40% effort, zero pain' },
      { name: 'Active ROM (gentle)', sets_reps: '3 × 10', cue: 'Move to comfortable end-range' },
      { name: 'Eccentric Strengthening', sets_reps: '3 × 10 @ bodyweight', cue: 'Start when pain < 2/10' },
      { name: 'Nordic Curl (hamstring)', sets_reps: '3 × 6–8', cue: 'Introduce in week 3–4' },
    ],
    warning_signs: [
      'Palpable gap or defect in muscle belly (possible complete rupture)',
      'Extensive bruising spreading rapidly',
      'Inability to contract muscle at all',
      'Severe swelling with tightness (compartment syndrome risk)',
    ],
    return_to_sport_days: '7–42 days',
  },
}

export function getProtocol(region: BodyRegion, intensity: number, onset: OnsetType): RecoveryProtocol {
  const cat = region.category

  // Tendinopathy hint: chronic gradual + tendon-common sites
  if (onset === 'chronic' && ['shoulder', 'leg', 'foot'].includes(cat)) {
    return PROTOCOLS.tendinopathy
  }
  if (cat === 'foot' || (cat === 'leg' && region.id.includes('calf'))) {
    return onset === 'acute' ? PROTOCOLS.muscle_strain : PROTOCOLS.tendinopathy
  }
  if (cat === 'leg' && (region.id.includes('ankle'))) {
    return PROTOCOLS.ankle_sprain
  }
  if (cat === 'leg' && (region.id.includes('knee'))) {
    return PROTOCOLS.knee
  }
  if (cat === 'back') {
    return PROTOCOLS.lower_back
  }
  if (cat === 'shoulder') {
    return PROTOCOLS.shoulder
  }
  if (cat === 'leg' && (region.id.includes('quad') || region.id.includes('hamstring'))) {
    return PROTOCOLS.muscle_strain
  }
  return PROTOCOLS.general
}

export function requiresMedicalAttention(log: InjuryLog): boolean {
  if (log.intensity >= 8) return true
  // Tingling in arm or leg — possible nerve involvement
  if (log.pain_type === 'tingling') {
    const region = BODY_REGIONS.find((r) => r.id === log.body_region)
    if (region && ['arm', 'leg', 'foot'].includes(region.category)) return true
  }
  // Acute severe headache
  if (log.pain_type === 'sharp' && log.onset === 'acute') {
    const region = BODY_REGIONS.find((r) => r.id === log.body_region)
    if (region && region.category === 'head') return true
  }
  return false
}
