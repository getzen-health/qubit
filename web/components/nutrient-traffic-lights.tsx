import { analyzeNutrients, LIGHT_COLORS, type NutrientLight } from '@/lib/nutrient-traffic-light'

interface NutrientTrafficLightsProps {
  nutriments: Record<string, any>
  compact?: boolean
}

export function NutrientTrafficLights({ nutriments, compact = false }: NutrientTrafficLightsProps) {
  const nutrients = analyzeNutrients(nutriments)
  
  if (nutrients.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No nutrient data available</p>
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {nutrients.map(n => {
          const colors = LIGHT_COLORS[n.light]
          return (
            <div key={n.name} className={`flex flex-col items-center gap-1 rounded-xl border ${colors.border} ${colors.bg_light} px-3 py-2 min-w-[64px]`}>
              <div className={`w-4 h-4 rounded-full ${colors.bg}`} />
              <span className="text-[10px] font-medium text-center leading-tight">{n.name}</span>
              <span className={`text-[10px] font-semibold ${colors.text}`}>{n.value}{n.unit}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 bg-muted/50 border-b border-border">
        <h3 className="text-sm font-semibold">Nutritional Traffic Lights <span className="font-normal text-muted-foreground">(per 100g)</span></h3>
      </div>
      <div className="divide-y divide-border">
        {nutrients.map(n => {
          const colors = LIGHT_COLORS[n.light]
          return (
            <div key={n.name} className="flex items-center gap-3 px-4 py-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colors.bg}`} />
              <span className="text-sm flex-1">{n.name}</span>
              <span className="text-sm text-muted-foreground">{n.value}{n.unit}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors.border} ${colors.bg_light} ${colors.text}`}>
                {n.label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="px-4 py-2 bg-muted/30 border-t border-border flex gap-4">
        {(['green','yellow','red'] as const).map(l => (
          <div key={l} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${LIGHT_COLORS[l].bg}`} />
            <span className="text-[11px] text-muted-foreground capitalize">{l === 'green' ? 'Low' : l === 'yellow' ? 'Medium' : 'High'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
