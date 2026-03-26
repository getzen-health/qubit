export type PosturalDeviation = 'fhp' | 'rounded_shoulders' | 'apt' | 'knee_valgus' | 'flat_feet'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface PostureDeviation {
  id: PosturalDeviation
  name: string
  description: string
  selfTest: string
  tightMuscles: string[]
  weakMuscles: string[]
  riskIfUntreated: string
}

export interface PostureExercise {
  id: string
  name: string
  deviations: PosturalDeviation[]
  type: 'release' | 'stretch' | 'activate' | 'strengthen'
  sets: number
  reps?: number
  duration_sec?: number
  rest_sec: number
  instructions: string[]
  cue: string
  difficulty: Difficulty
  equipment: string
}

export interface PostureAssessment {
  id?: string
  user_id?: string
  date: string
  deviations: Record<PosturalDeviation, number> // 0=none, 1=mild, 2=moderate, 3=severe
  pain_areas: string[]
  ergonomic_score: number // 0-8 checklist items checked
  notes?: string
}

export interface PostureRoutine {
  exercises: PostureExercise[]
  totalMinutes: number
  focusDeviations: PosturalDeviation[]
}

export const DEVIATIONS: PostureDeviation[] = [
  {
    id: 'fhp',
    name: 'Forward Head Posture',
    description:
      'The head translates forward of the shoulders, adding up to 10 lbs of effective cervical load per inch (Kapandji 2008). Common in desk workers and phone users.',
    selfTest:
      'Stand against a wall with heels, hips, and shoulders touching. If your head does not touch the wall or you must strain to reach it, FHP is present.',
    tightMuscles: ['Suboccipitals', 'Sternocleidomastoid (SCM)', 'Upper trapezius', 'Pectoralis minor'],
    weakMuscles: ['Deep neck flexors (longus colli/capitis)', 'Lower trapezius', 'Serratus anterior'],
    riskIfUntreated:
      'Cervical disc degeneration, tension headaches, TMJ dysfunction, reduced lung capacity by up to 30%.',
  },
  {
    id: 'rounded_shoulders',
    name: 'Rounded Shoulders (Kyphosis)',
    description:
      'Shoulders roll forward and internally rotate, collapsing the thoracic spine into flexion. Part of Janda\'s Upper Crossed Syndrome (UCS).',
    selfTest:
      'Let arms hang naturally at your sides. If palms face backward instead of toward your thighs, your shoulders are internally rotated and rounded.',
    tightMuscles: ['Pectoralis major/minor', 'Anterior deltoid', 'Biceps brachii', 'Subscapularis'],
    weakMuscles: [
      'Middle and lower trapezius',
      'Rhomboids',
      'Posterior deltoid',
      'External shoulder rotators (infraspinatus, teres minor)',
    ],
    riskIfUntreated:
      'Shoulder impingement, rotator cuff tears, thoracic outlet syndrome, reduced breathing mechanics.',
  },
  {
    id: 'apt',
    name: 'Anterior Pelvic Tilt',
    description:
      'The pelvis tilts forward, causing excessive lumbar lordosis. Classic Lower Crossed Syndrome (LCS) pattern described by Janda 1987.',
    selfTest:
      'Stand with back flat against a wall. Slip your hand behind your lower back. If you can slide your entire hand through with room, the arch is excessive (>2 fingers = APT).',
    tightMuscles: ['Iliopsoas', 'Rectus femoris', 'Lumbar erectors', 'TFL'],
    weakMuscles: ['Gluteus maximus/medius', 'Hamstrings', 'Transversus abdominis', 'Deep abdominals'],
    riskIfUntreated: 'Chronic low back pain, disc herniation, SI joint dysfunction, hip impingement.',
  },
  {
    id: 'knee_valgus',
    name: 'Knee Valgus (Knocked Knees)',
    description:
      'Knees collapse inward (medially) during weight-bearing activities like squatting, walking, or landing from a jump.',
    selfTest:
      'Perform a bodyweight squat in front of a mirror. If your knees track inside your second toe or collapse toward each other at any point, knee valgus is present.',
    tightMuscles: ['TFL / IT band', 'Adductors', 'Medial gastrocnemius'],
    weakMuscles: ['Gluteus medius', 'External hip rotators (piriformis, obturators)', 'VMO (vastus medialis oblique)'],
    riskIfUntreated: 'Patellofemoral pain syndrome, ACL injury risk, IT band syndrome, meniscus wear.',
  },
  {
    id: 'flat_feet',
    name: 'Flat Feet / Overpronation',
    description:
      'The medial longitudinal arch collapses during standing or walking, causing the foot to roll inward (pronate excessively).',
    selfTest:
      'Wet your foot and step on paper. A flat foot will show nearly the entire sole with no arch curve. Also check if your ankles collapse inward when standing.',
    tightMuscles: ['Gastrocnemius', 'Soleus', 'Peroneals'],
    weakMuscles: ['Tibialis posterior', 'Intrinsic foot muscles (flexor digitorum brevis)', 'Tibialis anterior'],
    riskIfUntreated: 'Plantar fasciitis, shin splints, knee and hip misalignment, Achilles tendinopathy.',
  },
]

export const EXERCISES: PostureExercise[] = [
  // ── FHP: Release ──────────────────────────────────────────────────────────
  {
    id: 'suboccipital_release',
    name: 'Suboccipital Self-Release',
    deviations: ['fhp'],
    type: 'release',
    sets: 2,
    duration_sec: 60,
    rest_sec: 30,
    instructions: [
      'Lie on your back and place two tennis balls (or a massage tool) at the base of your skull, just below the occipital ridge.',
      'Let the weight of your head sink into the balls. Breathe deeply.',
      'Slowly nod your head "yes" 5 times, then "no" 5 times while maintaining pressure.',
      'Hold for 60 seconds per side.',
    ],
    cue: 'Melt your skull into the floor — no forcing.',
    difficulty: 'beginner',
    equipment: 'tennis balls / massage ball',
  },
  // ── FHP: Stretch ──────────────────────────────────────────────────────────
  {
    id: 'upper_trap_stretch',
    name: 'Upper Trapezius Stretch',
    deviations: ['fhp', 'rounded_shoulders'],
    type: 'stretch',
    sets: 3,
    duration_sec: 30,
    rest_sec: 15,
    instructions: [
      'Sit or stand tall. Gently tilt your right ear toward your right shoulder.',
      'Place your right hand lightly on top of your head (do not pull).',
      'Look slightly down to increase the stretch on the left upper trap.',
      'Hold 30 seconds, then switch sides.',
    ],
    cue: 'Ear to shoulder, not shoulder to ear — keep the bottom shoulder down.',
    difficulty: 'beginner',
    equipment: 'none',
  },
  {
    id: 'doorway_pec_stretch',
    name: 'Doorway Pec Stretch',
    deviations: ['fhp', 'rounded_shoulders'],
    type: 'stretch',
    sets: 3,
    duration_sec: 30,
    rest_sec: 15,
    instructions: [
      'Stand in a doorway. Place forearms on the door frame at 90° (elbows at shoulder height).',
      'Step one foot through the doorway and lean forward until you feel a stretch across the chest and front shoulders.',
      'Keep your core braced and avoid arching the lower back.',
      'Hold 30 seconds. Repeat 3 times.',
    ],
    cue: 'Open your chest like a book — spine stays neutral.',
    difficulty: 'beginner',
    equipment: 'doorway',
  },
  {
    id: 'scm_stretch',
    name: 'SCM / Neck Flexor Stretch',
    deviations: ['fhp'],
    type: 'stretch',
    sets: 3,
    duration_sec: 30,
    rest_sec: 15,
    instructions: [
      'Sit tall. Tilt your head back gently and rotate slightly to the left.',
      'You should feel a stretch along the right side of your neck (SCM).',
      'Place two fingers on your collarbone and gently press down to intensify.',
      'Hold 30 seconds. Switch sides.',
    ],
    cue: 'Long neck — pull your crown up while you tilt back.',
    difficulty: 'beginner',
    equipment: 'none',
  },
  // ── FHP: Activate ─────────────────────────────────────────────────────────
  {
    id: 'chin_tuck',
    name: 'Chin Tuck (Deep Neck Flexor Activation)',
    deviations: ['fhp'],
    type: 'activate',
    sets: 3,
    reps: 10,
    rest_sec: 30,
    instructions: [
      'Sit or stand with your spine tall. Look straight ahead.',
      'Without tilting your head, gently retract your chin straight back — imagine a string pulling your head back horizontally.',
      'You should feel a gentle lengthening at the back of the neck and mild tension under the chin.',
      'Hold 2 seconds at end range, then slowly release. Perform 10 reps.',
    ],
    cue: 'Make a double chin — not a nod down.',
    difficulty: 'beginner',
    equipment: 'none',
  },
  {
    id: 'deep_neck_flexor_hold',
    name: 'Deep Neck Flexor Isometric Hold',
    deviations: ['fhp'],
    type: 'activate',
    sets: 3,
    duration_sec: 10,
    rest_sec: 20,
    instructions: [
      'Lie on your back with knees bent. Perform a chin tuck first (retract the chin).',
      'Lift only your head 1–2 cm off the floor — this is not a sit-up.',
      'Hold for 10 seconds while maintaining the chin tuck. Do not let the chin poke forward.',
      'Lower slowly. Rest 20 seconds. Perform 3 sets of 10-second holds.',
    ],
    cue: 'Head barely off the floor — quality over height.',
    difficulty: 'intermediate',
    equipment: 'none',
  },
  // ── FHP: Strengthen ───────────────────────────────────────────────────────
  {
    id: 'wall_angels',
    name: 'Wall Angels',
    deviations: ['fhp', 'rounded_shoulders'],
    type: 'strengthen',
    sets: 3,
    reps: 12,
    rest_sec: 60,
    instructions: [
      'Stand with heels, hips, shoulders, and head against a wall. Arms are bent 90° (goalpost position) with forearms, elbows, and wrists touching the wall.',
      'Slowly slide arms up the wall to full overhead extension, maintaining all contact points.',
      'Slide back down to start without losing wall contact.',
      'If forearms peel away from the wall, reduce range until mobility improves.',
    ],
    cue: 'Every part of your arm must stay glued to the wall.',
    difficulty: 'beginner',
    equipment: 'wall',
  },
  // ── Rounded Shoulders: Release ────────────────────────────────────────────
  {
    id: 'thoracic_foam_roll',
    name: 'Thoracic Extension over Foam Roller',
    deviations: ['rounded_shoulders', 'fhp'],
    type: 'release',
    sets: 3,
    reps: 10,
    rest_sec: 30,
    instructions: [
      'Place a foam roller perpendicular to your spine at mid-back (T6–T8 level). Support your head with hands behind neck.',
      'Drape your thoracic spine over the roller, opening the chest toward the ceiling.',
      'Hold 2–3 seconds at the bottom, then use your abs to return to upright.',
      'Walk the roller up 1–2 inches and repeat. Cover T4–T10 in 3–4 positions.',
    ],
    cue: 'Let gravity do the work — breathe out as you open.',
    difficulty: 'beginner',
    equipment: 'foam roller',
  },
  // ── Rounded Shoulders: Stretch ────────────────────────────────────────────
  {
    id: 'lat_stretch_wall',
    name: 'Lat / Posterior Shoulder Stretch (Wall)',
    deviations: ['rounded_shoulders'],
    type: 'stretch',
    sets: 3,
    duration_sec: 30,
    rest_sec: 15,
    instructions: [
      'Stand facing a wall or door frame. Place one hand on the frame at shoulder height.',
      'Step back until your arm is fully extended and rotate your body slightly away.',
      'You should feel a stretch along the back of your shoulder and into the lat.',
      'Hold 30 seconds. Switch sides.',
    ],
    cue: 'Let your shoulder blade pull away from the spine.',
    difficulty: 'beginner',
    equipment: 'wall',
  },
  // ── Rounded Shoulders: Activate / Strengthen ─────────────────────────────
  {
    id: 'face_pulls',
    name: 'Band Face Pulls',
    deviations: ['rounded_shoulders', 'fhp'],
    type: 'strengthen',
    sets: 3,
    reps: 15,
    rest_sec: 60,
    instructions: [
      'Anchor a resistance band at face height. Hold each end with an overhand grip, arms extended.',
      'Pull the band toward your face, flaring elbows out and rotating hands so thumbs point behind you at end range.',
      'Squeeze rear delts and mid-traps for 1 second. External rotation is key.',
      'Return slowly to start under control.',
    ],
    cue: 'Think "show me your biceps" on every rep — max external rotation.',
    difficulty: 'beginner',
    equipment: 'resistance band',
  },
  {
    id: 'band_pull_aparts',
    name: 'Band Pull-Aparts',
    deviations: ['rounded_shoulders'],
    type: 'strengthen',
    sets: 3,
    reps: 20,
    rest_sec: 45,
    instructions: [
      'Hold a resistance band with both hands at shoulder height, arms straight.',
      'Pull the band apart by squeezing your shoulder blades together — bring hands out to a "T" position.',
      'Control the return. Maintain a straight spine throughout.',
      'For added difficulty, perform with arms overhead (Y pull-apart).',
    ],
    cue: 'Pinch a pencil between your shoulder blades at the end of each rep.',
    difficulty: 'beginner',
    equipment: 'resistance band',
  },
  {
    id: 'prone_ytw',
    name: 'Prone Y-T-W',
    deviations: ['rounded_shoulders', 'fhp'],
    type: 'strengthen',
    sets: 3,
    reps: 10,
    rest_sec: 60,
    instructions: [
      'Lie face down on a mat or bench with arms hanging. Keep a chin tuck throughout.',
      'Y: Raise arms to a Y shape (approximately 135°), thumbs up. Lower traps.',
      'T: Raise arms to a T shape (90°), thumbs up. Mid traps/rhomboids.',
      'W: Bend elbows to 90°, pull elbows back and down, squeezing shoulder blades. Lower traps/rotator cuff.',
    ],
    cue: 'Every position: shoulders DOWN, not shrugging.',
    difficulty: 'intermediate',
    equipment: 'none',
  },
  // ── APT: Stretch ──────────────────────────────────────────────────────────
  {
    id: 'kneeling_hip_flexor_stretch',
    name: 'Kneeling Hip Flexor Stretch (90/90)',
    deviations: ['apt'],
    type: 'stretch',
    sets: 3,
    duration_sec: 30,
    rest_sec: 15,
    instructions: [
      'Kneel on your right knee (back leg), left foot forward in a 90/90 lunge position.',
      'Tuck your pelvis under (posterior pelvic tilt) to eliminate the lower-back arch before shifting forward.',
      'Shift your hips forward until you feel a deep stretch in the front of the right hip.',
      'Hold 30 seconds. Switch sides.',
    ],
    cue: 'Squeeze the glute of the back leg and tuck the tailbone — feel the psoas lengthen.',
    difficulty: 'beginner',
    equipment: 'mat',
  },
  {
    id: 'rectus_femoris_stretch',
    name: 'Standing Rectus Femoris Stretch',
    deviations: ['apt'],
    type: 'stretch',
    sets: 3,
    duration_sec: 30,
    rest_sec: 15,
    instructions: [
      'Stand on your left leg (hold a wall for balance). Bend your right knee and grasp the ankle behind you.',
      'Tuck your pelvis posteriorly (flatten lower back) before pulling the ankle up.',
      'Keep knees together and torso upright — do not let the lower back arch.',
      'Hold 30 seconds. Switch sides.',
    ],
    cue: 'Tuck the tail before you pull — the stretch should be in the FRONT of the thigh, not the lower back.',
    difficulty: 'beginner',
    equipment: 'wall for balance',
  },
  // ── APT: Activate ─────────────────────────────────────────────────────────
  {
    id: 'dead_bug',
    name: 'Dead Bug',
    deviations: ['apt'],
    type: 'activate',
    sets: 3,
    reps: 10,
    rest_sec: 45,
    instructions: [
      'Lie on your back with arms pointing to ceiling and hips/knees at 90° (tabletop).',
      'Press your lower back firmly into the floor (imprint). Brace your core.',
      'Slowly extend your right arm overhead and left leg toward the floor simultaneously — DO NOT let the lower back arch.',
      'Return to start and alternate sides. Count each pair as 1 rep.',
    ],
    cue: 'The lower back must stay glued to the floor — if it lifts, reduce your range.',
    difficulty: 'intermediate',
    equipment: 'mat',
  },
  {
    id: 'mcgill_curl_up',
    name: 'McGill Curl-Up',
    deviations: ['apt'],
    type: 'activate',
    sets: 3,
    reps: 8,
    rest_sec: 60,
    instructions: [
      'Lie on your back. One knee bent, one leg flat. Place hands under the natural curve of your lower back (do not flatten it).',
      'Brace your core as if bracing for a punch. Do not suck in.',
      'Lift only your head and shoulders 2–3 cm off the floor — this is not a crunch.',
      'Hold 7–8 seconds. Lower slowly. McGill recommends a descending rep scheme: 6-4-2.',
    ],
    cue: 'Stiffen your entire trunk like a cylinder before you move.',
    difficulty: 'beginner',
    equipment: 'mat',
  },
  {
    id: 'hollow_body_hold',
    name: 'Hollow Body Hold',
    deviations: ['apt'],
    type: 'activate',
    sets: 3,
    duration_sec: 20,
    rest_sec: 45,
    instructions: [
      'Lie on your back, arms extended overhead, legs straight.',
      'Press your lower back into the floor. Engage your abs.',
      'Lift your shoulders and legs off the floor simultaneously, forming a banana/hollow shape.',
      'Hold for 20 seconds while maintaining a neutral (flattened) lower back.',
    ],
    cue: 'Make yourself as flat as a sheet of paper — no daylight under the lower back.',
    difficulty: 'intermediate',
    equipment: 'mat',
  },
  // ── APT: Strengthen ───────────────────────────────────────────────────────
  {
    id: 'glute_bridge',
    name: 'Glute Bridge',
    deviations: ['apt', 'knee_valgus'],
    type: 'strengthen',
    sets: 3,
    reps: 15,
    rest_sec: 45,
    instructions: [
      'Lie on your back, knees bent to 90°, feet flat on floor hip-width apart.',
      'Brace your core and squeeze your glutes. Drive through your heels to raise your hips.',
      'At the top, hips-knees-shoulders form a straight line. Hold 2 seconds.',
      'Lower slowly over 3 counts. Progress to single-leg or add a band above the knees.',
    ],
    cue: 'Squeeze the glutes like you are cracking a walnut — not just pushing with your legs.',
    difficulty: 'beginner',
    equipment: 'mat',
  },
  // ── Knee Valgus: Release ──────────────────────────────────────────────────
  {
    id: 'it_band_foam_roll',
    name: 'IT Band / TFL Foam Roll',
    deviations: ['knee_valgus'],
    type: 'release',
    sets: 2,
    duration_sec: 120,
    rest_sec: 30,
    instructions: [
      'Lie on your side with a foam roller under your outer thigh just below the hip.',
      'Support yourself on your forearm and opposite foot. Roll slowly from hip to just above the knee.',
      'Pause on tender spots for 20–30 seconds. Avoid rolling directly on the knee joint.',
      'Spend 2 minutes per side.',
    ],
    cue: 'Slow and steady — speed masks the tight spots.',
    difficulty: 'beginner',
    equipment: 'foam roller',
  },
  // ── Knee Valgus: Activate / Strengthen ───────────────────────────────────
  {
    id: 'clamshells',
    name: 'Clamshells',
    deviations: ['knee_valgus'],
    type: 'activate',
    sets: 3,
    reps: 15,
    rest_sec: 45,
    instructions: [
      'Lie on your side with hips stacked, knees bent to 45°, a resistance band above the knees (optional).',
      'Keep feet together. Rotate the top knee open toward the ceiling like a clamshell opening.',
      'Stop before your pelvis rotates backward. Hold 1 second at the top.',
      'Lower slowly. Perform 15 reps per side.',
    ],
    cue: 'Pelvis does NOT move — only the leg rotates.',
    difficulty: 'beginner',
    equipment: 'mat, optional resistance band',
  },
  {
    id: 'lateral_band_walks',
    name: 'Lateral Band Walks',
    deviations: ['knee_valgus'],
    type: 'strengthen',
    sets: 3,
    reps: 20,
    rest_sec: 60,
    instructions: [
      'Place a resistance band just above your knees. Stand with slight hip hinge, knees soft.',
      'Step laterally to the right 20 steps, then 20 steps back left. Maintain hip-width stance against band tension.',
      'Keep toes forward (do not turn out), knees tracking over toes at all times.',
      'Progress to a lower band position (ankles) for greater challenge.',
    ],
    cue: 'Short steps, constant tension on the band — never let the feet come together.',
    difficulty: 'beginner',
    equipment: 'resistance band',
  },
  {
    id: 'single_leg_squat_trx',
    name: 'Single-Leg Squat (TRX / Support)',
    deviations: ['knee_valgus'],
    type: 'strengthen',
    sets: 3,
    reps: 8,
    rest_sec: 90,
    instructions: [
      'Hold TRX handles or a stable surface for minimal support. Stand on one leg.',
      'Hinge at the hip and lower into a single-leg squat. Knee should track over the second toe.',
      'Depth: thigh parallel or just above. Keep the pelvis level (do not let the hip drop).',
      'Drive through the heel to return. Perform 8 reps per leg.',
    ],
    cue: 'Drive the knee OUT over your pinky toe — actively fight valgus collapse.',
    difficulty: 'advanced',
    equipment: 'TRX or stable surface',
  },
  // ── Flat Feet: Release ────────────────────────────────────────────────────
  {
    id: 'calf_foam_roll',
    name: 'Calf / Soleus Foam Roll',
    deviations: ['flat_feet'],
    type: 'release',
    sets: 2,
    duration_sec: 60,
    rest_sec: 30,
    instructions: [
      'Sit on the floor with a foam roller under your right calf. Cross your left ankle over your right for added pressure.',
      'Roll from the ankle up to the back of the knee using small movements. Pause on tender spots.',
      'Rotate your foot inward/outward to access different calf heads.',
      'Spend 60 seconds per side.',
    ],
    cue: 'Stack the legs to double the pressure where needed.',
    difficulty: 'beginner',
    equipment: 'foam roller',
  },
  // ── Flat Feet: Activate / Strengthen ─────────────────────────────────────
  {
    id: 'short_foot_exercise',
    name: 'Short Foot Exercise (Arch Doming)',
    deviations: ['flat_feet'],
    type: 'activate',
    sets: 3,
    duration_sec: 10,
    rest_sec: 20,
    instructions: [
      'Sit or stand barefoot. Place your foot flat on the floor.',
      'Without curling your toes, pull the ball of your foot toward your heel — this "shortens" the foot and raises the arch.',
      'Feel the intrinsic muscles of the foot activate (the arch visibly raises).',
      'Hold 10 seconds. Perform 10 holds per foot.',
    ],
    cue: 'Shorten the foot, not the toes — the toes stay relaxed and flat.',
    difficulty: 'beginner',
    equipment: 'none',
  },
  {
    id: 'towel_scrunches',
    name: 'Towel Scrunches',
    deviations: ['flat_feet'],
    type: 'activate',
    sets: 3,
    reps: 20,
    rest_sec: 30,
    instructions: [
      'Sit in a chair. Place a small towel flat on the floor under your bare foot.',
      'Scrunch the towel toward you using only your toes — arch your foot as you curl.',
      'Release fully between reps.',
      'Perform 20 scrunches per foot.',
    ],
    cue: 'Pull with your whole arch, not just the big toe.',
    difficulty: 'beginner',
    equipment: 'small towel',
  },
  {
    id: 'single_leg_calf_raise',
    name: 'Single-Leg Calf Raise',
    deviations: ['flat_feet'],
    type: 'strengthen',
    sets: 3,
    reps: 15,
    rest_sec: 60,
    instructions: [
      'Stand on one foot at the edge of a step, heel hanging off. Hold a wall for balance.',
      'Lower your heel below step level (full stretch) then rise to full tip-toe height.',
      'Control both phases: 2 seconds up, 2-second hold, 3 seconds down.',
      'Perform 15 reps per foot. Focus on preventing ankle roll-in (pronation) during the movement.',
    ],
    cue: 'Rise through your big toe side — drive the heel straight up, not inward.',
    difficulty: 'intermediate',
    equipment: 'step or stair',
  },
  {
    id: 'tibialis_raise',
    name: 'Tibialis Anterior Raise',
    deviations: ['flat_feet'],
    type: 'strengthen',
    sets: 3,
    reps: 15,
    rest_sec: 45,
    instructions: [
      'Stand with your back against a wall, heels about 30 cm from the wall.',
      'Lift the front of both feet off the floor as high as possible (dorsiflex), then lower slowly.',
      'Avoid letting your lower back peel away from the wall.',
      'Perform 15 reps. Can be progressed with a weight plate on the toes.',
    ],
    cue: 'Pull your toes toward your shins like a gas pedal on full extension.',
    difficulty: 'beginner',
    equipment: 'wall',
  },
]

export const ERGONOMIC_CHECKLIST: string[] = [
  'Monitor at arm\'s length; top of screen at or just below eye level',
  'Chair height: feet flat on floor, knees at 90°, hips at or slightly above knee level',
  'Keyboard and mouse: elbows at ~90°, wrists neutral (not bent up or down)',
  'Screen brightness matches ambient room lighting (no glare or squinting)',
  'Use headset or speakerphone — never cradle the phone between ear and shoulder',
  'Take a standing or walking break every 30–45 minutes (set a timer)',
  'Document holder placed at monitor height to avoid repetitive neck rotation',
  'Mouse placed close to keyboard — avoid reaching the shoulder into elevation',
]

export const PAIN_AREAS: string[] = [
  'Neck',
  'Upper back',
  'Lower back',
  'Left shoulder',
  'Right shoulder',
  'Left hip',
  'Right hip',
  'Left knee',
  'Right knee',
  'Left foot/ankle',
  'Right foot/ankle',
]

// ── Utility Functions ──────────────────────────────────────────────────────

export function getExercisesForDeviation(deviation: PosturalDeviation): PostureExercise[] {
  return EXERCISES.filter((e) => e.deviations.includes(deviation))
}

export function calculatePostureScore(assessment: PostureAssessment): number {
  // Lower severity = better score. Each deviation can be 0-3.
  // Max possible severity = 5 deviations × 3 = 15.
  const deviationKeys: PosturalDeviation[] = ['fhp', 'rounded_shoulders', 'apt', 'knee_valgus', 'flat_feet']
  const totalSeverity = deviationKeys.reduce((sum, key) => sum + (assessment.deviations[key] ?? 0), 0)
  const deviationScore = Math.round(((15 - totalSeverity) / 15) * 60) // 0-60 pts

  // Ergonomic score: 0-8 items → 0-30 pts
  const ergonomicScore = Math.round((assessment.ergonomic_score / 8) * 30)

  // Pain penalty: each pain area deducts 1.25 pts (max 10 pts deducted)
  const painPenalty = Math.min(assessment.pain_areas.length * 1.25, 10)

  const raw = deviationScore + ergonomicScore - painPenalty
  return Math.max(0, Math.min(100, Math.round(raw)))
}

// Orders exercises: release → stretch → activate → strengthen (Janda approach)
const TYPE_ORDER: Record<PostureExercise['type'], number> = {
  release: 0,
  stretch: 1,
  activate: 2,
  strengthen: 3,
}

export function buildCorrectionRoutine(
  assessment: PostureAssessment,
  maxMinutes = 30,
): PostureRoutine {
  const deviationKeys: PosturalDeviation[] = ['fhp', 'rounded_shoulders', 'apt', 'knee_valgus', 'flat_feet']

  // Find deviations with severity > 0, sorted worst-first
  const focusDeviations = deviationKeys
    .filter((d) => (assessment.deviations[d] ?? 0) > 0)
    .sort((a, b) => (assessment.deviations[b] ?? 0) - (assessment.deviations[a] ?? 0))

  if (focusDeviations.length === 0) {
    return { exercises: [], totalMinutes: 0, focusDeviations: [] }
  }

  // Gather candidate exercises (deduplicated by id)
  const seen = new Set<string>()
  const candidates: PostureExercise[] = []

  for (const dev of focusDeviations) {
    const severity = assessment.deviations[dev] ?? 0
    const devExercises = getExercisesForDeviation(dev)

    // For mild severity: skip advanced exercises
    const filtered = devExercises.filter((e) => {
      if (severity === 1 && e.difficulty === 'advanced') return false
      return true
    })

    for (const ex of filtered) {
      if (!seen.has(ex.id)) {
        seen.add(ex.id)
        candidates.push(ex)
      }
    }
  }

  // Sort by Janda phase order
  candidates.sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type])

  // Estimate time per exercise (seconds) and trim to maxMinutes
  function exerciseTimeSec(ex: PostureExercise): number {
    const workSec = ex.duration_sec
      ? ex.sets * ex.duration_sec
      : ex.sets * (ex.reps ?? 10) * 3 // ~3s per rep
    const restSec = (ex.sets - 1) * ex.rest_sec
    return workSec + restSec
  }

  const maxSec = maxMinutes * 60
  let totalSec = 0
  const selected: PostureExercise[] = []

  for (const ex of candidates) {
    const t = exerciseTimeSec(ex)
    if (totalSec + t <= maxSec) {
      selected.push(ex)
      totalSec += t
    }
  }

  return {
    exercises: selected,
    totalMinutes: Math.round(totalSec / 60),
    focusDeviations,
  }
}
