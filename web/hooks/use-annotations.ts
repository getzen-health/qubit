'use client'

import { useState, useCallback } from 'react'

export interface HealthAnnotation {
  id: string
  user_id: string
  entry_type: string
  entry_date: string
  note: string
  category?: string
  created_at: string
  updated_at: string
}

export function useAnnotations() {
  const [annotations, setAnnotations] = useState<Map<string, HealthAnnotation>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnnotations = useCallback(
    async (entryType?: string, startDate?: string, endDate?: string) => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (entryType) params.append('entry_type', entryType)
        if (startDate) params.append('start_date', startDate)
        if (endDate) params.append('end_date', endDate)

        const response = await fetch(`/api/annotations?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch annotations')

        const data: HealthAnnotation[] = await response.json()
        const map = new Map(data.map((a) => [`${a.entry_type}-${a.entry_date}`, a]))
        setAnnotations(map)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const saveAnnotation = useCallback(
    async (entryType: string, entryDate: string, note: string, category?: string) => {
      try {
        const response = await fetch('/api/annotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entry_type: entryType,
            entry_date: entryDate,
            note,
            category,
          }),
        })

        if (!response.ok) throw new Error('Failed to save annotation')

        const data: HealthAnnotation = await response.json()
        setAnnotations((prev) => new Map(prev).set(`${entryType}-${entryDate}`, data))
        return data
      } catch (err) {
        throw err instanceof Error ? err : new Error('Unknown error')
      }
    },
    []
  )

  const deleteAnnotation = useCallback(async (id: string, entryType: string, entryDate: string) => {
    try {
      const response = await fetch(`/api/annotations?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete annotation')

      setAnnotations((prev) => {
        const updated = new Map(prev)
        updated.delete(`${entryType}-${entryDate}`)
        return updated
      })
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error')
    }
  }, [])

  const getAnnotation = useCallback(
    (entryType: string, entryDate: string) => {
      return annotations.get(`${entryType}-${entryDate}`)
    },
    [annotations]
  )

  const hasAnnotation = useCallback(
    (entryType: string, entryDate: string) => {
      return annotations.has(`${entryType}-${entryDate}`)
    },
    [annotations]
  )

  return {
    annotations,
    loading,
    error,
    fetchAnnotations,
    saveAnnotation,
    deleteAnnotation,
    getAnnotation,
    hasAnnotation,
  }
}
