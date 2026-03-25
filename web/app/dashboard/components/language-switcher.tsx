'use client'

import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

export function LanguageSwitcher() {
  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
  ]

  const handleLanguageChange = (langCode: string) => {
    // Remove current locale from pathname
    const segments = pathname.split('/')
    let newPathname = pathname

    if (segments[1] && ['en', 'es', 'fr'].includes(segments[1])) {
      // Remove locale prefix
      newPathname = '/' + segments.slice(2).join('/')
    }

    // Add new locale prefix
    if (langCode !== 'en') {
      newPathname = `/${langCode}${newPathname}`
    }

    router.push(newPathname)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-text-primary mb-3">{t('settings.language')}</h3>
        <div className="flex gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="px-4 py-2 rounded-lg border border-border hover:bg-surface-secondary transition-colors text-sm"
              aria-label={`Switch to ${lang.label}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-text-secondary">
        {t('common.loading')} language will update the interface.
      </p>
    </div>
  )
}
