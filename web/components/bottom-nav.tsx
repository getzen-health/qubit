'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, Activity, Moon, Dumbbell, TrendingUp, MoreHorizontal, Utensils, Droplets, ShieldAlert, BarChart2, ScanBarcode, BookOpen, X, Users, CalendarRange, Sparkles, Pill, Smile, Package, Trophy, Bot, ChefHat, FlaskConical, Camera, CheckCircle2, AlertTriangle, Clock, Stethoscope, Ruler, Brain, Leaf, Zap, Dna, Upload, Heart, BedDouble, Download, CheckSquare, Wind, Eye, Flame, Shield, PersonStanding, Thermometer, FlameKindling, Crosshair, Wine, Plane, Flower2, UtensilsCrossed, Scale } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/cognitive', icon: Brain, label: 'Cognitive' },
  { href: '/gut', label: 'Gut', icon: Activity },
  { href: '/mental-health', label: 'Wellbeing', icon: '🧠' },
  { href: '/share', label: 'Share', icon: '📤' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/recovery', icon: Activity, label: 'Recovery' },
  { href: '/coach/chat', icon: Bot, label: 'Coach' },
  { href: '/coach', icon: Sparkles, label: 'AI Coach' },
  { href: '/financial', icon: TrendingUp, label: 'Financial' },
  { href: '/challenges', icon: TrendingUp, label: 'Challenges' },
  { href: '/training', icon: CalendarRange, label: 'Training' },
  { href: '/water', icon: Droplets, label: 'Water' },
  { href: '/hydration-science', icon: FlaskConical, label: 'Hydration' },
  { href: '/dental', icon: Smile, label: 'Dental' },
  { href: '/mood', icon: Smile, label: 'Mood' },
  { href: '/journal', icon: BookOpen, label: 'Journal' },
  // { href: '/workouts', icon: Run, label: 'Workouts' },
  { href: '/habits', icon: CheckSquare, label: 'Habits' },
  { href: '/streaks', icon: Trophy, label: 'Streaks' },
  { href: '/progress', icon: Camera, label: 'Photos' },
  { href: '/functional-fitness', icon: Activity, label: 'Func. Age' },
  { href: '/vo2max', icon: Wind, label: 'VO2max' },
  { href: '/stress', icon: Wind, label: 'Stress' },
  { href: '/cycle', icon: CalendarRange, label: 'Cycle' },
  { href: '/blood-pressure', icon: ShieldAlert, label: 'Blood Pressure' },
  { href: '/sleep', icon: Moon, label: 'Sleep' },
  { href: '/sleep-analytics', icon: BedDouble, label: 'Sleep+' },
  { href: '/sleep-apnea-screener', icon: Moon, label: 'Sleep Screen' },
  { href: '/sleep-environment', icon: Moon, label: 'Sleep Env' },
  { href: '/thermal', label: 'Thermal', icon: Thermometer },
  { href: '/environment', label: 'Air', icon: '🌬️' },
  { href: '/environmental', icon: Leaf, label: 'Toxins' },
  { href: '/sun-exposure', label: 'Sun', icon: '☀️' },
  { href: '/circadian', label: 'Circadian', icon: '🦁' },
  { href: '/lab-results', label: 'Labs', icon: '🧪' },
  { href: '/breathing', label: 'Breathe', icon: Wind },
  { href: '/body', label: 'Body', icon: '⚖️' },
  { href: '/pain-science', label: 'Pain Science', icon: Brain },
  { href: '/injuries', label: 'Injuries', icon: '🩹' },
  { href: '/injury', icon: ShieldAlert, label: 'Injury' },
  { href: '/fasting', label: 'Fast', icon: Clock },
  { href: '/supplements', label: 'Supplements', icon: '💊' },
  { href: '/alcohol', label: 'Alcohol', icon: '🍷' },
  { href: '/insights', icon: BarChart2, label: 'Insights' },
  { href: '/insights/benchmarks', icon: BarChart2, label: 'Benchmarks' },
  { href: '/insights/correlations', label: 'Patterns', icon: '📊' },
  { href: '/symptoms', icon: Stethoscope, label: 'Symptoms' },
  { href: '/immune', icon: Shield, label: 'Immune' },
  { href: '/meal-plan', icon: ChefHat, label: 'Meal Plan' },
  { href: '/reports', label: 'Reports', icon: '📋' },
  { href: '/goals', label: 'Goals', icon: '🎯' },
  { href: '/longevity', label: 'Longevity', icon: '🔬' },
  { href: '/biological-age', icon: Dna, label: 'Bio Age' },
  { href: '/energy', icon: Zap, label: 'Energy' },
  { href: '/hormones', icon: FlaskConical, label: 'Hormones' },
  { href: '/metabolic', icon: Flame, label: 'Metabolic' },
  { href: '/eye-health', icon: Eye, label: 'Eye Health' },
  { href: '/skin', icon: Sparkles, label: 'Skin' },
  { href: '/posture', label: 'Breaks', icon: '🪑' },
  { href: '/posture-rehab', label: 'Posture Rehab', icon: PersonStanding },
  { href: '/deep-work', icon: Crosshair, label: 'Focus' },
  { href: '/settings', icon: MoreHorizontal, label: 'Settings' },
]

const moreItems = [
  { href: '/labs', icon: FlaskConical, label: 'Lab Results' },
  { href: '/longevity', icon: Dna, label: 'Longevity' },
  { href: '/mindfulness', icon: Leaf, label: 'Mindfulness' },
  { href: '/import', icon: Upload, label: 'Import' },
  { href: '/export', icon: Download, label: 'Export' },
  { href: '/biometrics', icon: Scale, label: 'Biometrics' },
  { href: '/bmi', icon: BarChart2, label: 'BMI' },
  { href: '/social', icon: Users, label: 'Social' },
  { href: '/nutrition/targets', icon: () => <span className="text-xl">🍎</span>, label: 'Macros' },
  { href: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { href: '/micronutrients', icon: Leaf, label: 'Nutrients' },
  { href: '/nutrition/insights', label: 'Diet Report', icon: '🍽️' },
  { href: '/hr-zones', icon: Heart, label: 'HR Zones' },
  { href: '/pace-zones', icon: BarChart2, label: 'Pace Zones' },
  { href: '/endurance', icon: Zap, label: 'Endurance' },
  { href: '/athletic-performance', icon: Trophy, label: 'Athletics' },
  { href: '/upgrade', icon: Sparkles, label: 'Upgrade' },
  { href: '/water', icon: Droplets, label: 'Water' },
  { href: '/measurements', icon: BookOpen, label: 'Measurements' },
  { href: '/body-measurements', icon: Ruler, label: 'Body Size' },
  { href: '/supplements', icon: Pill, label: 'Supplements' },
  { href: '/medications', icon: Pill, label: 'Medications' },
  { href: '/medication-adherence', icon: Pill, label: 'Med Adherence' },
  { href: '/food/scanner', icon: ScanBarcode, label: 'Food Scan' },
  { href: '/cosmetics/scanner', icon: FlaskConical, label: 'Cosmetics Scan' },
  { href: '/scanner/history', icon: Package, label: 'Scan History' },
  { href: '/food-diary', icon: BookOpen, label: 'Food Diary' },
  { href: '/journal', icon: BookOpen, label: 'Journal' },
  { href: '/meal-planner', icon: UtensilsCrossed, label: 'Meal Planner' },
  { href: '/food/planner', icon: CalendarRange, label: 'Meal Planner' },
  { href: '/mobility', icon: Activity, label: 'Mobility' },
  { href: '/injury-risk', icon: ShieldAlert, label: 'Injury Risk' },
  { href: '/compare', icon: BarChart2, label: 'Compare' },
  { href: '/inflammation', icon: FlameKindling, label: 'Inflammation' },
  { href: '/alcohol', icon: Wine, label: 'Alcohol' },
  { href: '/travel', icon: Plane, label: 'Travel' },
  { href: '/womens-health', icon: Flower2, label: "Women's Health" },
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
          <div className="grid grid-cols-3 gap-2">
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

