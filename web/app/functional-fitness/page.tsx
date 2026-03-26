import { FunctionalFitnessClient } from './functional-fitness-client'

export const metadata = {
  title: 'Functional Fitness & Aging Biomarkers — KQuarks',
  description:
    'Track grip strength, gait speed, chair stand, balance, and 6-minute walk tests. Compute your Functional Age based on validated clinical research.',
}

export default function FunctionalFitnessPage() {
  return <FunctionalFitnessClient />
}
