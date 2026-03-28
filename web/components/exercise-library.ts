export interface Exercise {
  name: string
  muscle: string
  equipment: string
}

export const EXERCISE_LIBRARY: Exercise[] = [
  // Chest
  { name: 'Bench Press', muscle: 'Chest', equipment: 'Barbell' },
  { name: 'Incline Bench Press', muscle: 'Chest', equipment: 'Barbell' },
  { name: 'Dumbbell Flyes', muscle: 'Chest', equipment: 'Dumbbell' },
  { name: 'Push-Ups', muscle: 'Chest', equipment: 'Bodyweight' },
  { name: 'Cable Crossover', muscle: 'Chest', equipment: 'Cable' },
  { name: 'Chest Press Machine', muscle: 'Chest', equipment: 'Machine' },
  { name: 'Pec Deck', muscle: 'Chest', equipment: 'Machine' },
  // Back
  { name: 'Deadlift', muscle: 'Back', equipment: 'Barbell' },
  { name: 'Pull-Ups', muscle: 'Back', equipment: 'Bodyweight' },
  { name: 'Barbell Row', muscle: 'Back', equipment: 'Barbell' },
  { name: 'Lat Pulldown', muscle: 'Back', equipment: 'Cable' },
  { name: 'Seated Cable Row', muscle: 'Back', equipment: 'Cable' },
  { name: 'T-Bar Row', muscle: 'Back', equipment: 'Barbell' },
  { name: 'Single-Arm Dumbbell Row', muscle: 'Back', equipment: 'Dumbbell' },
  { name: 'Assisted Pull-Up', muscle: 'Back', equipment: 'Machine' },
  // Shoulders
  { name: 'Overhead Press', muscle: 'Shoulders', equipment: 'Barbell' },
  { name: 'Dumbbell Shoulder Press', muscle: 'Shoulders', equipment: 'Dumbbell' },
  { name: 'Lateral Raises', muscle: 'Shoulders', equipment: 'Dumbbell' },
  { name: 'Front Raises', muscle: 'Shoulders', equipment: 'Dumbbell' },
  { name: 'Face Pulls', muscle: 'Shoulders', equipment: 'Cable' },
  { name: 'Upright Row', muscle: 'Shoulders', equipment: 'Barbell' },
  // Biceps
  { name: 'Barbell Curl', muscle: 'Biceps', equipment: 'Barbell' },
  { name: 'Dumbbell Curl', muscle: 'Biceps', equipment: 'Dumbbell' },
  { name: 'Hammer Curl', muscle: 'Biceps', equipment: 'Dumbbell' },
  { name: 'Preacher Curl', muscle: 'Biceps', equipment: 'Barbell' },
  { name: 'Cable Curl', muscle: 'Biceps', equipment: 'Cable' },
  // Triceps
  { name: 'Tricep Dips', muscle: 'Triceps', equipment: 'Bodyweight' },
  { name: 'Skull Crushers', muscle: 'Triceps', equipment: 'Barbell' },
  { name: 'Tricep Pushdown', muscle: 'Triceps', equipment: 'Cable' },
  { name: 'Overhead Tricep Extension', muscle: 'Triceps', equipment: 'Dumbbell' },
  { name: 'Close-Grip Bench Press', muscle: 'Triceps', equipment: 'Barbell' },
  // Quads
  { name: 'Squat', muscle: 'Quads', equipment: 'Barbell' },
  { name: 'Front Squat', muscle: 'Quads', equipment: 'Barbell' },
  { name: 'Leg Press', muscle: 'Quads', equipment: 'Machine' },
  { name: 'Leg Extension', muscle: 'Quads', equipment: 'Machine' },
  { name: 'Bulgarian Split Squat', muscle: 'Quads', equipment: 'Dumbbell' },
  { name: 'Smith Machine Squat', muscle: 'Quads', equipment: 'Machine' },
  // Hamstrings
  { name: 'Romanian Deadlift', muscle: 'Hamstrings', equipment: 'Barbell' },
  { name: 'Leg Curl', muscle: 'Hamstrings', equipment: 'Machine' },
  { name: 'Good Mornings', muscle: 'Hamstrings', equipment: 'Barbell' },
  { name: 'Nordic Curl', muscle: 'Hamstrings', equipment: 'Bodyweight' },
  // Glutes
  { name: 'Hip Thrust', muscle: 'Glutes', equipment: 'Barbell' },
  { name: 'Glute Bridge', muscle: 'Glutes', equipment: 'Bodyweight' },
  { name: 'Cable Kickback', muscle: 'Glutes', equipment: 'Cable' },
  // Calves
  { name: 'Calf Raises', muscle: 'Calves', equipment: 'Machine' },
  { name: 'Seated Calf Raise', muscle: 'Calves', equipment: 'Machine' },
  // Core
  { name: 'Plank', muscle: 'Core', equipment: 'Bodyweight' },
  { name: 'Ab Wheel Rollout', muscle: 'Core', equipment: 'Bodyweight' },
  { name: 'Cable Crunch', muscle: 'Core', equipment: 'Cable' },
  { name: 'Hanging Leg Raises', muscle: 'Core', equipment: 'Bodyweight' },
  { name: 'Russian Twist', muscle: 'Core', equipment: 'Bodyweight' },
  // Olympic & Full Body
  { name: 'Power Clean', muscle: 'Full Body', equipment: 'Barbell' },
  { name: 'Hang Clean', muscle: 'Full Body', equipment: 'Barbell' },
  { name: 'Clean and Jerk', muscle: 'Full Body', equipment: 'Barbell' },
  { name: 'Snatch', muscle: 'Full Body', equipment: 'Barbell' },
  { name: 'Thruster', muscle: 'Full Body', equipment: 'Barbell' },
  { name: 'Kettlebell Swing', muscle: 'Full Body', equipment: 'Kettlebell' },
  { name: 'Turkish Get-Up', muscle: 'Full Body', equipment: 'Kettlebell' },
  { name: 'Box Jump', muscle: 'Full Body', equipment: 'Bodyweight' },
  { name: 'Battle Ropes', muscle: 'Full Body', equipment: 'Other' },
  { name: 'Farmer Carry', muscle: 'Full Body', equipment: 'Dumbbell' },
]

export const MUSCLE_GROUPS = [
  ...new Set(EXERCISE_LIBRARY.map((e) => e.muscle)),
]

export function getExercisesByMuscle(muscle: string): Exercise[] {
  return EXERCISE_LIBRARY.filter((e) => e.muscle === muscle)
}

export function searchExercises(query: string): Exercise[] {
  const q = query.toLowerCase()
  return EXERCISE_LIBRARY.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.muscle.toLowerCase().includes(q) ||
      e.equipment.toLowerCase().includes(q)
  )
}
