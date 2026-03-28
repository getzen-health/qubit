"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  EXERCISE_LIBRARY,
  MUSCLE_GROUPS,
  searchExercises,
  type Exercise,
} from "@/components/exercise-library"

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkoutSet {
  id: string
  set_number: number
  weight_kg: number | ""
  reps: number | ""
  completed: boolean
  notes: string
}

interface ExerciseEntry {
  id: string
  exercise: Exercise
  sets: WorkoutSet[]
}

interface LastSessionSet {
  weight_kg: number
  reps: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2)
}

function makeSet(setNumber: number, prev?: WorkoutSet): WorkoutSet {
  return {
    id: uid(),
    set_number: setNumber,
    weight_kg: prev?.weight_kg ?? "",
    reps: prev?.reps ?? "",
    completed: false,
    notes: "",
  }
}

function makeEntry(exercise: Exercise): ExerciseEntry {
  return { id: uid(), exercise, sets: [makeSet(1)] }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {children}
    </span>
  )
}

function ExercisePicker({
  onSelect,
  onClose,
}: {
  onSelect: (ex: Exercise) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = query
    ? searchExercises(query)
    : activeMuscle
    ? EXERCISE_LIBRARY.filter((e) => e.muscle === activeMuscle)
    : EXERCISE_LIBRARY

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <h3 className="text-white font-semibold">Exercise Library</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-zinc-800">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveMuscle(null)
            }}
            placeholder="Search exercises…"
            className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-purple-500 focus:outline-none text-sm transition-colors"
          />
        </div>

        {/* Muscle filter pills */}
        {!query && (
          <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-zinc-800 scrollbar-none">
            <button
              onClick={() => setActiveMuscle(null)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !activeMuscle
                  ? "bg-purple-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              All
            </button>
            {MUSCLE_GROUPS.map((m) => (
              <button
                key={m}
                onClick={() => setActiveMuscle(m)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeMuscle === m
                    ? "bg-purple-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {/* Exercise list */}
        <ul className="overflow-y-auto flex-1 divide-y divide-zinc-800">
          {results.map((ex) => (
            <li key={ex.name}>
              <button
                onClick={() => onSelect(ex)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800 transition-colors text-left"
              >
                <span className="text-white text-sm font-medium">{ex.name}</span>
                <div className="flex gap-1.5 ml-2 shrink-0">
                  <Badge className="bg-zinc-700 text-zinc-300">{ex.muscle}</Badge>
                  <Badge className="bg-zinc-800 text-zinc-400">{ex.equipment}</Badge>
                </div>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-4 py-8 text-center text-zinc-500 text-sm">
              No exercises found
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

function SetsTable({
  entry,
  lastSets,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
}: {
  entry: ExerciseEntry
  lastSets: LastSessionSet[]
  onUpdateSet: (entryId: string, setId: string, patch: Partial<WorkoutSet>) => void
  onAddSet: (entryId: string) => void
  onRemoveSet: (entryId: string, setId: string) => void
  onRemoveExercise: (entryId: string) => void
}) {
  const bestPrev =
    lastSets.length > 0
      ? lastSets.reduce(
          (best, s) => (s.weight_kg * s.reps > best.weight_kg * best.reps ? s : best),
          lastSets[0]
        )
      : null

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden">
      {/* Exercise header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/60">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white font-semibold truncate">
            {entry.exercise.name}
          </span>
          <Badge className="bg-purple-900/60 text-purple-300">
            {entry.exercise.muscle}
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {bestPrev && (
            <span className="text-xs text-emerald-400 hidden sm:block">
              Last: {bestPrev.weight_kg}kg × {bestPrev.reps}
            </span>
          )}
          <button
            onClick={() => onRemoveExercise(entry.id)}
            className="text-zinc-500 hover:text-red-400 transition-colors text-sm"
            aria-label="Remove exercise"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progressive overload hint on mobile */}
      {bestPrev && (
        <div className="px-4 py-1.5 bg-emerald-950/40 text-emerald-400 text-xs sm:hidden">
          Last session: {bestPrev.weight_kg} kg × {bestPrev.reps} reps
        </div>
      )}

      {/* Sets table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-xs border-b border-zinc-800">
              <th className="px-3 py-2 text-left w-10">Set</th>
              <th className="px-3 py-2 text-left">Weight (kg)</th>
              <th className="px-3 py-2 text-left">Reps</th>
              <th className="px-3 py-2 text-center w-10">✓</th>
              <th className="px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {entry.sets.map((s) => (
              <tr key={s.id} className="border-b border-zinc-800/50 last:border-0">
                <td className="px-3 py-2 text-zinc-500">{s.set_number}</td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={s.weight_kg}
                    onChange={(e) =>
                      onUpdateSet(entry.id, s.id, {
                        weight_kg: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    placeholder="0"
                    className="w-20 bg-zinc-800 text-white rounded px-2 py-1 border border-zinc-700 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    min={0}
                    value={s.reps}
                    onChange={(e) =>
                      onUpdateSet(entry.id, s.id, {
                        reps: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    placeholder="0"
                    className="w-16 bg-zinc-800 text-white rounded px-2 py-1 border border-zinc-700 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </td>
                <td className="px-3 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSet(entry.id, s.id, { completed: !s.completed })
                    }
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      s.completed
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-zinc-600 text-transparent hover:border-zinc-500"
                    }`}
                    aria-label="Toggle completed"
                  >
                    ✓
                  </button>
                </td>
                <td className="px-2 py-1.5 text-center">
                  {entry.sets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveSet(entry.id, s.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors text-xs"
                      aria-label="Remove set"
                    >
                      −
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add set */}
      <div className="px-4 py-2 border-t border-zinc-800">
        <button
          type="button"
          onClick={() => onAddSet(entry.id)}
          className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
        >
          + Add Set
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LogWorkoutClient() {
  const router = useRouter()

  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [sessionNotes, setSessionNotes] = useState("")
  const [entries, setEntries] = useState<ExerciseEntry[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedSummary, setSavedSummary] = useState<string | null>(null)
  // Map exercise_name → last session sets
  const [lastSessionData, setLastSessionData] = useState<
    Record<string, LastSessionSet[]>
  >({})

  // Fetch recent sessions on mount to populate progressive overload hints
  useEffect(() => {
    fetch("/api/strength")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json?.data?.length) return
        // Build a map: exercise_name → sets from the most recent session containing it
        const map: Record<string, LastSessionSet[]> = {}
        for (const session of json.data as Array<{
          strength_sets: Array<{
            exercise_name: string
            weight_kg: number
            reps: number
          }>
        }>) {
          for (const s of session.strength_sets ?? []) {
            if (!map[s.exercise_name]) {
              map[s.exercise_name] = []
            }
            // Only add if this session's exercise hasn't been seen yet (most recent first)
            if (
              !map[s.exercise_name].some(
                (x) => x.weight_kg === s.weight_kg && x.reps === s.reps
              )
            ) {
              map[s.exercise_name].push({ weight_kg: s.weight_kg, reps: s.reps })
            }
          }
        }
        setLastSessionData(map)
      })
      .catch(() => {/* ignore — progressive overload hints are non-critical */})
  }, [])

  const addExercise = useCallback((ex: Exercise) => {
    setEntries((prev) => [...prev, makeEntry(ex)])
    setShowPicker(false)
  }, [])

  const removeExercise = useCallback((entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
  }, [])

  const addSet = useCallback((entryId: string) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== entryId) return e
        const prev_ = e.sets[e.sets.length - 1]
        return { ...e, sets: [...e.sets, makeSet(e.sets.length + 1, prev_)] }
      })
    )
  }, [])

  const removeSet = useCallback((entryId: string, setId: string) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== entryId) return e
        const filtered = e.sets.filter((s) => s.id !== setId)
        return {
          ...e,
          sets: filtered.map((s, i) => ({ ...s, set_number: i + 1 })),
        }
      })
    )
  }, [])

  const updateSet = useCallback(
    (entryId: string, setId: string, patch: Partial<WorkoutSet>) => {
      setEntries((prev) =>
        prev.map((e) => {
          if (e.id !== entryId) return e
          return {
            ...e,
            sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
          }
        })
      )
    },
    []
  )

  async function handleSave() {
    if (entries.length === 0) {
      setError("Add at least one exercise before saving.")
      return
    }

    const allSets = entries.flatMap((e) =>
      e.sets.map((s) => ({
        exercise_name: e.exercise.name,
        set_number: s.set_number,
        reps: Number(s.reps) || 0,
        weight_kg: Number(s.weight_kg) || 0,
        completed: s.completed,
        notes: s.notes || undefined,
      }))
    )

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/strength", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_date: date,
          notes: sessionNotes || undefined,
          sets: allSets,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to save session")

      const exerciseCount = entries.length
      const setCount = json.sets_count as number
      setSavedSummary(
        `✓ Saved! ${exerciseCount} exercise${exerciseCount !== 1 ? "s" : ""}, ${setCount} set${setCount !== 1 ? "s" : ""} logged.`
      )
      setTimeout(() => router.push("/workouts"), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Session header */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 flex flex-col gap-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wide">
            Session Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-purple-500 focus:outline-none transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wide">
            Session Notes (optional)
          </label>
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Felt strong today…"
            className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-purple-500 focus:outline-none transition-colors text-sm resize-none"
          />
        </div>
      </div>

      {/* Exercise list */}
      {entries.map((entry) => (
        <SetsTable
          key={entry.id}
          entry={entry}
          lastSets={lastSessionData[entry.exercise.name] ?? []}
          onUpdateSet={updateSet}
          onAddSet={addSet}
          onRemoveSet={removeSet}
          onRemoveExercise={removeExercise}
        />
      ))}

      {/* Add exercise */}
      <button
        type="button"
        onClick={() => setShowPicker(true)}
        className="w-full rounded-xl border-2 border-dashed border-zinc-700 hover:border-purple-500 text-zinc-400 hover:text-purple-400 py-4 text-sm font-medium transition-colors"
      >
        + Add Exercise
      </button>

      {/* Errors / success */}
      {error && (
        <p className="text-red-400 text-sm bg-red-950/30 border border-red-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {savedSummary && (
        <p className="text-emerald-400 text-sm bg-emerald-950/30 border border-emerald-800 rounded-lg px-3 py-2 text-center font-medium">
          {savedSummary}
        </p>
      )}

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || entries.length === 0}
        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {saving ? "Saving…" : "Save Session"}
      </button>

      {/* Exercise picker modal */}
      {showPicker && (
        <ExercisePicker
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
