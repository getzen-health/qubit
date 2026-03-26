import { MentalWellbeingClient } from './mental-wellbeing-client'

export const metadata = {
  title: 'Mental Wellbeing — KQuarks',
  description:
    'Track your mental health with PHQ-9, GAD-7, WHO-5, PERMA model, and CD-RISC-10 resilience. Positive psychology interventions and mood logging.',
}

export default function MentalWellbeingPage() {
  return <MentalWellbeingClient />
}
