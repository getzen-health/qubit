import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Score weights
const WEIGHTS = {
  steps: 20,
  sleep: 20,
  water: 15,
  workout: 20,
  mood: 15,
  stress: 10,
};

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function grade(score: number) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export async function GET() {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0,0,0,0);
  const iso = today.toISOString();

  // Steps
  const { data: stepsData } = await supabase
    .from('health_metrics')
    .select('steps')
    .eq('date', iso)
    .single();
  const steps = stepsData?.steps ?? 0;
  // 10,000 steps = full points
  const stepsPoints = clamp((steps / 10000) * WEIGHTS.steps, 0, WEIGHTS.steps);

  // Sleep
  const { data: sleepData } = await supabase
    .from('sleep_records')
    .select('hours')
    .eq('date', iso)
    .single();
  const sleep = sleepData?.hours ?? 0;
  // 8h = full points
  const sleepPoints = clamp((sleep / 8) * WEIGHTS.sleep, 0, WEIGHTS.sleep);

  // Water
  const { data: waterData } = await supabase
    .from('water_logs')
    .select('amount')
    .eq('date', iso)
    .single();
  const water = waterData?.amount ?? 0;
  // 2.5L = full points
  const waterPoints = clamp((water / 2.5) * WEIGHTS.water, 0, WEIGHTS.water);

  // Workout
  const { data: workoutData } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('date', iso)
    .maybeSingle();
  const workout = !!workoutData;
  const workoutPoints = workout ? WEIGHTS.workout : 0;

  // Mood
  const { data: moodData } = await supabase
    .from('mood_logs')
    .select('score')
    .eq('date', iso)
    .single();
  const mood = moodData?.score ?? 0;
  // 10 = full points
  const moodPoints = clamp((mood / 10) * WEIGHTS.mood, 0, WEIGHTS.mood);

  // Stress (inverse)
  const { data: stressData } = await supabase
    .from('stress_logs')
    .select('score')
    .eq('date', iso)
    .single();
  const stress = stressData?.score ?? 10;
  // 0 = full points, 10 = 0 points
  const stressPoints = clamp(((10 - stress) / 10) * WEIGHTS.stress, 0, WEIGHTS.stress);

  const components = {
    steps: { value: steps, points: Math.round(stepsPoints), max: WEIGHTS.steps },
    sleep: { value: sleep, points: Math.round(sleepPoints), max: WEIGHTS.sleep },
    water: { value: water, points: Math.round(waterPoints), max: WEIGHTS.water },
    workout: { value: workout, points: Math.round(workoutPoints), max: WEIGHTS.workout },
    mood: { value: mood, points: Math.round(moodPoints), max: WEIGHTS.mood },
    stress: { value: stress, points: Math.round(stressPoints), max: WEIGHTS.stress },
  };
  const score = Object.values(components).reduce((sum, c) => sum + c.points, 0);
  return NextResponse.json({ score, components, grade: grade(score) });
}
