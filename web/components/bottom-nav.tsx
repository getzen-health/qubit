'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Moon, Dumbbell, MoreHorizontal, Utensils, Droplets,
  ShieldAlert, BarChart2, ScanBarcode, BookOpen, X, Users, CalendarRange,
  Sparkles, Pill, Trophy, Bot, FlaskConical, Camera, CheckSquare,
  Wind, Heart, BedDouble, Download, Upload, Scale, Ruler, Activity,
  Stethoscope, Brain, Leaf, Zap, Dna, Thermometer, Flame, Eye,
  Wine, Flower2, UtensilsCrossed, Package, Clock, Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Primary bottom bar — most-used daily features
const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/sleep', icon: Moon, label: 'Sleep' },
  { href: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { href: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { href: '/insights', icon: BarChart2, label: 'Insights' },
]

// "More" sheet — secondary features grouped logically
const moreItems = [
  // Daily tracking
  { href: '/hydration', icon: Droplets, label: 'Hydration' },
  { href: '/mood', icon: '😊', label: 'Mood' },
  { href: '/stress', icon: Wind, label: 'Stress' },
  { href: '/habits', icon: CheckSquare, label: 'Habits' },
  { href: '/journal', icon: BookOpen, label: 'Journal' },
  { href: '/goals', icon: '🎯', label: 'Goals' },
  // Health metrics
  { href: '/heartrate', icon: Heart, label: 'Heart Rate' },
  { href: '/hrv', icon: Activity, label: 'HRV' },
  { href: '/blood-pressure', icon: ShieldAlert, label: 'BP' },
  { href: '/glucose', icon: '🩸', label: 'Glucose' },
  { href: '/sleep-analytics', icon: BedDouble, label: 'Sleep+' },
  { href: '/vo2max', icon: Wind, label: 'VO2 Max' },
  // Nutrition & food
  { href: '/food/scanner', icon: ScanBarcode, label: 'Food Scan' },
  { href: '/food/diary', icon: BookOpen, label: 'Food Diary' },
  { href: '/meal-planner', icon: UtensilsCrossed, label: 'Meal Plan' },
  { href: '/supplements', icon: '💊', label: 'Supplements' },
  { href: '/fasting', icon: Clock, label: 'Fasting' },
  { href: '/caffeine', icon: '☕', label: 'Caffeine' },
  // Body & health
  { href: '/body', icon: '⚖️', label: 'Body' },
  { href: '/body-measurements', icon: Ruler, label: 'Measurements' },
  { href: '/medications', icon: Pill, label: 'Medications' },
  { href: '/labs', icon: '🧪', label: 'Labs' },
  { href: '/symptoms', icon: Stethoscope, label: 'Symptoms' },
  { href: '/cycle', icon: CalendarRange, label: 'Cycle' },
  // Fitness
  { href: '/running', icon: '🏃', label: 'Running' },
  { href: '/cycling', icon: '🚴', label: 'Cycling' },
  { href: '/swimming', icon: '🏊', label: 'Swimming' },
  { href: '/steps', icon: '👟', label: 'Steps' },
  { href: '/hr-zones', icon: Heart, label: 'HR Zones' },
  { href: '/readiness', icon: Zap, label: 'Readiness' },
  // Wellbeing
  { href: '/mental-health', icon: Brain, label: 'Wellbeing' },
  { href: '/mindfulness', icon: Leaf, label: 'Mindfulness' },
  { href: '/cognitive', icon: Brain, label: 'Cognitive' },
  { href: '/sun-exposure', icon: '☀️', label: 'Sun' },
  { href: '/environment', icon: Wind, label: 'Air & UV' },
  // Longevity & analytics
  { href: '/longevity', icon: Dna, label: 'Longevity' },
  { href: '/biological-age', icon: Dna, label: 'Bio Age' },
  { href: '/correlations', icon: BarChart2, label: 'Patterns' },
  { href: '/streaks', icon: Trophy, label: 'Streaks' },
  { href: '/achievements', icon: Trophy, label: 'Awards' },
  // Tools
  { href: '/coach', icon: Bot, label: 'AI Coach' },
  { href: '/scanner/history', icon: Package, label: 'Scan History' },
  { href: '/import', icon: Upload, label: 'Import' },
  { href: '/export', icon: Download, label: 'Export' },
  { href: '/social', icon: Users, label: 'Social' },
  { href: '/profile', icon: '👤', label: 'Profile' },
  { href: '/settings', icon: MoreHorizontal, label: 'Settings' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive = moreItems.some(({ href }) => pathname === href || pathname.startsWith(href))

  return (
    <>
      {/* More overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMoreOpen(false)}
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
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">More</span>
            <button onClick={() => setMoreOpen(false)} className="p-1 rounded-lg hover:bg-surface-secondary" aria-label="Close menu">
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
            {moreItems.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors',
                    active
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-border/80'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-medium">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border safe-bottom">
        <div className="flex items-center justify-around px-2 py-2 max-w-2xl mx-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0',
                  active
                    ? 'text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_var(--accent-shadow)]')} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            )
          })}
          {/* More button */}
          <button
            aria-label="More navigation options"
            onClick={() => setMoreOpen((o) => !o)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0',
              (moreOpen || isMoreActive) ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <MoreHorizontal className={cn('w-5 h-5', (moreOpen || isMoreActive) && 'drop-shadow-[0_0_6px_var(--accent-shadow)]')} />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}

