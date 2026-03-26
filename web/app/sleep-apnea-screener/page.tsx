'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, ChevronRight, ExternalLink, Moon, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react'
import {
  calculateSTOPBANG,
  calculateESS,
  interpretResults,
  type STOPBANGAnswers,
  type ESS_Answers,
  type SleepApneaResult,
} from '@/lib/sleep-apnea'

// ── Types ──────────────────────────────────────────────────────────────────────

type Step = 'intro' | 'stopbang' | 'ess' | 'results'

interface HistoryEntry {
  id: string
  screened_at: string
  stopbang_score: number
  ess_score: number | null
  stopbang_risk: string
  ess_category: string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STOPBANG_QUESTIONS: { key: keyof STOPBANGAnswers; label: string; detail: string }[] = [
  { key: 'snoring', label: 'Snoring', detail: 'Do you snore loudly (louder than talking or loud enough to be heard through closed doors)?' },
  { key: 'tired', label: 'Tired', detail: 'Do you often feel tired, fatigued, or sleepy during the daytime?' },
  { key: 'observed', label: 'Observed', detail: 'Has anyone observed you stop breathing or choking/gasping during your sleep?' },
  { key: 'pressure', label: 'Pressure', detail: 'Do you have or are you being treated for high blood pressure?' },
  { key: 'bmi_over_35', label: 'BMI > 35', detail: 'Is your Body Mass Index more than 35 kg/m²?' },
  { key: 'age_over_50', label: 'Age > 50', detail: 'Are you older than 50 years?' },
  { key: 'neck_over_40', label: 'Neck size', detail: 'Is your neck circumference greater than 40 cm (men) or 38 cm (women)?' },
  { key: 'male', label: 'Male gender', detail: 'Do you identify as male?' },
]

const ESS_SCENARIOS: { key: keyof ESS_Answers; label: string }[] = [
  { key: 'reading', label: 'Sitting and reading' },
  { key: 'watching_tv', label: 'Watching TV' },
  { key: 'public_inactive', label: 'Sitting inactive in a public place (e.g. theatre or meeting)' },
  { key: 'car_passenger', label: 'As a passenger in a car for an hour without a break' },
  { key: 'afternoon_lying', label: 'Lying down to rest in the afternoon when circumstances permit' },
  { key: 'talking', label: 'Sitting and talking to someone' },
  { key: 'after_lunch', label: 'Sitting quietly after lunch without alcohol' },
  { key: 'traffic', label: 'In a car, while stopped for a few minutes in traffic' },
]

const ESS_LABELS = ['Would never doze', 'Slight chance', 'Moderate chance', 'High chance']

const DEFAULT_STOPBANG: STOPBANGAnswers = {
  snoring: false, tired: false, observed: false, pressure: false,
  bmi_over_35: false, age_over_50: false, neck_over_40: false, male: false,
}

const DEFAULT_ESS: ESS_Answers = {
  reading: 0, watching_tv: 0, public_inactive: 0, car_passenger: 0,
  afternoon_lying: 0, talking: 0, after_lunch: 0, traffic: 0,
}

// ── Risk badge ────────────────────────────────────────────────────────────────

function RiskBadge({ risk }: { risk: string }) {
  const colours: Record<string, string> = {
    Low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    Intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    High: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    Normal: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    Mild: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    Moderate: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    Severe: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${colours[risk] ?? 'bg-surface text-text-secondary'}`}>
      {risk}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SleepApneaScreenerPage() {
  const [step, setStep] = useState<Step>('intro')
  const [stopbangAnswers, setStopbangAnswers] = useState<STOPBANGAnswers>(DEFAULT_STOPBANG)
  const [essAnswers, setEssAnswers] = useState<ESS_Answers>(DEFAULT_ESS)
  const [result, setResult] = useState<SleepApneaResult | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Fetch history on mount
  useEffect(() => {
    fetch('/api/sleep-apnea')
      .then(r => r.ok ? r.json() : null)
      .then(json => json?.data && setHistory(json.data))
      .catch(() => null)
  }, [])

  function handleFinish() {
    const sb = calculateSTOPBANG(stopbangAnswers)
    const es = calculateESS(essAnswers)
    const res = interpretResults(sb, es)
    setResult(res)
    setStep('results')
    saveResult(res, stopbangAnswers, essAnswers)
  }

  async function saveResult(res: SleepApneaResult, sb: STOPBANGAnswers, es: ESS_Answers) {
    setSaving(true)
    try {
      const resp = await fetch('/api/sleep-apnea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stopbang_score: res.stopbang_score,
          ess_score: res.ess_score,
          stopbang_risk: res.stopbang_risk,
          ess_category: res.ess_category,
          answers: { stopbang: sb, ess: es },
        }),
      })
      if (resp.ok) {
        const json = await resp.json()
        if (json.data) setHistory(prev => [json.data, ...prev])
        setSaved(true)
      }
    } catch { /* non-blocking */ }
    setSaving(false)
  }

  function handleReset() {
    setStopbangAnswers(DEFAULT_STOPBANG)
    setEssAnswers(DEFAULT_ESS)
    setResult(null)
    setSaved(false)
    setStep('intro')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-surface border border-border">
            <Moon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Sleep Apnea Screener</h1>
            <p className="text-xs text-text-secondary">STOP-BANG + Epworth Sleepiness Scale</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-2xl border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-700 px-4 py-3 text-xs text-yellow-800 dark:text-yellow-300">
          ⚠️ <strong>Disclaimer:</strong> This screener is not a medical diagnosis. It is an educational tool based on validated questionnaires. Consult a physician for proper evaluation and diagnosis.
        </div>

        {/* ── INTRO ── */}
        {step === 'intro' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
              <h2 className="font-semibold text-text-primary">About this screener</h2>
              <p className="text-sm text-text-secondary">
                Obstructive Sleep Apnea (OSA) affects up to 4% of men and 2% of women. Undiagnosed OSA is associated with hypertension, cardiovascular disease, and impaired cognition.
              </p>
              <p className="text-sm text-text-secondary">
                This tool combines the <strong className="text-text-primary">STOP-BANG questionnaire</strong> (Chung et al., Anesthesiology 2008 — 93% sensitivity for moderate–severe OSA) with the <strong className="text-text-primary">Epworth Sleepiness Scale</strong> (Johns, Sleep 1991) to assess both anatomical risk factors and daytime sleepiness.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs font-semibold text-text-primary mb-1">STOP-BANG</p>
                  <p className="text-xs text-text-secondary">8 yes/no questions · ~1 min</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs font-semibold text-text-primary mb-1">Epworth Scale</p>
                  <p className="text-xs text-text-secondary">8 scenarios · 0–3 each · ~2 min</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep('stopbang')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Start Screener <ChevronRight className="w-4 h-4" />
            </button>

            {history.length > 0 && <HistorySection history={history} />}
          </div>
        )}

        {/* ── STEP 1: STOP-BANG ── */}
        {step === 'stopbang' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text-primary">Step 1 — STOP-BANG</h2>
              <span className="text-xs text-text-secondary bg-surface border border-border rounded-full px-2 py-0.5">1 of 2</span>
            </div>
            <div className="w-full bg-surface rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: '50%' }} />
            </div>

            <div className="space-y-3">
              {STOPBANG_QUESTIONS.map(({ key, label, detail }) => (
                <div
                  key={key}
                  onClick={() => setStopbangAnswers(prev => ({ ...prev, [key]: !prev[key] }))}
                  className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
                    stopbangAnswers[key]
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-surface hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">{label}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{detail}</p>
                    </div>
                    <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      stopbangAnswers[key] ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {stopbangAnswers[key] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('intro')} className="flex-1 py-2.5 rounded-2xl border border-border text-text-secondary text-sm font-medium hover:bg-surface transition-colors">
                Back
              </button>
              <button onClick={() => setStep('ess')} className="flex-1 py-2.5 rounded-2xl bg-primary text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: ESS ── */}
        {step === 'ess' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text-primary">Step 2 — Epworth Sleepiness Scale</h2>
              <span className="text-xs text-text-secondary bg-surface border border-border rounded-full px-2 py-0.5">2 of 2</span>
            </div>
            <div className="w-full bg-surface rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: '100%' }} />
            </div>
            <p className="text-xs text-text-secondary">
              How likely are you to doze off or fall asleep in the following situations? Rate each from 0 to 3.
            </p>

            <div className="space-y-3">
              {ESS_SCENARIOS.map(({ key, label }) => {
                const val = essAnswers[key]
                return (
                  <div key={key} className="rounded-2xl border border-border bg-surface p-4 space-y-3">
                    <p className="text-sm text-text-primary font-medium">{label}</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {ESS_LABELS.map((lbl, i) => (
                        <button
                          key={i}
                          onClick={() => setEssAnswers(prev => ({ ...prev, [key]: i }))}
                          className={`rounded-xl border py-2 px-1 text-xs font-medium transition-colors ${
                            val === i
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-text-secondary hover:border-primary/40'
                          }`}
                        >
                          <span className="block text-base font-bold mb-0.5">{i}</span>
                          <span className="block leading-tight">{lbl}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('stopbang')} className="flex-1 py-2.5 rounded-2xl border border-border text-text-secondary text-sm font-medium hover:bg-surface transition-colors">
                Back
              </button>
              <button onClick={handleFinish} className="flex-1 py-2.5 rounded-2xl bg-primary text-white font-semibold hover:opacity-90 transition-opacity">
                See Results
              </button>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {step === 'results' && result && (
          <div className="space-y-4">
            <h2 className="font-semibold text-text-primary">Your Results</h2>

            {/* Doctor alert */}
            {result.should_see_doctor && (
              <div className="rounded-2xl border border-red-400 bg-red-50 dark:bg-red-900/15 dark:border-red-700 px-4 py-3 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">See a doctor</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                    Your scores suggest you should consult a sleep specialist. A formal sleep study may be recommended.
                  </p>
                </div>
              </div>
            )}

            {/* Scores */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">STOP-BANG</p>
                <p className="text-3xl font-bold text-text-primary">{result.stopbang_score}<span className="text-base text-text-secondary font-normal">/8</span></p>
                <RiskBadge risk={result.stopbang_risk} />
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">Epworth</p>
                <p className="text-3xl font-bold text-text-primary">{result.ess_score}<span className="text-base text-text-secondary font-normal">/24</span></p>
                <RiskBadge risk={result.ess_category} />
              </div>
            </div>

            {/* Interpretation */}
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Interpretation</p>
              <p className="text-sm text-text-primary leading-relaxed">{result.combined_recommendation}</p>
            </div>

            {/* Resources */}
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Resources</p>
              {result.resources.map(r => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 text-sm text-primary hover:underline"
                >
                  <span>{r.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                </a>
              ))}
            </div>

            {saved && (
              <p className="text-xs text-center text-text-secondary flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Result saved to your history
              </p>
            )}
            {saving && <p className="text-xs text-center text-text-secondary">Saving…</p>}

            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-border text-text-secondary text-sm font-medium hover:bg-surface transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Take Again
            </button>

            {history.length > 0 && <HistorySection history={history} />}
          </div>
        )}
      </div>
    </div>
  )
}

// ── History section ───────────────────────────────────────────────────────────

function HistorySection({ history }: { history: HistoryEntry[] }) {
  const riskColour: Record<string, string> = {
    Low: 'text-green-600', Intermediate: 'text-yellow-600', High: 'text-red-600',
  }

  const trend = history.length >= 2
    ? history[0].stopbang_score - history[1].stopbang_score
    : null

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Screening History</p>
        {trend !== null && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trend < 0 ? 'text-green-600' : trend > 0 ? 'text-red-500' : 'text-text-secondary'}`}>
            {trend < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : null}
            {trend < 0 ? 'Improving' : trend > 0 ? 'Worsening' : 'Stable'}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {history.slice(0, 5).map(entry => (
          <div key={entry.id} className="flex items-center justify-between text-sm">
            <span className="text-text-secondary text-xs">{new Date(entry.screened_at).toLocaleDateString()}</span>
            <div className="flex items-center gap-3">
              <span className="text-text-secondary text-xs">STOP-BANG: <span className={`font-semibold ${riskColour[entry.stopbang_risk] ?? ''}`}>{entry.stopbang_score}</span></span>
              {entry.ess_score !== null && (
                <span className="text-text-secondary text-xs">ESS: <span className="font-semibold text-text-primary">{entry.ess_score}</span></span>
              )}
              <RiskBadge risk={entry.stopbang_risk} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
