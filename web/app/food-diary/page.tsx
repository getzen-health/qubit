'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, Plus, Trash2 } from 'lucide-react'

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snacks' },
]

function AddFoodForm({ mealType, onAdded }: { mealType: string, onAdded: () => void }) {
  const [form, setForm] = useState({ food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', fiber_g: '', serving_size: '' })
  const [loading, setLoading] = useState(false)
  const handleChange = (e: any) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/food-diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, meal_type: mealType })
    })
    setLoading(false)
    setForm({ food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', fiber_g: '', serving_size: '' })
    onAdded()
  }
  return (
    <form className="flex flex-col gap-2 mt-2" onSubmit={handleSubmit}>
      <Input name="food_name" placeholder="Food name" value={form.food_name} onChange={handleChange} required />
      <div className="flex gap-2">
        <Input name="calories" placeholder="Calories" type="number" value={form.calories} onChange={handleChange} />
        <Input name="protein_g" placeholder="Protein (g)" type="number" value={form.protein_g} onChange={handleChange} />
        <Input name="carbs_g" placeholder="Carbs (g)" type="number" value={form.carbs_g} onChange={handleChange} />
        <Input name="fat_g" placeholder="Fat (g)" type="number" value={form.fat_g} onChange={handleChange} />
      </div>
      <div className="flex gap-2">
        <Input name="fiber_g" placeholder="Fiber (g)" type="number" value={form.fiber_g} onChange={handleChange} />
        <Input name="serving_size" placeholder="Serving size" value={form.serving_size} onChange={handleChange} />
      </div>
      <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add'}</Button>
    </form>
  )
}

export default function FoodDiaryPage() {
  const [data, setData] = useState<any>({ grouped: {}, totals: {} })
  const [showForm, setShowForm] = useState<{ [key: string]: boolean }>({})
  const fetchData = async () => {
    const res = await fetch('/api/food-diary')
    setData(await res.json())
  }
  useEffect(() => { fetchData() }, [])
  const handleDelete = async (id: string) => {
    await fetch(`/api/food-diary?id=${id}`, { method: 'DELETE' })
    fetchData()
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-4"><BookOpen className="w-6 h-6" /> Food Diary</h1>
      <div className="bg-gray-100 rounded p-4 mb-6">
        <div className="font-semibold">Today's Totals</div>
        <div className="flex gap-4 mt-2">
          <div>Calories: <span className="font-bold">{data.totals.calories || 0}</span></div>
          <div>Protein: <span className="font-bold">{data.totals.protein_g || 0}g</span></div>
          <div>Carbs: <span className="font-bold">{data.totals.carbs_g || 0}g</span></div>
          <div>Fat: <span className="font-bold">{data.totals.fat_g || 0}g</span></div>
        </div>
      </div>
      {MEAL_TYPES.map(meal => (
        <div key={meal.key} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-lg font-semibold">{meal.label}</div>
            <Button size="sm" variant="outline" onClick={() => setShowForm(f => ({ ...f, [meal.key]: !f[meal.key] }))}>
              <Plus className="w-4 h-4" /> Add food
            </Button>
          </div>
          {showForm[meal.key] && <AddFoodForm mealType={meal.key} onAdded={() => { setShowForm(f => ({ ...f, [meal.key]: false })); fetchData() }} />}
          <div className="space-y-2 mt-2">
            {(data.grouped?.[meal.key] || []).map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between bg-white rounded p-2 shadow-sm">
                <div>
                  <div className="font-medium">{entry.food_name}</div>
                  <div className="text-xs text-gray-500">{entry.serving_size}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-bold">{entry.calories} kcal</div>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(entry.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              </div>
            ))}
            {(!data.grouped?.[meal.key] || data.grouped[meal.key].length === 0) && <div className="text-gray-400 text-sm">No entries</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
