"use client"
import { useEffect, useState } from 'react'
import { findInteractions, type Interaction, type InteractionSeverity } from '@/lib/supplement-interactions'
import { CheckCircle, AlertTriangle, XCircle, Info, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const SEVERITY_CONFIG: Record<InteractionSeverity, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
  beneficial: { icon: <CheckCircle className="w-5 h-5 text-green-500" />, bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-400', label: 'Beneficial' },
  neutral: { icon: <Info className="w-5 h-5 text-text-secondary" />, bg: 'bg-surface border-border', text: 'text-text-secondary', label: 'Neutral' },
  caution: { icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />, bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', label: 'Caution' },
  avoid: { icon: <XCircle className="w-5 h-5 text-red-500" />, bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', label: 'Avoid' },
}

export default function SupplementInteractionsPage() {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [suppCount, setSuppCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/supplements')
      .then(r => r.json())
      .then(({ data }) => {
        const names = (data ?? []).map((s: { name: string }) => s.name)
        setSuppCount(names.length)
        setInteractions(findInteractions(names))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/supplements" className="flex items-center gap-2 text-text-secondary text-sm mb-6 hover:text-text-primary">
        <ArrowLeft className="w-4 h-4" /> Back to Supplements
      </Link>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Interaction Checker</h1>
      <p className="text-text-secondary text-sm mb-6">Analyzing {suppCount} supplement{suppCount !== 1 ? 's' : ''} in your stack</p>

      {loading && <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-surface rounded-xl" />)}</div>}

      {!loading && interactions.length === 0 && (
        <div className="flex flex-col items-center py-12 gap-3">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <p className="font-semibold text-text-primary">No interactions found</p>
          <p className="text-sm text-text-secondary text-center">Your current supplement stack looks clear. Always consult your doctor for medical advice.</p>
        </div>
      )}

      {!loading && ['avoid', 'caution', 'beneficial', 'neutral'].map(sev => {
        const items = interactions.filter(i => i.severity === sev)
        if (items.length === 0) return null
        const cfg = SEVERITY_CONFIG[sev as InteractionSeverity]
        return (
          <div key={sev} className="mb-4">
            <h2 className={`text-sm font-semibold uppercase tracking-wide mb-2 ${cfg.text}`}>{cfg.label}</h2>
            <div className="space-y-2">
              {items.map((i, idx) => (
                <div key={idx} className={`rounded-xl border p-4 ${cfg.bg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {cfg.icon}
                    <span className="font-medium text-text-primary">{i.supp1} + {i.supp2}</span>
                  </div>
                  <p className="text-sm text-text-secondary pl-7">{i.description}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      <p className="text-xs text-text-secondary mt-8 text-center">Not medical advice. Consult a healthcare provider before changing your supplement regimen.</p>
    </div>
  )
}
