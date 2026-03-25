'use client'

import { useTranslations } from 'next-intl'
import { Settings, LogOut, Share2 } from 'lucide-react'
import Link from 'next/link'

export function DashboardHeader({ onShare, onSignOut }: { onShare: () => void, onSignOut: () => void }) {
  const t = useTranslations()

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">
          {t('dashboard.title')}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onShare}
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            title={t('common.save')}
            aria-label="Share health snapshot"
          >
            <Share2 className="w-5 h-5 text-text-secondary" />
          </button>
          <Link
            href="/settings"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            title={t('settings.title')}
            aria-label={t('settings.title')}
          >
            <Settings className="w-5 h-5 text-text-secondary" />
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            title={t('common.cancel')}
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
      </div>
    </header>
  )
}
