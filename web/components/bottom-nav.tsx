'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard, Moon, Dumbbell, MoreHorizontal, Utensils, Droplets,
  ShieldAlert, BarChart2, ScanBarcode, BookOpen, X, Users, CalendarRange,
  Pill, Trophy, Bot, CheckSquare,
  Wind, Heart, BedDouble, Download, Upload, Ruler, Activity,
  Stethoscope, Brain, Leaf, Zap, Dna,
  UtensilsCrossed, Package, Clock, Search, CalendarDays,
  TrendingUp, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type LucideIcon = React.ComponentType<{ className?: string }>
type MoreItem = { href: string; icon: LucideIcon | string; label: string; tKey?: string }
type MoreCategory = { title: string; tKey?: string; items: MoreItem[] }

// "More" sheet — secondary features grouped by category
const moreCategories: MoreCategory[] = [
  {
    title: 'Daily',
    tKey: 'daily',
    items: [
      { href: '/hydration', icon: Droplets, label: 'Hydration', tKey: 'hydration' },
      { href: '/mood', icon: '😊', label: 'Mood', tKey: 'mood' },
      { href: '/habits', icon: CheckSquare, label: 'Habits', tKey: 'habits' },
      { href: '/journal', icon: BookOpen, label: 'Journal', tKey: 'journal' },
      { href: '/goals', icon: '🎯', label: 'Goals', tKey: 'goals' },
      { href: '/desk-breaks', icon: '🪑', label: 'Desk Breaks', tKey: 'deskBreaks' },
    ],
  },
  {
    title: 'Nutrition',
    tKey: 'nutrition',
    items: [
      { href: '/food/scanner', icon: ScanBarcode, label: 'Food Scanner', tKey: 'foodScanner' },
      { href: '/scanner/history', icon: Package, label: 'Scan History', tKey: 'scanHistory' },
      { href: '/meal-planner', icon: UtensilsCrossed, label: 'Meal Planner', tKey: 'mealPlanner' },
      { href: '/food/diary', icon: BookOpen, label: 'Food Diary', tKey: 'foodDiary' },
      { href: '/supplements', icon: '💊', label: 'Supplements', tKey: 'supplements' },
      { href: '/fasting', icon: Clock, label: 'Fasting', tKey: 'fasting' },
      { href: '/caffeine', icon: '☕', label: 'Caffeine', tKey: 'caffeine' },
    ],
  },
  {
    title: 'Health Metrics',
    tKey: 'healthMetrics',
    items: [
      { href: '/heartrate', icon: Heart, label: 'Heart Rate', tKey: 'heartRate' },
      { href: '/hrv', icon: Activity, label: 'HRV', tKey: 'hrv' },
      { href: '/blood-pressure', icon: ShieldAlert, label: 'Blood Pressure', tKey: 'bloodPressure' },
      { href: '/glucose', icon: '🩸', label: 'Glucose' },
      { href: '/sleep-analytics', icon: BedDouble, label: 'Sleep Analytics' },
      { href: '/vo2max', icon: Wind, label: 'VO2 Max' },
      { href: '/environment', icon: '🌍', label: 'Environment' },
      { href: '/noise-exposure', icon: '👂', label: 'Hearing' },
    ],
  },
  {
    title: 'Body',
    items: [
      { href: '/body', icon: '⚖️', label: 'Body' },
      { href: '/body-measurements', icon: Ruler, label: 'Body Measurements' },
    ],
  },
  {
    title: 'Mind',
    items: [
      { href: '/stress', icon: Wind, label: 'Stress' },
      { href: '/mindfulness', icon: Leaf, label: 'Mindfulness' },
      { href: '/mental-health', icon: Brain, label: 'Mental Health' },
      { href: '/cognitive', icon: Brain, label: 'Cognitive' },
      { href: '/energy', icon: '⚡', label: 'Energy' },
      { href: '/breathing', icon: Wind, label: 'Breathing', tKey: 'breathing' },
    ],
  },
  {
    title: 'Medical',
    items: [
      { href: '/medications', icon: Pill, label: 'Medications' },
      { href: '/oral-hygiene', icon: '🦷', label: 'Oral Care' },
      { href: '/labs', icon: '🧪', label: 'Lab Results' },
      { href: '/symptoms', icon: Stethoscope, label: 'Symptoms' },
      { href: '/cycle', icon: CalendarRange, label: 'Cycle', tKey: 'cycle' },
    ],
  },
  {
    title: 'Activity',
    items: [
      { href: '/running', icon: '🏃', label: 'Running', tKey: 'running' },
      { href: '/cycling', icon: '🚴', label: 'Cycling', tKey: 'cycling' },
      { href: '/swimming', icon: '🏊', label: 'Swimming' },
      { href: '/steps', icon: '👟', label: 'Steps' },
      { href: '/hr-zones', icon: Heart, label: 'HR Zones' },
      { href: '/zones', icon: Heart, label: 'Training Zones' },
      { href: '/recovery', icon: Zap, label: 'Recovery' },
      { href: '/readiness', icon: Zap, label: 'Readiness' },
      { href: '/streaks', icon: Trophy, label: 'Streaks' },
      { href: '/leaderboard', icon: '🔥', label: 'Streaks Board' },
      { href: '/achievements', icon: Trophy, label: 'Awards' },
    ],
  },
  {
    title: 'Insights',
    tKey: 'insights',
    items: [
      { href: '/weekly-report', icon: CalendarDays, label: 'Weekly Report' },
      { href: '/coach', icon: Bot, label: 'AI Coach' },
      { href: '/longevity', icon: Dna, label: 'Longevity' },
      { href: '/biological-age', icon: Dna, label: 'Bio Age' },
      { href: '/correlations', icon: BarChart2, label: 'Patterns' },
      { href: '/trends', icon: TrendingUp, label: 'Trends' },
      { href: '/predictions', icon: Sparkles, label: 'Predictions' },
      { href: '/sun-exposure', icon: '☀️', label: 'Sun' },
      { href: '/social', icon: Users, label: 'Social' },
    ],
  },
  {
    title: 'Settings',
    tKey: 'settings',
    items: [
      { href: '/profile', icon: '👤', label: 'Profile', tKey: 'profile' },
      { href: '/import', icon: Upload, label: 'Import' },
      { href: '/export', icon: Download, label: 'Export Data' },
      { href: '/report', icon: Stethoscope, label: 'Doctor Report' },
      { href: '/invite', icon: '🎁', label: 'Invite' },
      { href: '/settings', icon: MoreHorizontal, label: 'Settings', tKey: 'settings' },
    ],
  },
]

const allMoreItemsGlobal = moreCategories.flatMap((c) => c.items)

function NavIcon({ icon, className }: { icon: LucideIcon | string; className: string }) {
  if (typeof icon === 'string') return <span className="text-base leading-none">{icon}</span>
  const Icon = icon
  return <Icon className={className} />
}

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const [search, setSearch] = useState('')
  const t = useTranslations('navigation')

  // Primary bottom bar — most-used daily features
  const navItems: MoreItem[] = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('home') },
    { href: '/sleep', icon: Moon, label: t('sleep') },
    { href: '/workouts', icon: Dumbbell, label: t('workouts') },
    { href: '/nutrition', icon: Utensils, label: t('nutrition') },
    { href: '/insights', icon: BarChart2, label: t('insights') },
    { href: '/predictions', icon: '🔮', label: t('forecast') },
    { href: '/coaching', icon: '🤖', label: t('coach') },
  ]

  const allMoreItems = allMoreItemsGlobal
  const isMoreActive = allMoreItems.some(({ href }) => pathname === href || pathname.startsWith(href))

  const query = search.trim().toLowerCase()
  const visibleCategories = query
    ? [{ title: 'Results', items: allMoreItems.filter(({ label }) => label.toLowerCase().includes(query)) }]
    : moreCategories

  function closeMore() {
    setMoreOpen(false)
    setSearch('')
  }

  return (
    <>
      {/* More overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeMore}
        />
      )}

      {/* More sheet */}
      <div
        className={cn(
          'fixed left-0 right-0 z-50 bg-background border-t border-border transition-transform duration-300 ease-out max-w-2xl mx-auto rounded-t-2xl',
          moreOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ bottom: '64px' }}
      >
        <div className="px-4 pt-4 pb-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">More</span>
            <button onClick={closeMore} className="p-1 rounded-lg hover:bg-surface-secondary" aria-label="Close menu">
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>

          {/* Search input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
            <input
              type="text"
              placeholder="Search features…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent/60 transition-colors"
            />
          </div>

          {/* Categories */}
          <div className="max-h-[58vh] overflow-y-auto space-y-4 pb-1">
            {visibleCategories.map((cat) =>
              cat.items.length > 0 ? (
                <div key={cat.title}>
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 px-0.5">
                    {cat.tKey ? t(cat.tKey) : cat.title}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {cat.items.map(({ href, icon, label, tKey }) => {
                      const active = pathname === href || pathname.startsWith(href)
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={closeMore}
                          className={cn(
                            'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors',
                            active
                              ? 'bg-accent/10 border-accent/30 text-accent'
                              : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-border/80'
                          )}
                        >
                          <NavIcon icon={icon} className="w-5 h-5" />
                          <span className="text-[11px] font-medium text-center leading-tight">
                            {tKey ? t(tKey) : label}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ) : null
            )}
            {visibleCategories.every((c) => c.items.length === 0) && (
              <p className="text-center text-sm text-text-secondary py-8">No features found</p>
            )}
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border safe-bottom">
        <div className="flex items-center justify-around px-2 py-2 max-w-2xl mx-auto">
          {navItems.map(({ href, icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors min-w-0 min-h-[44px] justify-center',
                  active ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <NavIcon icon={icon} className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_var(--accent-shadow)]')} />
                <span className="text-[10px] font-medium leading-none" aria-hidden="true">{label}</span>
                <span
                  className={cn('w-1 h-1 rounded-full mt-0.5 transition-colors', active ? 'bg-accent' : 'bg-transparent')}
                  aria-hidden="true"
                />
              </Link>
            )
          })}
          {/* More button */}
          <button
            aria-label="More navigation options"
            onClick={() => setMoreOpen((o) => !o)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-0 min-h-[44px] justify-center',
              (moreOpen || isMoreActive) ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <MoreHorizontal className={cn('w-5 h-5', (moreOpen || isMoreActive) && 'drop-shadow-[0_0_6px_var(--accent-shadow)]')} />
            <span className="text-[10px] font-medium leading-none">More</span>
            <span
              className={cn('w-1 h-1 rounded-full mt-0.5 transition-colors', (moreOpen || isMoreActive) ? 'bg-accent' : 'bg-transparent')}
              aria-hidden="true"
            />
          </button>
        </div>
      </nav>
    </>
  )
}

