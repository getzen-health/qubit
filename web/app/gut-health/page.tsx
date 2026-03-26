'use client'

import { useEffect, useState } from 'react'
import { BRISTOL_TYPES, GUT_SYMPTOMS, GutSymptom, calculateGutHealthScore, GUT_TIPS } from '@/lib/gut-health'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { TrendLine } from '@/components/TrendLine'
import { ChipInput } from '@/components/ChipInput'
import { BottomNav } from '@/components/BottomNav'

export default function GutHealthPage() {
  // State for today's log
  const [bristolType, setBristolType] = useState<number | null>(null)
  const [frequency, setFrequency] = useState(1)
  const [symptoms, setSymptoms] = useState<Partial<Record<GutSymptom, number>>>({})
  const [symptomToggles, setSymptomToggles] = useState<Partial<Record<GutSymptom, boolean>>>({})
  const [fiber, setFiber] = useState('')
  const [fermented, setFermented] = useState(false)
  const [triggerFoods, setTriggerFoods] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [weeklyScore, setWeeklyScore] = useState<any>(null)
  const [tips, setTips] = useState<string[]>([])
  const [plantFoods, setPlantFoods] = useState<string[]>([])
  const [fermentedStreak, setFermentedStreak] = useState(0)

  useEffect(() => {
    fetch('/api/gut-health').then(r => r.json()).then(res => {
      setLogs(res.logs || [])
      setWeeklyScore(res.weeklyScore)
      setTips(res.tips)
      // Calculate fermented streak
      let streak = 0
      for (let i = 0; i < (res.logs || []).length; i++) {
        if (res.logs[i].fermented_food) streak++
        else break
      }
      setFermentedStreak(streak)
    })
  }, [submitting])

  // Microbiome: 30 plants challenge
  useEffect(() => {
    const foods = localStorage.getItem('plantFoods')
    if (foods) setPlantFoods(JSON.parse(foods))
  }, [])
  useEffect(() => {
    localStorage.setItem('plantFoods', JSON.stringify(plantFoods))
  }, [plantFoods])

  const handleSubmit = async () => {
    setSubmitting(true)
    await fetch('/api/gut-health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bristol_type: bristolType,
        frequency_today: frequency,
        symptoms,
        fiber_intake_g: fiber ? parseFloat(fiber) : null,
        fermented_food: fermented,
        trigger_foods: triggerFoods,
        notes,
        logged_at: new Date().toISOString(),
      })
    })
    setSubmitting(false)
    setBristolType(null)
    setFrequency(1)
    setSymptoms({})
    setSymptomToggles({})
    setFiber('')
    setFermented(false)
    setTriggerFoods([])
    setNotes('')
  }

  // Gut tendency
  let tendency: 'constipation' | 'ideal' | 'diarrhea' = 'ideal'
  if (weeklyScore?.score !== undefined) {
    if (weeklyScore.score < 40) tendency = 'constipation'
    else if (weeklyScore.score > 80) tendency = 'ideal'
    else if (weeklyScore.score < 60) tendency = 'diarrhea'
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* A. Today's Log Card */}
      <div className="bg-surface border border-border rounded-2xl p-4 mt-4">
        <h2 className="text-lg font-semibold mb-2">Today's Gut Log</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          {BRISTOL_TYPES.map(bt => (
            <button
              key={bt.type}
              className={cn(
                'w-10 h-10 flex flex-col items-center justify-center rounded-full border-2',
                bristolType === bt.type ? 'border-primary ring-2 ring-primary' : 'border-border',
                'transition',
              )}
              style={{ background: bt.color + '22' }}
              onClick={() => setBristolType(bt.type)}
              aria-label={bt.label}
            >
              <span className="text-xl">{bt.emoji}</span>
              <span className="text-xs">{bt.type}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-text-secondary">Frequency today:</span>
          <button onClick={() => setFrequency(Math.max(1, frequency - 1))} className="px-2">-</button>
          <span>{frequency}</span>
          <button onClick={() => setFrequency(Math.min(6, frequency + 1))} className="px-2">+</button>
          <span className="text-xs text-text-secondary">(1-6+)</span>
        </div>
        <div className="mb-2">
          <span className="text-text-secondary">Symptoms:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {Object.entries(GUT_SYMPTOMS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1">
                <button
                  className={cn(
                    'px-2 py-1 rounded-full border',
                    symptomToggles[key as GutSymptom] ? 'bg-primary text-white' : 'bg-surface border-border text-text-secondary'
                  )}
                  onClick={() => setSymptomToggles(t => ({ ...t, [key]: !t[key as GutSymptom] }))}
                >{val.emoji} {val.label}</button>
                {symptomToggles[key as GutSymptom] && (
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[symptoms[key as GutSymptom] || 1]}
                    onValueChange={v => setSymptoms(s => ({ ...s, [key]: v[0] }))}
                    className="w-20"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-text-secondary">Fermented food today?</span>
          <button
            className={cn('px-3 py-1 rounded-full border', fermented ? 'bg-primary text-white' : 'bg-surface border-border text-text-secondary')}
            onClick={() => setFermented(f => !f)}
          >{fermented ? 'Yes' : 'No'}</button>
        </div>
        <div className="mb-2">
          <span className="text-text-secondary">Estimated fiber (g):</span>
          <Input
            type="number"
            min={0}
            max={100}
            value={fiber}
            onChange={e => setFiber(e.target.value)}
            className="w-24 ml-2"
          />
        </div>
        <div className="mb-2">
          <span className="text-text-secondary">Trigger foods:</span>
          <ChipInput value={triggerFoods} onChange={setTriggerFoods} placeholder="Add food..." />
        </div>
        <div className="mb-2">
          <span className="text-text-secondary">Notes:</span>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full" />
        </div>
        <Button onClick={handleSubmit} disabled={submitting || !bristolType} className="mt-2 w-full">Submit</Button>
      </div>

      {/* B. Gut Health Score Card */}
      <div className="bg-surface border border-border rounded-2xl p-4 mt-6">
        <h2 className="text-lg font-semibold mb-2">Gut Health Score</h2>
        {weeklyScore && (
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 mb-2">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#eee" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke={weeklyScore.color}
                  strokeWidth="10"
                  strokeDasharray={282.6}
                  strokeDashoffset={282.6 - (weeklyScore.score / 100) * 282.6}
                  strokeLinecap="round"
                />
                <text x="50" y="54" textAnchor="middle" fontSize="2em" fill={weeklyScore.color}>{weeklyScore.score}</text>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold" style={{ color: weeklyScore.color }}>{weeklyScore.grade}</span>
            </div>
            <div className="w-full mt-2">
              <TrendLine data={logs.map(l => l.bristol_type)} label="Bristol Type" />
            </div>
            <div className="mt-2 text-text-secondary">
              Tendency: <span className="font-semibold capitalize">{tendency}</span>
            </div>
            <div className="mt-2">
              <ul className="list-disc ml-6 text-sm">
                {tips.map(tip => <li key={tip}>{tip}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* C. Microbiome Diversity Tips */}
      <div className="bg-surface border border-border rounded-2xl p-4 mt-6">
        <h2 className="text-lg font-semibold mb-2">Microbiome Diversity</h2>
        <div className="mb-2">
          <span className="text-text-secondary">30 Plants Challenge:</span>
          <ChipInput value={plantFoods} onChange={setPlantFoods} placeholder="Add plant food..." />
          <div className="text-xs text-text-secondary mt-1">Unique this week: {plantFoods.length}/30</div>
        </div>
        <div className="mb-2">
          <span className="text-text-secondary">Fermented food streak:</span>
          <span className="ml-2 font-semibold">{fermentedStreak} days</span>
        </div>
        <div className="mb-2">
          <a href="/food/scanner" className="text-primary underline">Scan food for fiber/probiotic content</a>
        </div>
      </div>
      <BottomNav extra={[{ href: '/gut-health', label: 'Gut', icon: '🦠' }]} />
    </div>
  )
}
