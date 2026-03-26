import { DAILY_VALUES, NUTRIENT_LABELS, NUTRIENT_UNITS, getDailyValuePercent, getNutrientQuality } from '@/lib/nutrition-constants'

type Nutrient = keyof typeof DAILY_VALUES
interface NutritionLabelProps {
  servingSize?: string
  servingsPerContainer?: number
  nutrients: Partial<Record<Nutrient, number>>
  productName?: string
}

export function NutritionLabel({ servingSize, servingsPerContainer, nutrients, productName }: NutritionLabelProps) {
  const qualityColors = { good: 'text-green-600', neutral: 'text-foreground', bad: 'text-red-600' }
  
  return (
    <div className="border-4 border-black p-3 font-mono text-sm max-w-xs">
      <p className="text-2xl font-extrabold border-b-4 border-black pb-1">Nutrition Facts</p>
      {servingsPerContainer && <p className="text-xs">{servingsPerContainer} servings per container</p>}
      {servingSize && <p className="font-bold text-xs">Serving size <span className="float-right">{servingSize}</span></p>}
      <div className="border-t-8 border-black mt-1 pt-1">
        <p className="text-xs">Amount per serving</p>
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-extrabold">Calories</span>
          <span className="text-4xl font-extrabold">{nutrients.calories ?? 0}</span>
        </div>
      </div>
      <div className="border-t-4 border-black pt-1 space-y-0.5">
        <p className="text-xs text-right font-bold">% Daily Value*</p>
        {(Object.keys(NUTRIENT_LABELS) as Nutrient[]).filter(k => k !== 'calories' && nutrients[k] !== undefined).map(key => {
          const dv = getDailyValuePercent(key, nutrients[key]!)
          const quality = getNutrientQuality(key, dv)
          return (
            <div key={key} className="flex justify-between border-t border-gray-300 py-0.5">
              <span><span className="font-bold">{NUTRIENT_LABELS[key]}</span> {nutrients[key]}{NUTRIENT_UNITS[key]}</span>
              <span className={`font-bold ${qualityColors[quality]}`}>{dv > 0 ? `${dv}%` : ''}</span>
            </div>
          )
        })}
      </div>
      <p className="text-xs mt-2 border-t border-black pt-1">*Based on 2,000 calorie diet</p>
    </div>
  )
}
