import Link from 'next/link'

export default function VoiceHelpPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-4">Voice Logging Help</h1>
      <p className="mb-6 text-text-secondary">You can log health data hands-free using your voice. Try these commands:</p>
      <ul className="mb-8 space-y-3">
        <li><span className="font-mono bg-surface px-2 py-1 rounded">log 500ml water</span> / <span className="font-mono bg-surface px-2 py-1 rounded">drank 2 cups of water</span></li>
        <li><span className="font-mono bg-surface px-2 py-1 rounded">mood is 7</span> / <span className="font-mono bg-surface px-2 py-1 rounded">feeling 8 out of 10</span></li>
        <li><span className="font-mono bg-surface px-2 py-1 rounded">weigh 72 kg</span></li>
        <li><span className="font-mono bg-surface px-2 py-1 rounded">ran 5k in 28 minutes</span> / <span className="font-mono bg-surface px-2 py-1 rounded">30 minute yoga</span></li>
        <li><span className="font-mono bg-surface px-2 py-1 rounded">slept 7.5 hours</span></li>
        <li><span className="font-mono bg-surface px-2 py-1 rounded">had oatmeal for breakfast</span></li>
      </ul>
      <Link href="/dashboard" className="text-primary underline">Back to dashboard</Link>
    </div>
  )
}
