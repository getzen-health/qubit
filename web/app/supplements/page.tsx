'use client'
import { useState, useEffect } from 'react'
import { SUPPLEMENT_DB, TIMING_SLOT_LABELS, TIMING_SLOT_EMOJI, lookupSupplement, checkInteractions, TimingSlot, SupplementInfo } from '@/lib/supplements'
import {
  SUPPLEMENT_RECOMMENDATIONS,
  getRecommendations,
  stackScore,
  HealthGoal,
  DietPattern,
  SupplementRecommendation,
  RecommendedStack,
} from '@/lib/supplement-recommender'

type UserSupplement = {
  id: string
  supplement_name: string
  dosage: string
  timing_slots: TimingSlot[]
  active: boolean
}

const GOAL_META: Record<HealthGoal, { label: string; emoji: string }> = {
  muscle:    { label: 'Muscle', emoji: '💪' },
  sleep:     { label: 'Sleep', emoji: '😴' },
  stress:    { label: 'Stress', emoji: '🧘' },
  heart:     { label: 'Heart', emoji: '❤️' },
  brain:     { label: 'Brain', emoji: '🧠' },
  gut:       { label: 'Gut', emoji: '🦠' },
  energy:    { label: 'Energy', emoji: '⚡' },
  longevity: { label: 'Longevity', emoji: '🧬' },
  immunity:  { label: 'Immunity', emoji: '🛡️' },
  hormones:  { label: 'Hormones', emoji: '🔬' },
  weight:    { label: 'Weight', emoji: '⚖️' },
}

const DIET_META: Record<DietPattern, { label: string; emoji: string }> = {
  omnivore:    { label: 'Omnivore', emoji: '🍖' },
  vegetarian:  { label: 'Vegetarian', emoji: '🥗' },
  vegan:       { label: 'Vegan', emoji: '🌱' },
  carnivore:   { label: 'Carnivore', emoji: '🥩' },
  keto:        { label: 'Keto', emoji: '🥑' },
}

const EVIDENCE_COLORS: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800',
  B: 'bg-sky-100 text-sky-800',
  C: 'bg-purple-100 text-purple-800',
}

function EvidenceBadge({ grade }: { grade: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold ${EVIDENCE_COLORS[grade] ?? ''}`}>
      Grade {grade}
    </span>
  )
}

function SupplementCard({
  rec,
  onAdd,
  adding,
}: {
  rec: SupplementRecommendation
  onAdd: (rec: SupplementRecommendation) => void
  adding: boolean
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{rec.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{rec.name}</div>
          <div className="text-xs text-text-secondary">{rec.dose} · {rec.timing}</div>
        </div>
        <EvidenceBadge grade={rec.evidence} />
      </div>
      <p className="text-xs text-text-secondary leading-snug">{rec.evidence_summary}</p>
      {rec.interaction_notes && (
        <p className="text-xs text-sky-600 leading-snug">ℹ️ {rec.interaction_notes}</p>
      )}
      {rec.contraindications.length > 0 && (
        <p className="text-xs text-amber-700 leading-snug">⚠️ {rec.contraindications.join('; ')}</p>
      )}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-text-secondary">{rec.monthly_cost_usd}/mo</span>
        <button
          onClick={() => onAdd(rec)}
          disabled={adding}
          className="px-3 py-1 rounded-xl bg-primary text-white text-xs font-semibold disabled:opacity-50"
        >
          {adding ? 'Adding…' : '+ Add to Stack'}
        </button>
      </div>
    </div>
  )
}

function RecommenderTab({ currentSupplements }: { currentSupplements: UserSupplement[] }) {
  const [selectedGoals, setSelectedGoals] = useState<HealthGoal[]>([])
  const [diet, setDiet] = useState<DietPattern>('omnivore')
  const [result, setResult] = useState<RecommendedStack | null>(null)
  const [adding, setAdding] = useState<string | null>(null)
  const [added, setAdded] = useState<Set<string>>(new Set())

  const allGoals = Object.keys(GOAL_META) as HealthGoal[]
  const currentNames = currentSupplements.filter(s => s.active).map(s => s.supplement_name)
  const score = result ? stackScore(currentNames) : null

  function toggleGoal(g: HealthGoal) {
    setSelectedGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  function handleGetStack() {
    if (selectedGoals.length === 0) return
    const stack = getRecommendations(selectedGoals, diet, currentNames)
    setResult(stack)
  }

  async function handleAdd(rec: SupplementRecommendation) {
    setAdding(rec.name)
    try {
      await fetch('/api/supplements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplement_name: rec.name,
          dosage: rec.dose,
          timing_slots: ['breakfast'],
        }),
      })
      setAdded(prev => new Set([...prev, rec.name]))
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Goal selector */}
      <div>
        <h2 className="font-semibold mb-3">1. Select your health goals</h2>
        <div className="flex flex-wrap gap-2">
          {allGoals.map(g => {
            const meta = GOAL_META[g]
            const active = selectedGoals.includes(g)
            return (
              <button
                key={g}
                onClick={() => toggleGoal(g)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-sm font-medium transition-colors
                  ${active ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-text-secondary hover:border-primary/50'}`}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Diet selector */}
      <div>
        <h2 className="font-semibold mb-3">2. Diet pattern</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DIET_META) as DietPattern[]).map(d => {
            const meta = DIET_META[d]
            return (
              <button
                key={d}
                onClick={() => setDiet(d)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-sm font-medium transition-colors
                  ${diet === d ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-text-secondary hover:border-primary/50'}`}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div>
        <button
          onClick={handleGetStack}
          disabled={selectedGoals.length === 0}
          className="px-6 py-2.5 rounded-2xl bg-primary text-white font-bold disabled:opacity-40"
        >
          Get My Stack →
        </button>
        {selectedGoals.length === 0 && (
          <span className="ml-3 text-sm text-text-secondary">Select at least one goal</span>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Priority guidance */}
          {result.priority_order.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <div className="font-bold text-emerald-900 mb-1">🚀 Start with these {result.priority_order.length}</div>
              <ol className="list-decimal list-inside text-sm text-emerald-800 space-y-0.5">
                {result.priority_order.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ol>
              <div className="mt-2 text-xs text-emerald-700">Estimated total: {result.total_monthly_cost}/month for full stack</div>
            </div>
          )}

          {/* Essential */}
          {result.essential.length > 0 && (
            <div>
              <h3 className="font-bold text-emerald-700 mb-3">✅ Essential ({result.essential.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.essential.map(rec => (
                  <SupplementCard
                    key={rec.name}
                    rec={rec}
                    onAdd={handleAdd}
                    adding={adding === rec.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Beneficial */}
          {result.beneficial.length > 0 && (
            <div>
              <h3 className="font-bold text-teal-700 mb-3">🌟 Beneficial ({result.beneficial.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.beneficial.map(rec => (
                  <SupplementCard
                    key={rec.name}
                    rec={rec}
                    onAdd={handleAdd}
                    adding={adding === rec.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Experimental */}
          {result.experimental.length > 0 && (
            <div>
              <h3 className="font-bold text-purple-700 mb-3">🔬 Experimental ({result.experimental.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.experimental.map(rec => (
                  <SupplementCard
                    key={rec.name}
                    rec={rec}
                    onAdd={handleAdd}
                    adding={adding === rec.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Avoid */}
          {result.avoid.length > 0 && (
            <div>
              <h3 className="font-bold text-red-700 mb-3">🚫 Do Not Add ({result.avoid.length})</h3>
              <div className="space-y-2">
                {result.avoid.map(a => (
                  <div key={a.name} className="bg-red-50 border border-red-200 rounded-2xl px-4 py-2 text-sm">
                    <span className="font-bold text-red-800">{a.name}:</span>{' '}
                    <span className="text-red-700">{a.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stack score for current stack */}
          {score && (
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
              <h3 className="font-bold mb-2">📊 Current Stack Analysis</h3>
              <div className="flex gap-4 flex-wrap text-sm">
                <div>
                  <span className="text-text-secondary">Goal coverage: </span>
                  <span className="font-bold">{score.coverage}%</span>
                </div>
                <div>
                  <span className="text-text-secondary">Interaction risk: </span>
                  <span className={`font-bold ${score.interaction_risk === 'Low' ? 'text-emerald-700' : score.interaction_risk === 'Medium' ? 'text-amber-700' : 'text-red-700'}`}>
                    {score.interaction_risk}
                  </span>
                </div>
              </div>
              {score.redundancies.length > 0 && (
                <div className="text-xs text-amber-700">⚠️ Redundancies: {score.redundancies.join('; ')}</div>
              )}
              {score.gaps.length > 0 && (
                <div className="text-xs text-text-secondary">Uncovered goals: {score.gaps.join(', ')}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function groupBySlot(supps: UserSupplement[]): Record<TimingSlot, UserSupplement[]> {
  const slots: Record<TimingSlot, UserSupplement[]> = {
    wake: [], breakfast: [], pre_workout: [], post_workout: [], lunch: [], dinner: [], bedtime: []
  }
  for (const s of supps) {
    for (const slot of s.timing_slots) {
      slots[slot]?.push(s)
    }
  }
  return slots
}

export default function SupplementsPage() {
  const [tab, setTab] = useState<'schedule'|'list'|'recommender'>('schedule')
  const [supplements, setSupplements] = useState<UserSupplement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SupplementInfo|null>(null)
  const [dosage, setDosage] = useState('')
  const [timing, setTiming] = useState<TimingSlot[]>([])

  useEffect(() => {
    fetch('/api/supplements').then(r => r.json()).then(setSupplements).finally(() => setLoading(false))
  }, [])

  function handleAdd() {
    if (!selected || !dosage || timing.length === 0) return
    fetch('/api/supplements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplement_name: selected.name, dosage, timing_slots: timing })
    }).then(r => r.json()).then(s => {
      setSupplements([...supplements, s])
      setShowModal(false)
      setSelected(null)
      setDosage('')
      setTiming([])
    })
  }

  function handleDelete(id: string) {
    fetch('/api/supplements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).then(() => setSupplements(supplements.filter(s => s.id !== id)))
  }

  const slotGroups = groupBySlot(supplements.filter(s => s.active))
  const stackNames = supplements.filter(s => s.active).map(s => s.supplement_name)
  const interactions = checkInteractions(stackNames)

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Supplement Timing Optimizer</h1>
      <div className="flex gap-2 mb-4">
        <button className={`px-3 py-1 rounded-2xl ${tab==='schedule'?'bg-primary text-white':'bg-surface border border-border text-text-secondary'}`} onClick={()=>setTab('schedule')}>My Schedule</button>
        <button className={`px-3 py-1 rounded-2xl ${tab==='list'?'bg-primary text-white':'bg-surface border border-border text-text-secondary'}`} onClick={()=>setTab('list')}>My Supplements</button>
        <button className={`px-3 py-1 rounded-2xl ${tab==='recommender'?'bg-primary text-white':'bg-surface border border-border text-text-secondary'}`} onClick={()=>setTab('recommender')}>✨ Recommender</button>
        <button className="ml-auto px-3 py-1 rounded-2xl bg-primary text-white" onClick={()=>setShowModal(true)}>+ Add Supplement</button>
      </div>
      {tab==='schedule' && (
        <div>
          {Object.entries(TIMING_SLOT_LABELS).map(([slot, label]) => (
            <div key={slot} className="mb-4">
              <div className="flex items-center gap-2 mb-1 text-lg font-semibold">
                <span>{TIMING_SLOT_EMOJI[slot as TimingSlot]}</span>
                <span>{label}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {slotGroups[slot as TimingSlot].length === 0 && <span className="text-text-secondary">None</span>}
                {slotGroups[slot as TimingSlot].map(s => {
                  const info = lookupSupplement(s.supplement_name) || SUPPLEMENT_DB.find(x=>x.name===s.supplement_name)
                  return (
                    <div key={s.id} className="bg-surface border border-border rounded-2xl p-3 flex flex-col min-w-[180px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{info?.emoji}</span>
                        <span className="font-bold">{s.supplement_name}</span>
                      </div>
                      <div className="text-text-secondary text-sm mb-1">{s.dosage}</div>
                      <div className="flex gap-1 mb-1">
                        {info?.takWithFood && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">With food</span>}
                        {info?.takWithFat && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">With fat</span>}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">Evidence</span>
                        <span className="text-text-secondary">{info?.citation}</span>
                      </div>
                      <div className="text-xs mt-1 text-text-secondary">{info?.notes}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {tab==='list' && (
        <div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary">
                <th className="text-left">Supplement</th>
                <th>Dosage</th>
                <th>Timing</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {supplements.filter(s=>s.active).map(s => {
                const info = lookupSupplement(s.supplement_name) || SUPPLEMENT_DB.find(x=>x.name===s.supplement_name)
                return (
                  <tr key={s.id} className="border-b border-border">
                    <td className="flex items-center gap-2 py-2">
                      <span className="text-xl">{info?.emoji}</span>
                      <span>{s.supplement_name}</span>
                    </td>
                    <td>{s.dosage}</td>
                    <td>{s.timing_slots.map(t=>TIMING_SLOT_LABELS[t]).join(', ')}</td>
                    <td><button className="text-red-500 text-xs" onClick={()=>handleDelete(s.id)}>Delete</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {tab==='recommender' && (
        <RecommenderTab currentSupplements={supplements} />
      )}
      {tab !== 'recommender' && (
      <div className="mt-6">
        <h2 className="font-semibold mb-2">Interactions</h2>
        {interactions.length === 0 && <div className="text-text-secondary text-sm">No conflicts or synergies detected.</div>}
        {interactions.map((i, idx) => (
          <div key={idx} className={`rounded-2xl px-3 py-2 mb-2 ${i.severity==='avoid'?'bg-red-100 text-red-700':i.severity==='caution'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>
            <span className="font-bold">{i.supplement1} + {i.supplement2}:</span> {i.note}
          </div>
        ))}
      </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md border border-border">
            <h2 className="font-bold mb-2">Add Supplement</h2>
            <input className="w-full border border-border rounded px-2 py-1 mb-2" placeholder="Search..." value={search} onChange={e=>{
              setSearch(e.target.value)
              setSelected(null)
            }} />
            <div className="max-h-40 overflow-y-auto mb-2">
              {search && SUPPLEMENT_DB.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.aliases.some(a=>a.toLowerCase().includes(search.toLowerCase()))).map(s=>(
                <div key={s.name} className={`p-2 rounded cursor-pointer hover:bg-primary/10 ${selected?.name===s.name?'bg-primary/10':''}`} onClick={()=>{setSelected(s);setDosage('');setTiming(s.recommendedTiming)}}>
                  <span className="text-xl mr-2">{s.emoji}</span>
                  <span className="font-bold">{s.name}</span>
                  <span className="ml-2 text-xs text-text-secondary">{s.category}</span>
                </div>
              ))}
            </div>
            {selected && (
              <div className="mb-2">
                <div className="mb-1 text-sm text-text-secondary">{selected.notes}</div>
                <input className="w-full border border-border rounded px-2 py-1 mb-2" placeholder="Dosage (e.g. 500mg)" value={dosage} onChange={e=>setDosage(e.target.value)} />
                <div className="mb-2">
                  <div className="font-semibold mb-1">Timing</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(TIMING_SLOT_LABELS).map(([slot, label]) => (
                      <button key={slot} className={`px-2 py-1 rounded-2xl border ${timing.includes(slot as TimingSlot)?'bg-primary text-white border-primary':'bg-surface border-border text-text-secondary'}`} onClick={()=>setTiming(timing.includes(slot as TimingSlot)?timing.filter(t=>t!==slot):[...timing, slot as TimingSlot])}>{TIMING_SLOT_EMOJI[slot as TimingSlot]} {label}</button>
                    ))}
                  </div>
                </div>
                <button className="mt-2 w-full bg-primary text-white rounded-2xl py-2 font-bold" onClick={handleAdd}>Add</button>
              </div>
            )}
            <button className="w-full mt-2 text-text-secondary text-sm" onClick={()=>setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

