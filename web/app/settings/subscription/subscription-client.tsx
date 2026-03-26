'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, AlertCircle } from 'lucide-react'
import {
  SUBSCRIPTION_TIERS,
  FEATURE_ACCESS,
  formatPrice,
  SubscriptionTier,
} from '@/lib/subscription'

interface SubscriptionClientProps {
  userId: string
  currentTier: string
}

export default function SubscriptionClient({
  userId,
  currentTier,
}: SubscriptionClientProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const tiers: SubscriptionTier[] = ['free', 'pro', 'team']

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === currentTier) return

    setError(null)
    setSuccess(null)

    // TODO: Integrate with Stripe or payment provider
    alert(`Upgrade to ${tier} feature coming soon!`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl p-4">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/settings"
            className="rounded-lg p-2 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Subscription Plan</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage your subscription and features
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 flex gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 flex gap-3 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <Check className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* Current Plan Banner */}
        <div className="mb-8 rounded-xl border-2 border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                Current Plan: {SUBSCRIPTION_TIERS[currentTier as SubscriptionTier].name}
              </h2>
              <p className="mt-1 text-blue-700 dark:text-blue-300">
                {SUBSCRIPTION_TIERS[currentTier as SubscriptionTier].description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {formatPrice(SUBSCRIPTION_TIERS[currentTier as SubscriptionTier].priceMonthly)}
              </p>
            </div>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Features Comparison</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {tiers.map((tier) => {
              const tierData = SUBSCRIPTION_TIERS[tier]
              const features = Array.from(FEATURE_ACCESS[tier])

              return (
                <div
                  key={tier}
                  className={`rounded-xl border-2 p-6 transition ${
                    tier === currentTier
                      ? 'border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                  }`}
                >
                  <div className="mb-6">
                    <h3 className="text-xl font-bold">{tierData.name}</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {tierData.description}
                    </p>
                    <p className="mt-4 text-2xl font-bold">
                      {formatPrice(tierData.priceMonthly)}
                    </p>
                  </div>

                  {tier === currentTier ? (
                    <button
                      disabled
                      className="mb-6 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white opacity-50"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(tier)}
                      className="mb-6 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      {tier === 'free' ? 'Downgrade' : 'Upgrade'}
                    </button>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-semibold">Features:</h4>
                    <ul className="space-y-2">
                      {features.slice(0, 8).map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                          <span className="capitalize text-slate-700 dark:text-slate-300">
                            {feature.replace(/_/g, ' ')}
                          </span>
                        </li>
                      ))}
                      {features.length > 8 && (
                        <li className="text-xs text-slate-600 dark:text-slate-400">
                          +{features.length - 8} more features
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Limits Details */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
          <h3 className="mb-4 font-semibold">Plan Limits</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {tiers.map((tier) => {
              const tierData = SUBSCRIPTION_TIERS[tier]
              return (
                <div key={tier} className="rounded-lg bg-white p-4 dark:bg-slate-700">
                  <h4 className="font-semibold">{tierData.name}</h4>
                  <div className="mt-3 space-y-2 text-sm">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">History</p>
                      <p className="font-medium">
                        {tierData.historyDays === 36500 ? 'Unlimited' : `${tierData.historyDays} days`}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Daily Insights</p>
                      <p className="font-medium">
                        {tierData.insightsPerDay === 999 ? 'Unlimited' : tierData.insightsPerDay}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
