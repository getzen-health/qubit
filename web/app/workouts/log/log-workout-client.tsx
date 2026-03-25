"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const WORKOUT_TYPES = [
  "Running",
  "Cycling",
  "Swimming",
  "Weight Training",
  "HIIT",
  "Yoga",
  "Walking",
  "Other",
]

export function LogWorkoutClient() {
  const [type, setType] = useState("Running")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [durationMin, setDurationMin] = useState(30)
  const [calories, setCalories] = useState<number | "">("")
  const [avgHR, setAvgHR] = useState<number | "">("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error: err } = await supabase.from("workouts").insert({
        user_id: user.id,
        workout_type: type,
        started_at: new Date(date).toISOString(),
        duration_seconds: durationMin * 60,
        total_energy_kcal: calories || null,
        average_heart_rate_bpm: avgHR || null,
        notes: notes || null,
        source: "manual",
      })
      if (err) throw err
      router.push("/workouts")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm text-zinc-400 mb-1">
          Workout Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-purple-500 focus:outline-none transition-colors"
        >
          {WORKOUT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-purple-500 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">
          Duration (minutes)
        </label>
        <input
          type="number"
          min={1}
          max={720}
          value={durationMin}
          onChange={(e) => setDurationMin(Number(e.target.value))}
          className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-purple-500 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">
          Calories burned (optional)
        </label>
        <input
          type="number"
          min={0}
          value={calories}
          onChange={(e) =>
            setCalories(e.target.value ? Number(e.target.value) : "")
          }
          className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-purple-500 focus:outline-none transition-colors"
          placeholder="e.g. 350"
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">
          Avg heart rate (optional)
        </label>
        <input
          type="number"
          min={40}
          max={220}
          value={avgHR}
          onChange={(e) => setAvgHR(e.target.value ? Number(e.target.value) : "")}
          className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-purple-500 focus:outline-none transition-colors"
          placeholder="e.g. 145"
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-purple-500 focus:outline-none transition-colors"
          placeholder="How did it feel?"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {saving ? "Saving…" : "Log Workout"}
      </button>
    </form>
  )
}
