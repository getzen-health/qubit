import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Palette,
  User,
  Target,
  ChevronRight,
  ArrowLeft,
  Download,
  Sparkles,
  RefreshCw,
  Bell,
  Upload,
  Lock,
} from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const settingsSections = [
    {
      title: 'Appearance',
      description: 'Theme, colors, and display preferences',
      href: '/settings/appearance',
      icon: Palette,
    },
    {
      title: 'Account',
      description: 'Profile and account settings',
      href: '/settings/account',
      icon: User,
    },
    {
      title: 'Privacy & Sharing',
      description: 'Control what data you share with friends',
      href: '/settings/privacy',
      icon: Lock,
    },
    {
      title: 'Goals',
      description: 'Configure daily step goal and targets',
      href: '/settings/goals',
      icon: Target,
    },
    {
      title: 'Notifications',
      description: 'Alerts, reminders, and thresholds',
      href: '/settings/notifications',
      icon: Bell,
    },
    {
      title: 'AI Insights',
      description: 'Claude API key for generating insights',
      href: '/settings/ai',
      icon: Sparkles,
    },
    {
      title: 'Sync Status',
      description: 'Data coverage, devices, and sync health',
      href: '/sync',
      icon: RefreshCw,
    },
    {
      title: 'Import Data',
      description: 'Bulk import historical Apple Health data',
      href: '/settings/import',
      icon: Upload,
    },
    {
      title: 'Export Health Data',
      description: 'Download health data as CSV or JSON',
      href: '/settings/data-export',
      icon: Download,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <h1 className="text-xl font-bold text-text-primary">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="space-y-2">
          {settingsSections.map((section) => {
            const Icon = section.icon
            return (
              <Link
                key={section.href}
                href={section.href}
                className="flex items-center gap-4 p-4 bg-surface rounded-lg border border-border hover:bg-surface-secondary transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{section.title}</p>
                  <p className="text-sm text-text-secondary">{section.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-tertiary" />
              </Link>
            )
          })}
        </div>

        {/* Export data */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Export Data</h2>
          <div className="space-y-2">
            {[
              { label: 'Daily Summaries', desc: 'Steps, calories, HRV, sleep, weight', type: 'daily' },
              { label: 'Workouts', desc: 'All workout sessions', type: 'workouts' },
              { label: 'Sleep Records', desc: 'Night-by-night sleep data', type: 'sleep' },
              { label: 'Nutrition Logs', desc: 'Meals, food items, and macros', type: 'nutrition' },
              { label: 'Hydration', desc: 'Daily water intake logs', type: 'water' },
              { label: 'Fasting Sessions', desc: 'Intermittent fasting history', type: 'fasting' },
              { label: 'Daily Check-ins', desc: 'Energy, mood, and stress logs', type: 'checkins' },
              { label: 'Habits', desc: 'Habit completions history', type: 'habits' },
            ].map(({ label, desc, type }) => (
              <a
                key={type}
                href={`/api/export?type=${type}`}
                download
                className="flex items-center gap-4 p-4 bg-surface rounded-lg border border-border hover:bg-surface-secondary transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{label}</p>
                  <p className="text-sm text-text-secondary">{desc}</p>
                </div>
                <span className="text-xs text-text-secondary font-mono">.csv</span>
              </a>
            ))}
          </div>
        </div>

        {/* User Info */}
        <div className="mt-8 p-4 bg-surface-secondary rounded-lg text-center">
          <p className="text-sm text-text-secondary">Signed in as</p>
          <p className="font-medium text-text-primary">{user.email}</p>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
