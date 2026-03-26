import React, { useEffect, useState } from 'react'
import Link from 'next/link'

export function HydrationMiniBar() {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    fetch('/api/hydration/target').then(r => r.json()).then(setData)
  }, [])
  if (!data) return <div className="h-8 w-full bg-surface rounded-lg animate-pulse" />
  const pct = data.percentage ?? 0
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-4 bg-blue-100 rounded-full overflow-hidden">
        <div
          className="h-4 bg-blue-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between w-full text-xs mt-1">
        <span className="text-text-secondary">{((data.consumed_ml ?? 0)/1000).toFixed(1)}L</span>
        <span className="text-text-secondary">{pct}%</span>
        <span className="text-text-secondary">{((data.target_ml ?? 2000)/1000).toFixed(1)}L</span>
      </div>
    </div>
  )
}
