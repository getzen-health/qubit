'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, Activity, Moon, Dumbbell, TrendingUp, MoreHorizontal, Utensils, Droplets, ShieldAlert, BarChart2, ScanBarcode, BookOpen, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/steps', icon: Activity, label: 'Activity' },
  { href: '/sleep', icon: Moon, label: 'Sleep' },
  { href: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { href: '/trends', icon: TrendingUp, label: 'Trends' },
]

const moreItems = [
  { href: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { href: '/water', icon: Droplets, label: 'Water' },
  { href: '/food/scanner', icon: ScanBarcode, label: 'Food Scan' },
  { href: '/food/diary', icon: BookOpen, label: 'Food Diary' },
  { href: '/injury-risk', icon: ShieldAlert, label: 'Injury Risk' },
  { href: '/compare', icon: BarChart2, label: 'Compare' },
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

