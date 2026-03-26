'use client'
import { useEffect, useState } from 'react'
import { ReadinessCard } from '@/components/readiness-card'

export default function ReadinessPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/readiness')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Readiness & Recovery</h1>
      <p className="text-text-secondary mb-6">Your daily readiness score helps you understand how prepared your body is for activity, based on heart rate variability (HRV), sleep, resting heart rate, and recent activity strain. Inspired by Oura and Whoop.</p>
      <ReadinessCard />
      {loading ? null : data && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Breakdown</h2>
          <ul className="mb-4 text-sm text-text-secondary">
            <li><b>HRV</b>: Compares today's HRV to your 30-day average. Higher is better.</li>
            <li><b>Sleep</b>: Measures last night's sleep vs your target.</li>
            <li><b>Resting HR</b>: Lower than your 30-day average is better.</li>
            <li><b>Strain</b>: Looks at your activity calories over the last 3 days.</li>
          </ul>
          <h3 className="font-semibold mb-1">Factors</h3>
          <ul className="list-disc ml-6 text-sm">
            {data.factors.map((f: string, i: number) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
