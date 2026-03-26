'use client'
import { useState, useEffect } from 'react'
import { SUPPLEMENT_DB, TIMING_SLOT_LABELS, TIMING_SLOT_EMOJI, lookupSupplement, checkInteractions, TimingSlot, SupplementInfo } from '@/lib/supplements'

type UserSupplement = {
  id: string
  supplement_name: string
  dosage: string
  timing_slots: TimingSlot[]
  active: boolean
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
  const [tab, setTab] = useState<'schedule'|'list'>('schedule')
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
      <div className="mt-6">
        <h2 className="font-semibold mb-2">Interactions</h2>
        {interactions.length === 0 && <div className="text-text-secondary text-sm">No conflicts or synergies detected.</div>}
        {interactions.map((i, idx) => (
          <div key={idx} className={`rounded-2xl px-3 py-2 mb-2 ${i.severity==='avoid'?'bg-red-100 text-red-700':i.severity==='caution'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>
            <span className="font-bold">{i.supplement1} + {i.supplement2}:</span> {i.note}
          </div>
        ))}
      </div>
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

