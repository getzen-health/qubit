import type { Metadata } from 'next'
import CoachingClient from './coaching-client'

export const metadata: Metadata = {
  title: 'AI Health Coach | KQuarks',
  description: 'Real-time AI health coaching powered by Claude',
}

export default function CoachingPage() {
  return <CoachingClient />
}
