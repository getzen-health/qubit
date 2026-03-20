import { ExerciseBloodPressureClient } from './exercise-blood-pressure-client'

export const metadata = {
  title: 'Exercise & Blood Pressure — KQuarks',
  description:
    'Analyzing whether your training habits are producing a measurable reduction in resting blood pressure. ' +
    '90-day BP trend, exercise volume correlation, AHA 2017 classification, and evidence-based exercise prescription.',
}

export default function ExerciseBloodPressurePage() {
  return <ExerciseBloodPressureClient />
}
