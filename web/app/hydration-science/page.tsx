import type { Metadata } from 'next'
import HydrationClient from './hydration-client'

export const metadata: Metadata = {
  title: 'Hydration Science — KQuarks',
  description: 'Personalized hydration tracking with urine color scale, sweat rate calculator, and electrolyte monitoring.',
}

export default function HydrationSciencePage() {
  return <HydrationClient />
}
