'use client'
interface InjuryRisk { score: number; level: 'low' | 'moderate' | 'high'; recommendations: string[] }
const levelColors = { low: 'text-green-600 bg-green-50', moderate: 'text-yellow-600 bg-yellow-50', high: 'text-red-600 bg-red-50' }
export function InjuryRiskCard({ risk }: { risk: InjuryRisk }) {
  return (
    <div className="rounded-xl border border-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Injury Risk</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${levelColors[risk.level]}`}>{risk.level.toUpperCase()}</span>
      </div>
      <div className="text-3xl font-bold">{risk.score}<span className="text-base text-muted-foreground">/100</span></div>
      <ul className="text-sm text-muted-foreground space-y-1">
        {risk.recommendations.map((r, i) => <li key={i}>• {r}</li>)}
      </ul>
    </div>
  )
}
