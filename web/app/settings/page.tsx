import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Palette,
  LayoutDashboard,
  User,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react'

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
      title: 'Dashboard',
      description: 'Customize widgets and layout',
      href: '/settings/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Account',
      description: 'Profile and account settings',
      href: '/settings/account',
      icon: User,
    },
    {
      title: 'Notifications',
      description: 'Manage notification preferences',
      href: '/settings/notifications',
      icon: Bell,
    },
    {
      title: 'Privacy',
      description: 'Data and privacy settings',
      href: '/settings/privacy',
      icon: Shield,
    },
    {
      title: 'Help',
      description: 'Support and documentation',
      href: '/settings/help',
      icon: HelpCircle,
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
      <main className="max-w-2xl mx-auto px-4 py-6">
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

        {/* User Info */}
        <div className="mt-8 p-4 bg-surface-secondary rounded-lg text-center">
          <p className="text-sm text-text-secondary">Signed in as</p>
          <p className="font-medium text-text-primary">{user.email}</p>
        </div>
      </main>
    </div>
  )
}
