"use client"
import { useEffect, useState } from 'react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export default function AboutPage() {
  const [scanCount, setScanCount] = useState<number | null>(null)
  useEffect(() => {
    fetch('/api/scanner/history')
      .then(r => r.json())
      .then(res => setScanCount(Array.isArray(res.data) ? res.data.length : null))
  }, [])
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Settings', href: '/settings' }, { label: 'About' }]} />
      <h1 className="text-2xl font-bold mb-6">About KQuarks</h1>
      <div className="space-y-4">
        <div className="rounded-xl border border-border p-6 text-center">
          <p className="text-4xl mb-3">💎</p>
          <h2 className="font-bold text-lg">KQuarks</h2>
          <p className="text-sm text-muted-foreground">Version 1.0.0</p>
          <p className="text-sm text-muted-foreground mt-2">Your personal health intelligence platform</p>
          {scanCount !== null && (
            <p className="text-sm text-muted-foreground mt-2">Total product scans: <span className="font-bold text-primary">{scanCount}</span></p>
          )}
        </div>
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {[
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
            { label: 'Open Source Licenses', href: '/licenses' },
          ].map(item => (
            <a key={item.href} href={item.href} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 text-sm">
              <span>{item.label}</span>
              <span className="text-muted-foreground">›</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
