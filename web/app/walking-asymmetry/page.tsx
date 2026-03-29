import dynamic from 'next/dynamic'
const WalkingAsymmetryClient = dynamic(() => import('./walking-asymmetry-client').then(m => ({ default: m.WalkingAsymmetryClient })))

export const metadata = {
  title: 'Walking Asymmetry — KQuarks',
  description:
    'Analyse left–right step-timing imbalance passively measured by iPhone and Apple Watch. ' +
    'Track 90-day trends and clinical risk thresholds.',
}

export default function WalkingAsymmetryPage() {
  return <WalkingAsymmetryClient />
}
