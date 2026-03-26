import { FoodPhotoAnalyzer } from '@/components/food-photo-analyzer'

// Add a tab/button for photo analysis and show the analyzer UI
// When a result comes in, offer to add the food items to the diary

import { useState } from 'react'

export function FoodPhotoTab({ onAdd }: { onAdd: (foods: any[]) => void }) {
  const [result, setResult] = useState<any>(null)
  return (
    <div>
      <FoodPhotoAnalyzer onResult={(res) => setResult(res)} />
      {result?.foods?.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent/90"
            onClick={() => onAdd(result.foods)}
          >
            Add to diary
          </button>
        </div>
      )}
    </div>
  )
}
