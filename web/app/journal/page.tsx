import { JournalClient } from './journal-client'

export const metadata = {
  title: 'Journal — KQuarks',
  description: 'Expressive writing, gratitude journaling, and CBT thought records for emotional wellness.',
}

export default function JournalPage() {
  return <JournalClient />
}
