import Link from 'next/link'
import { Lock } from 'lucide-react'

interface PaywallBannerProps {
  feature: string
}

/**
 * Banner shown on Pro-gated UI sections.
 * Wrap any Pro-only element with this component.
 */
export function PaywallBanner({ feature }: PaywallBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
      <Lock className="w-5 h-5 shrink-0 text-text-secondary" />
      <p className="flex-1 text-sm text-text-secondary">
        <span className="font-medium text-text-primary">{feature}</span> is a Pro
        feature —{' '}
        <span className="font-semibold text-accent">$4.99/mo</span>
      </p>
      <Link
        href="/settings#subscription"
        className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
      >
        Upgrade
      </Link>
    </div>
  )
}
