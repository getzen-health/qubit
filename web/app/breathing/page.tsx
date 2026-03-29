import dynamic from 'next/dynamic'
const BreathingClient = dynamic(() => import('./breathing-client').then(m => ({ default: m.BreathingClient })))

export const metadata = {
  title: 'Breathing & Respiratory Health — KQuarks',
  description:
    'Track resting breathing rate, MRC breathlessness scale, peak flow, and practice 6 guided breathing exercises — box breathing, 4-7-8, resonance (Russo 2017), Wim Hof, diaphragmatic, and physiological sigh.',
}

export default function BreathingPage() {
  return <BreathingClient />
}
