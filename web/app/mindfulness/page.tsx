import dynamic from 'next/dynamic'
const MindfulnessClient = dynamic(() => import('./mindfulness-client').then(m => ({ default: m.MindfulnessClient })), { ssr: false })

export const metadata = {
  title: 'Mindfulness — KQuarks',
  description: 'Meditation timer, MBSR 8-week curriculum tracker, and attention quality analytics.',
}

export default function MindfulnessPage() {
  return <MindfulnessClient />
}
