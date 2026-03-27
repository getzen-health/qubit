"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'

const GOALS = [
  { value: 'lose_weight', label: 'Lose Weight', icon: '⚖️', desc: 'Reduce body fat and reach target weight' },
  { value: 'build_muscle', label: 'Build Muscle', icon: '💪', desc: 'Increase strength and muscle mass' },
  { value: 'improve_sleep', label: 'Better Sleep', icon: '😴', desc: 'Sleep deeper and wake refreshed' },
  { value: 'reduce_stress', label: 'Reduce Stress', icon: '🧘', desc: 'Manage stress and improve mental health' },
  { value: 'eat_healthier', label: 'Eat Healthier', icon: '🥗', desc: 'Improve nutrition and food choices' },
  { value: 'improve_fitness', label: 'Get Fitter', icon: '🏃', desc: 'Improve cardiovascular and physical fitness' },
  { value: 'manage_condition', label: 'Manage Condition', icon: '💊', desc: 'Track and manage a health condition' },
  { value: 'general_wellness', label: 'General Wellness', icon: '✨', desc: 'Overall health monitoring and awareness' },
]

const CONDITIONS = ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Arthritis', 'Anxiety/Depression', 'Thyroid Disorder', 'High Cholesterol']

const DIETARY_PREFS = ['Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Mediterranean', 'Gluten-Free', 'Dairy-Free', 'Nut Allergy']

const STEPS = ['Welcome', 'Basic Info', 'Your Goal', 'Health', 'Diet']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    age: '',
    biological_sex: '',
    height_cm: '',
    weight_kg: '',
    primary_goal: '',
    health_conditions: [] as string[],
    dietary_preferences: [] as string[],
  })
  const [saving, setSaving] = useState(false)

  function toggleArray(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
  }

  async function finish() {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        age: form.age ? parseInt(form.age) : null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        onboarding_completed: true,
      }),
    })
    // Also set initial goals
    if (form.weight_kg) {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_steps: 8000, target_sleep_hours: 8 }),
      })
    }
    router.push('/dashboard')
  }

  const progress = ((step) / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-surface">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-6 py-8 flex flex-col">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? 'bg-primary text-white' : i === step ? 'bg-primary/20 text-primary border border-primary' : 'bg-surface text-text-secondary'
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 w-6 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="flex-1">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">⚡</div>
              <h1 className="text-3xl font-bold text-text-primary mb-3">Welcome to KQuarks</h1>
              <p className="text-text-secondary text-lg mb-2">Your personal health intelligence platform</p>
              <p className="text-text-secondary text-sm">Let's take 2 minutes to set up your profile so we can personalize your experience.</p>
              <div className="mt-8 grid grid-cols-2 gap-3 text-left">
                {[
                  { icon: '📊', text: 'Track all your health metrics in one place' },
                  { icon: '🔍', text: 'Scan food products for health scores' },
                  { icon: '🤖', text: 'Get AI-powered personalized insights' },
                  { icon: '🎯', text: 'Set goals and track your progress' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-2 bg-surface border border-border rounded-xl p-3">
                    <span>{item.icon}</span>
                    <span className="text-xs text-text-secondary">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Basic Info</h2>
              <p className="text-text-secondary text-sm mb-6">Used to calculate personalized health targets. All fields optional.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Age</label>
                  <input type="number" min="13" max="120" value={form.age}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, age: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary"
                    placeholder="Your age" />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Sex</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[['male','Male 👨'],['female','Female 👩'],['other','Other'],['prefer_not_to_say','Prefer not to say']].map(([v, l]) => (
                      <button key={v} onClick={() => setForm(f => ({ ...f, biological_sex: v }))}
                        className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.biological_sex === v ? 'bg-primary/20 border-primary text-primary' : 'border-border text-text-secondary'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Height (cm)</label>
                    <input type="number" value={form.height_cm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, height_cm: e.target.value }))}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary"
                      placeholder="175" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Weight (kg)</label>
                    <input type="number" value={form.weight_kg}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, weight_kg: e.target.value }))}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary"
                      placeholder="70" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Primary Goal */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">What&apos;s your main goal?</h2>
              <p className="text-text-secondary text-sm mb-6">We&apos;ll personalize your dashboard and insights around this.</p>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map(goal => (
                  <button key={goal.value} onClick={() => setForm(f => ({ ...f, primary_goal: goal.value }))}
                    className={`p-4 rounded-xl border text-left transition-colors ${form.primary_goal === goal.value ? 'bg-primary/20 border-primary' : 'bg-surface border-border'}`}>
                    <div className="text-2xl mb-1">{goal.icon}</div>
                    <div className="font-semibold text-text-primary text-sm">{goal.label}</div>
                    <div className="text-xs text-text-secondary mt-0.5 leading-tight">{goal.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Health conditions */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Any health conditions?</h2>
              <p className="text-text-secondary text-sm mb-6">Optional — helps us provide relevant tracking features and insights.</p>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, health_conditions: toggleArray(f.health_conditions, c) }))}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-colors text-left ${form.health_conditions.includes(c) ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-border text-text-secondary'}`}>
                    {form.health_conditions.includes(c) && '✓ '}{c}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-secondary mt-4 text-center">Select all that apply. This information stays private.</p>
            </div>
          )}

          {/* Step 4: Dietary preferences */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Dietary preferences?</h2>
              <p className="text-text-secondary text-sm mb-6">Used to personalize meal plans and food scanning.</p>
              <div className="grid grid-cols-2 gap-2">
                {DIETARY_PREFS.map(d => (
                  <button key={d} onClick={() => setForm(f => ({ ...f, dietary_preferences: toggleArray(f.dietary_preferences, d) }))}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-colors text-left ${form.dietary_preferences.includes(d) ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-border text-text-secondary'}`}>
                    {form.dietary_preferences.includes(d) && '✓ '}{d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 px-4 py-3 border border-border rounded-xl text-text-secondary text-sm font-medium">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : finish()}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold text-sm">
            {saving ? 'Setting up...' : step === STEPS.length - 1 ? '🚀 Start Using KQuarks' : (
              <><span>Continue</span><ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
        {step === 0 && (
          <button onClick={() => router.push('/dashboard')} className="text-center text-xs text-text-secondary mt-3 w-full hover:underline">
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}

