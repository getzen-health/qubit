'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  { id: 'welcome', title: 'Welcome to KQuarks', description: 'Your personal health intelligence platform' },
  { id: 'goals', title: 'What are your health goals?', description: 'Select all that apply' },
  { id: 'data', title: 'Connect your data', description: 'KQuarks works best with Apple Health' },
  { id: 'done', title: "You're all set!", description: 'Start exploring your health data' }
]

const GOALS = ['Lose weight', 'Build muscle', 'Improve sleep', 'Reduce stress', 'Run faster', 'Eat healthier', 'Track medications', 'Monitor vitals']

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const router = useRouter()

  const toggleGoal = (g: string) => setSelectedGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{STEPS[step].title}</h1>
          <p className="text-muted-foreground">{STEPS[step].description}</p>
        </div>
        {step === 1 && (
          <div className="flex flex-wrap gap-2">
            {GOALS.map(g => (
              <button key={g} onClick={() => toggleGoal(g)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedGoals.includes(g) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'}`}>
                {g}
              </button>
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border p-4">
              <p className="font-medium">📱 iOS App (Recommended)</p>
              <p className="text-sm text-muted-foreground mt-1">Download KQuarks for iOS to sync Apple Health data automatically</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="font-medium">📊 Manual Entry</p>
              <p className="text-sm text-muted-foreground mt-1">Log your health data directly on the web dashboard</p>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">Back</button>
          )}
          <button onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : router.push('/dashboard')}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            {step === STEPS.length - 1 ? 'Go to Dashboard' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
