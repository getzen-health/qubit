import dynamic from 'next/dynamic'
const EnergyClient = dynamic(() => import('./energy-client').then(m => ({ default: m.EnergyClient })))

export const metadata = {
  title: 'Energy Journal — KQuarks',
  description: 'Track your daily energy levels and discover patterns.',
}

export default function EnergyPage() {
  return <EnergyClient />
}
