import dynamic from 'next/dynamic'
const WalkingSpeedClient = dynamic(() => import('./walking-speed-client').then(m => ({ default: m.WalkingSpeedClient })), { ssr: false })

export const metadata = {
  title: 'Walking Speed — KQuarks',
  description:
    'Walking speed — the "sixth vital sign" — passively measured by iPhone and Apple Watch. ' +
    'Track 90-day trends, longevity thresholds, and clinical risk cut-points.',
}

export default function WalkingSpeedPage() {
  return <WalkingSpeedClient />
}
