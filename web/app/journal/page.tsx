import dynamic from 'next/dynamic'
const JournalClient = dynamic(() => import('./journal-client').then(m => ({ default: m.JournalClient })), { ssr: false })

export const metadata = {
  title: 'Journal — KQuarks',
  description: 'Expressive writing, gratitude journaling, and CBT thought records for emotional wellness.',
}

export default function JournalPage() {
  return <JournalClient />
}
