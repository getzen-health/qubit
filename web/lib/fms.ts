export interface FMSTest {
  id: string
  name: string
  description: string
  position: string
  scoring: {
    three: string
    two: string
    one: string
    zero: string
  }
  bilateral: boolean
  targetArea: string[]
  commonCompensations: string[]
}

export const FMS_TESTS: FMSTest[] = [
  {
    id: 'deep_squat',
    name: 'Deep Squat',
    description:
      'Assesses bilateral, symmetrical mobility of the hips, knees, and ankles. The dowel overhead simultaneously challenges thoracic spine and shoulder mobility.',
    position:
      'Stand with feet shoulder-width apart, toes pointing forward. Hold a dowel rod overhead with arms fully extended and elbows locked. Squat as deep as possible while keeping heels on the floor, knees tracking over toes, and the dowel aligned over your feet.',
    scoring: {
      three:
        'Upper torso is parallel to tibia or vertical. Femur is below horizontal. Knees are aligned with feet. Dowel is aligned over feet.',
      two: 'Unable without heel elevation: same criteria met when a 2×6 board is placed under the heels.',
      one: 'Tibia and upper torso are not parallel. Femur is not below horizontal. Knees not aligned with feet. Lumbar flexion noted.',
      zero: 'Pain is present anywhere during the test — refer to a clinician before training.',
    },
    bilateral: false,
    targetArea: ['Hip mobility', 'Knee mobility', 'Ankle dorsiflexion', 'Thoracic extension', 'Shoulder mobility'],
    commonCompensations: ['Heel rise', 'Excessive forward lean', 'Knee valgus collapse', 'Lumbar flexion', 'Arms drifting forward'],
  },
  {
    id: 'hurdle_step',
    name: 'Hurdle Step',
    description:
      'Tests stride mechanics and the functional mobility and stability of the hips, knees, and ankles in a unilateral loaded stance.',
    position:
      'Set a hurdle at tibial-tuberosity height. Stand behind it and place a dowel across your shoulders behind the neck. Step over the hurdle with one foot, touch the heel to the ground on the far side, and return without touching the hurdle. Repeat on the other side.',
    scoring: {
      three:
        'Hips, knees, and ankles remain aligned in the sagittal plane. Minimal lumbar motion. Dowel and hurdle remain parallel.',
      two: 'Alignment is lost between hips, knees, and ankles. Lumbar motion noted. Dowel and hurdle are not parallel.',
      one: 'Foot makes contact with the hurdle at any point.',
      zero: 'Pain is present anywhere during the test — refer to a clinician.',
    },
    bilateral: false,
    targetArea: ['Hip flexor mobility', 'Hip stability', 'Ankle mobility', 'Single-leg balance', 'Stride mechanics'],
    commonCompensations: ['Contralateral hip drop', 'Trunk lateral lean', 'Knee valgus', 'Foot eversion', 'Foot drag on hurdle'],
  },
  {
    id: 'inline_lunge',
    name: 'Inline Lunge',
    description:
      'Challenges torso, shoulder, hip, and ankle mobility and stability. Exposes quadriceps and hip flexor flexibility deficits and knee stability issues.',
    position:
      'Measure one tibial length from starting point. Place back foot on the line, front foot one tibial length ahead — both on the same line. Hold a dowel vertically behind your back (touching head, thoracic spine, and sacrum). Lunge until the back knee touches the floor behind the front heel. Test left and right.',
    scoring: {
      three:
        'Dowel maintains three contact points. Dowel and foot stay in the sagittal plane. No torso movement. Knee touches floor behind heel.',
      two: 'Dowel loses a contact point OR deviates from sagittal plane OR torso moves OR knee does not touch behind heel.',
      one: 'Loss of balance occurs at any point.',
      zero: 'Pain is present anywhere during the test — refer to a clinician.',
    },
    bilateral: true,
    targetArea: ['Hip flexor flexibility', 'Quad flexibility', 'Ankle mobility', 'Hip stability', 'Knee stability'],
    commonCompensations: ['Trunk forward lean', 'Hip lateral shift', 'Knee valgus', 'Heel rise', 'Dowel losing contact'],
  },
  {
    id: 'shoulder_mobility',
    name: 'Shoulder Mobility',
    description:
      'Tests bilateral shoulder ROM combining internal rotation with adduction (one arm) and external rotation with abduction (other arm) simultaneously.',
    position:
      'Stand with feet together and make a fist (thumb inside). Simultaneously reach one fist up and over the shoulder (palm out) and the other fist behind the lower back (palm out). Measure the distance between fists. Test both left-arm-up and right-arm-up. Perform a shoulder impingement clearing test (horizontal adduction with overpressure) afterward.',
    scoring: {
      three: 'Fists are within one hand-length of each other.',
      two: 'Fists are within one and a half hand-lengths of each other.',
      one: 'Fists are not within one and a half hand-lengths of each other.',
      zero: 'Pain on clearing test (horizontal impingement) — refer to a clinician.',
    },
    bilateral: true,
    targetArea: ['Shoulder internal rotation', 'Shoulder external rotation', 'Thoracic mobility', 'Scapular mobility', 'Pec minor length'],
    commonCompensations: ['Shoulder elevation shrug', 'Trunk rotation', 'Excessive elbow bend', 'Wrist extension to compensate'],
  },
  {
    id: 'aslr',
    name: 'Active Straight Leg Raise',
    description:
      'Tests active hamstring and gastroc-soleus flexibility while maintaining a stable pelvis and active extension of the opposite leg.',
    position:
      'Lie supine, arms at sides palms up, feet apart. Place a board under the knees. Raise one leg (keeping the knee straight) as high as possible without flattening the lumbar spine or moving the opposite leg. Assess the ankle position relative to anatomical landmarks. Test both sides.',
    scoring: {
      three: 'Raised ankle is between the mid-thigh and the ASIS (anterior superior iliac spine).',
      two: 'Raised ankle is between the mid-thigh and the mid-patella.',
      one: 'Raised ankle is below the mid-patella.',
      zero: 'Pain is present during the test — refer to a clinician.',
    },
    bilateral: true,
    targetArea: ['Hamstring flexibility', 'Gastroc-soleus flexibility', 'Hip flexor mobility', 'Core stability', 'Pelvic stability'],
    commonCompensations: ['Opposite leg rising', 'Pelvis rotating', 'Lumbar flattening/extension', 'Knee bending in raised leg', 'Foot plantarflexing'],
  },
  {
    id: 'trunk_stability_pushup',
    name: 'Trunk Stability Push-Up',
    description:
      'Tests reflexive core stabilisation and the ability to hold a neutral spine during a closed-chain upper body press. This is a stability test, not a strength test.',
    position:
      'Lie prone, hands at the appropriate level (men: thumbs at forehead; women: thumbs at chin). Feet together, on toes. Press up as a single rigid unit — hips must not sag, hike, or move before the spine lifts. Perform one repetition only.',
    scoring: {
      three:
        'Men: performs push-up from thumbs at forehead with body as a rigid unit. Women: performs push-up from thumbs at chin.',
      two: 'Men: performs from thumbs at chin. Women: performs from thumbs at clavicle.',
      one: 'Unable to maintain a rigid plank at the modified hand position.',
      zero: 'Pain on spinal extension clearing test — refer to a clinician.',
    },
    bilateral: false,
    targetArea: ['Reflexive core stability', 'Lumbar stabilisers', 'Shoulder stability', 'Scapular stabilisers'],
    commonCompensations: ['Hip sag', 'Lumbar extension (snake)', 'Head drop forward', 'Asymmetric push-off', 'Hip hike to initiate movement'],
  },
  {
    id: 'rotary_stability',
    name: 'Rotary Stability',
    description:
      'Tests multi-planar trunk stability during combined upper and lower extremity movements, revealing rotational control deficits.',
    position:
      'Kneel on all fours over a board (hands under shoulders, knees under hips). Simultaneously extend the same-side arm and leg (unilateral). Bring elbow and knee together over the board, then extend again. Test both sides. Perform a flexion-in-quadruped clearing test afterward.',
    scoring: {
      three:
        'Performs a correct unilateral repetition with spine parallel to board, no rocking, and elbow-to-knee touch over the board.',
      two: 'Performs correct diagonal (opposite arm and leg) repetition maintaining balance, spine parallel to board.',
      one: 'Fails the diagonal repetition or loses balance.',
      zero: 'Pain on flexion-in-quadruped clearing test — refer to a clinician.',
    },
    bilateral: true,
    targetArea: ['Rotational core stability', 'Hip extensors', 'Shoulder girdle stability', 'Multi-planar movement control'],
    commonCompensations: ['Trunk rotation', 'Hip lateral shift', 'Lumbar flexion-extension cycle', 'Loss of balance', 'Board contact lost'],
  },
]

export interface FMSScore {
  test_id: string
  score_left?: number   // 0-3, for bilateral tests
  score_right?: number  // 0-3, for bilateral tests
  score?: number        // 0-3, for unilateral tests
  pain: boolean
}

export interface FMSResult {
  scores: FMSScore[]
  total: number                      // 0-21
  risk_level: 'Low' | 'Elevated' | 'High'
  weak_links: string[]               // test names scoring ≤1
  asymmetries: string[]              // bilateral tests with L-R diff ≥1
  corrective_priorities: CorrectiveExercise[]
}

export interface CorrectiveExercise {
  for_test: string
  exercise: string
  sets_reps: string
  cue: string
  progression: string
}

export const CORRECTIVE_EXERCISES: Record<string, CorrectiveExercise[]> = {
  deep_squat: [
    {
      for_test: 'Deep Squat',
      exercise: 'Band-Assisted Ankle Dorsiflexion Mobilisation',
      sets_reps: '3 × 15 reps each side',
      cue: 'Drive knee past pinky toe over a fixed foot; feel stretch in lower calf/ankle. No heel rise.',
      progression: 'Increase band resistance → wall ankle mobilisation with load → split squat with heel elevation removed.',
    },
    {
      for_test: 'Deep Squat',
      exercise: 'Goblet Squat with Heel Elevation',
      sets_reps: '3 × 10 reps with 2-s pause at bottom',
      cue: 'Hold KB at chest, elbows track inside knees, sit tall. Reduce board height every 2 weeks.',
      progression: 'Reduce heel elevation → full goblet squat → barbell back squat.',
    },
    {
      for_test: 'Deep Squat',
      exercise: 'Thoracic Extension over Foam Roller',
      sets_reps: '2 × 10 extensions over 3 spinal segments',
      cue: 'Place roller at mid-back, hands behind head, extend backward over roller without lumbar compensation.',
      progression: 'Increase range → thoracic rotation in extension → overhead reach with rotation.',
    },
  ],
  hurdle_step: [
    {
      for_test: 'Hurdle Step',
      exercise: 'Single-Leg Balance with Contralateral Hip Reach',
      sets_reps: '3 × 20 s each side',
      cue: 'Stand on one leg, reach opposite hip forward, keep stance knee soft. Think "tall hip" on the standing side.',
      progression: 'Add reach to floor → unstable surface → eyes closed.',
    },
    {
      for_test: 'Hurdle Step',
      exercise: 'Kneeling Hip Flexor Stretch (Half-Kneeling)',
      sets_reps: '3 × 30 s each side',
      cue: 'Posterior pelvic tilt (tuck tailbone) before lunging forward. Feel stretch in front of back hip, not low back.',
      progression: 'Add arm reach overhead → rotate toward front leg → dynamic rocking.',
    },
    {
      for_test: 'Hurdle Step',
      exercise: 'Gastroc-Soleus Calf Stretch',
      sets_reps: '2 × 30 s per position (straight and bent knee) each side',
      cue: 'Straight knee targets gastroc, bent knee targets soleus. Keep heel fully on floor throughout.',
      progression: 'Eccentric heel drops off step edge × 15 reps.',
    },
  ],
  inline_lunge: [
    {
      for_test: 'Inline Lunge',
      exercise: 'Kneeling Hip Flexor Stretch with Posterior Pelvic Tilt',
      sets_reps: '3 × 30 s each side',
      cue: 'Squeeze glute of the rear leg, tuck pelvis. Avoid arching the back. Think "proud chest".',
      progression: 'Add lateral thoracic reach → arm elevation overhead.',
    },
    {
      for_test: 'Inline Lunge',
      exercise: 'Lateral Band Walk',
      sets_reps: '3 × 15 steps each direction',
      cue: 'Keep toes forward, stay in quarter-squat. Feel burn in outer glutes, not knees.',
      progression: 'Increase band resistance → cross-under walk → monster walk.',
    },
    {
      for_test: 'Inline Lunge',
      exercise: 'Reverse Lunge with Dowel Overhead',
      sets_reps: '3 × 8 reps each side',
      cue: 'Hold dowel overhead, elbows locked. Step back, touch knee behind front heel. No trunk deviation.',
      progression: 'Increase step cadence → add weight → Inline Lunge retest.',
    },
  ],
  shoulder_mobility: [
    {
      for_test: 'Shoulder Mobility',
      exercise: 'Sleeper Stretch',
      sets_reps: '3 × 30 s each side',
      cue: 'Lie on restricted shoulder. Flex elbow 90°, use other hand to rotate forearm toward floor. Feel stretch in posterior capsule, not pain.',
      progression: 'Add cross-body horizontal adduction hold after sleeper stretch.',
    },
    {
      for_test: 'Shoulder Mobility',
      exercise: 'Wall Slide with Posterior Capsule Bias',
      sets_reps: '3 × 10 reps',
      cue: 'Stand facing wall, forearms on wall. Slide arms up maintaining forearm and wrist contact. Engage lower traps, depress scapulae as arms rise.',
      progression: 'Band overhead reach → floor press to full overhead press.',
    },
    {
      for_test: 'Shoulder Mobility',
      exercise: 'Doorway Pec Stretch (90-90 Position)',
      sets_reps: '2 × 30 s each arm-angle position',
      cue: 'Place forearm on door frame at 90°, step through until you feel stretch across front of chest. Keep ribs down.',
      progression: 'Bilateral pec stretch → increase arm angle to 135° for lower pec.',
    },
  ],
  aslr: [
    {
      for_test: 'Active Straight Leg Raise',
      exercise: 'Supine Towel-Assisted Hamstring Stretch',
      sets_reps: '3 × 30 s each side',
      cue: 'Loop towel around foot. Straighten knee to point of tension, not pain. Maintain neutral lumbar spine.',
      progression: 'Contract-relax (10-s hold → relax → reach farther) → standing single-leg RDL.',
    },
    {
      for_test: 'Active Straight Leg Raise',
      exercise: 'Dead Bug (Anti-Extension Core)',
      sets_reps: '3 × 6 slow reps each side',
      cue: 'Press lower back into floor throughout. Lower opposite arm and leg simultaneously. No back arching.',
      progression: 'Band-resisted dead bug → dead bug with weight → hollow body holds.',
    },
    {
      for_test: 'Active Straight Leg Raise',
      exercise: 'Standing Bent-Knee Soleus Stretch',
      sets_reps: '2 × 30 s each side',
      cue: 'Stagger stance, bend back knee toward floor keeping heel down. Feel stretch in lower calf/Achilles region.',
      progression: 'Eccentric calf drops × 15 reps.',
    },
  ],
  trunk_stability_pushup: [
    {
      for_test: 'Trunk Stability Push-Up',
      exercise: 'Bird-Dog (Contralateral Arm-Leg)',
      sets_reps: '3 × 8 reps each side',
      cue: 'From all-fours, extend opposite arm and leg without rotating the pelvis. Hold 2 s at top. No lumbar sag.',
      progression: 'Add band resistance → bird-dog rows → RDL with KB.',
    },
    {
      for_test: 'Trunk Stability Push-Up',
      exercise: 'Dead Bug',
      sets_reps: '3 × 6 reps each side, 3-s lowering',
      cue: 'Exhale, flatten lower back to floor. Lower opposite arm-leg pair slowly. Never lose lumbar contact.',
      progression: 'Band-resisted → weight plate on abs → hollow body plank.',
    },
    {
      for_test: 'Trunk Stability Push-Up',
      exercise: 'Push-Up Plank Hold (Kneeling Progression)',
      sets_reps: '3 × 20–30 s',
      cue: 'Rigid body from head to knees/toes. Squeeze glutes, brace abs. No hip sag. Progress hand position backward weekly.',
      progression: 'Kneeling plank → full plank → push-up with 2-s pause at bottom.',
    },
  ],
  rotary_stability: [
    {
      for_test: 'Rotary Stability',
      exercise: 'Bird-Dog with Board',
      sets_reps: '3 × 6 reps each side, 3-s hold',
      cue: 'Keep hips level throughout — imagine a glass of water on your lower back. Unilateral same-side before diagonal.',
      progression: 'Add cable/band resistance → slow tempo → dynamic bird-dog rows.',
    },
    {
      for_test: 'Rotary Stability',
      exercise: 'Bear Crawl',
      sets_reps: '3 × 10 m forward + 10 m backward',
      cue: 'Knees hover 2–4 cm off ground. Opposite hand and foot move together. Spine stays parallel to floor.',
      progression: 'Add band resistance around waist → pause every step → faster tempo.',
    },
    {
      for_test: 'Rotary Stability',
      exercise: 'Pallof Press (Anti-Rotation)',
      sets_reps: '3 × 10 reps each side',
      cue: 'Stand sideways to cable/band anchor. Press handles straight out, hold 2 s, resist rotation. Brace before pressing.',
      progression: 'Increase resistance → overhead Pallof press → tall-kneeling Pallof.',
    },
  ],
}

function getEffectiveScore(s: FMSScore): number {
  if (s.pain) return 0
  if (s.score_left !== undefined && s.score_right !== undefined) {
    return Math.min(s.score_left, s.score_right)
  }
  return s.score ?? 0
}

export function detectAsymmetries(scores: FMSScore[]): string[] {
  const result: string[] = []
  for (const s of scores) {
    if (s.pain) continue
    if (s.score_left !== undefined && s.score_right !== undefined) {
      if (Math.abs(s.score_left - s.score_right) >= 1) {
        const test = FMS_TESTS.find((t) => t.id === s.test_id)
        if (test) result.push(test.name)
      }
    }
  }
  return result
}

export function calculateFMS(scores: FMSScore[]): FMSResult {
  let total = 0
  const weak_links: string[] = []

  for (const s of scores) {
    const eff = getEffectiveScore(s)
    total += eff
    if (eff <= 1) {
      const test = FMS_TESTS.find((t) => t.id === s.test_id)
      if (test) weak_links.push(test.name)
    }
  }

  const risk_level: FMSResult['risk_level'] =
    total >= 15 ? 'Low' : total >= 12 ? 'Elevated' : 'High'

  const asymmetries = detectAsymmetries(scores)

  // Collect correctives for tests with effective score ≤ 2, worst first
  const needsCorrectives = scores
    .map((s) => ({ s, eff: getEffectiveScore(s) }))
    .filter(({ eff }) => eff <= 2)
    .sort((a, b) => a.eff - b.eff)

  const corrective_priorities: CorrectiveExercise[] = []
  const seen = new Set<string>()
  for (const { s } of needsCorrectives) {
    const exercises = CORRECTIVE_EXERCISES[s.test_id] ?? []
    for (const ex of exercises) {
      if (!seen.has(ex.exercise)) {
        seen.add(ex.exercise)
        corrective_priorities.push(ex)
      }
    }
  }

  return { scores, total, risk_level, weak_links, asymmetries, corrective_priorities }
}
