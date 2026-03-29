import dynamic from 'next/dynamic'
const FunctionalFitnessClient = dynamic(() => import('./functional-fitness-client').then(m => ({ default: m.FunctionalFitnessClient })), { ssr: false })

export const metadata = {
  title: 'Functional Fitness & Aging Biomarkers — KQuarks',
  description:
    'Track grip strength, gait speed, chair stand, balance, and 6-minute walk tests. Compute your Functional Age based on validated clinical research.',
}

export default function FunctionalFitnessPage() {
  return <FunctionalFitnessClient />
}
