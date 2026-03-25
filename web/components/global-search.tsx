'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Utensils, Dumbbell, Heart, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  name: string
  type: 'food' | 'workout' | 'health'
  date?: string
  duration?: number
  distance?: number
  calories?: number
  value?: number
  mealId?: string
}

interface SearchResponse {
  food: SearchResult[]
  workouts: SearchResult[]
  health_metrics: SearchResult[]
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse>({
    food: [],
    workouts: [],
    health_metrics: [],
  })
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(!open)
        if (!open) {
          setTimeout(() => inputRef.current?.focus(), 0)
        }
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Search handler
  const search = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults({ food: [], workouts: [], health_metrics: [] })
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data)
          setSelectedIndex(-1)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, search])

  const allResults = [...results.food, ...results.workouts, ...results.health_metrics]

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev < allResults.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      const result = allResults[selectedIndex]
      handleResultClick(result)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    let href = ''
    if (result.type === 'food') {
      href = `/food/diary?id=${result.mealId}`
    } else if (result.type === 'workout') {
      href = `/workouts?id=${result.id}`
    } else if (result.type === 'health') {
      href = `/trends?metric=${result.name}`
    }

    if (href) {
      window.location.href = href
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background-secondary text-text-secondary hover:text-text-primary transition-colors text-sm border border-border"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="ml-auto text-xs px-2 py-0.5 bg-background rounded border border-border">
          ⌘K
        </kbd>
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Search dialog */}
      <div
        ref={containerRef}
        className="fixed top-0 left-0 right-0 z-50 flex items-start justify-center pt-12 px-4"
      >
        <div className="w-full max-w-2xl bg-background rounded-lg shadow-xl border border-border overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-5 h-5 text-text-secondary flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search food, workouts, health metrics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-foreground placeholder-text-secondary"
              autoComplete="off"
            />
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-background-secondary rounded text-text-secondary hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading && query.length >= 2 && (
              <div className="px-4 py-8 text-center text-text-secondary">
                Searching...
              </div>
            )}

            {!loading && query.length >= 2 && allResults.length === 0 && (
              <div className="px-4 py-8 text-center text-text-secondary">
                No results found for "{query}"
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="px-4 py-8 text-center text-text-secondary text-sm">
                Type at least 2 characters to search
              </div>
            )}

            {/* Food results */}
            {results.food.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-background-secondary sticky top-0">
                  <h3 className="text-xs font-semibold text-text-secondary flex items-center gap-2 uppercase">
                    <Utensils className="w-3 h-3" />
                    Food
                  </h3>
                </div>
                {results.food.map((result, idx) => (
                  <ResultItem
                    key={result.id}
                    result={result}
                    isSelected={selectedIndex === idx}
                    onClick={() => handleResultClick(result)}
                  />
                ))}
              </div>
            )}

            {/* Workout results */}
            {results.workouts.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-background-secondary sticky top-10">
                  <h3 className="text-xs font-semibold text-text-secondary flex items-center gap-2 uppercase">
                    <Dumbbell className="w-3 h-3" />
                    Workouts
                  </h3>
                </div>
                {results.workouts.map((result, idx) => (
                  <ResultItem
                    key={result.id}
                    result={result}
                    isSelected={selectedIndex === results.food.length + idx}
                    onClick={() => handleResultClick(result)}
                  />
                ))}
              </div>
            )}

            {/* Health metrics results */}
            {results.health_metrics.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-background-secondary sticky top-20">
                  <h3 className="text-xs font-semibold text-text-secondary flex items-center gap-2 uppercase">
                    <Heart className="w-3 h-3" />
                    Health
                  </h3>
                </div>
                {results.health_metrics.map((result, idx) => (
                  <ResultItem
                    key={result.id}
                    result={result}
                    isSelected={
                      selectedIndex ===
                      results.food.length + results.workouts.length + idx
                    }
                    onClick={() => handleResultClick(result)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

interface ResultItemProps {
  result: SearchResult
  isSelected: boolean
  onClick: () => void
}

function ResultItem({ result, isSelected, onClick }: ResultItemProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  let icon = null
  let details = ''

  if (result.type === 'food') {
    icon = <Utensils className="w-4 h-4" />
    details = formatDate(result.date)
  } else if (result.type === 'workout') {
    icon = <Dumbbell className="w-4 h-4" />
    details = `${result.duration}m • ${result.calories} cal`
  } else if (result.type === 'health') {
    icon = <Heart className="w-4 h-4" />
    details = result.value ? `${result.value}` : formatDate(result.date)
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-4 py-3 text-left flex items-center gap-3 border-b border-border transition-colors',
        isSelected ? 'bg-accent/10 text-accent' : 'hover:bg-background-secondary'
      )}
    >
      <div className="text-text-secondary flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{result.name}</p>
        <p className="text-sm text-text-secondary truncate">{details}</p>
      </div>
    </button>
  )
}
