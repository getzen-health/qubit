'use client'
import { useState } from 'react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export default function UnitsPage() {
  const [weight, setWeight] = useState<'kg'|'lbs'>('kg')
  const [distance, setDistance] = useState<'km'|'mi'>('km')
  const [height, setHeight] = useState<'cm'|'ft'>('cm')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Settings', href: '/settings' }, { label: 'Units' }]} />
      <h1 className="text-2xl font-bold mb-6">Units</h1>
      <div className="space-y-4">
        {[
          { label: 'Weight', value: weight, options: ['kg', 'lbs'] as const, onChange: setWeight },
          { label: 'Distance', value: distance, options: ['km', 'mi'] as const, onChange: setDistance },
          { label: 'Height', value: height, options: ['cm', 'ft'] as const, onChange: setHeight },
        ].map(({ label, value, options, onChange }) => (
          <div key={label} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <span className="text-sm font-medium">{label}</span>
            <div className="flex rounded-lg overflow-hidden border border-border">
              {options.map(opt => (
                <button key={opt} onClick={() => onChange(opt as any)} className={`px-4 py-1.5 text-sm transition-colors ${value === opt ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{opt}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
