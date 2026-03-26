'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader, Check, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Integration {
  id: string
  user_id: string
  provider: string
  is_active: boolean
  last_sync: string | null
  created_at: string
}

interface IntegrationProvider {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  status: 'active' | 'coming_soon'
  lastSync?: string | null
  oauthUrl?: string
}

export default function IntegrationsClient({
  userId,
  existingIntegrations,
}: {
  userId: string
  existingIntegrations: Integration[]
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const integrationMap = new Map(
    existingIntegrations.map((i) => [i.provider, i])
  )

  const providers: IntegrationProvider[] = [
    {
      id: 'strava',
      name: 'Strava',
      description: 'Connect your Strava workouts and activities',
      icon: '🏃',
      status: 'active',
      lastSync: integrationMap.get('strava')?.last_sync,
      oauthUrl: `/api/integrations/strava?returnUrl=${encodeURIComponent(
        '/settings/integrations'
      )}`,
    },
    {
      id: 'garmin',
      name: 'Garmin',
      description: 'Sync data from your Garmin Connect devices',
      icon: '⌚',
      status: 'active',
      lastSync: integrationMap.get('garmin')?.last_sync,
      oauthUrl: '/api/integrations/garmin/authorize',
    },
    {
      id: 'fitbit',
      name: 'Fitbit',
      description: 'Connect activity, heart rate, and sleep from Fitbit',
      icon: '💪',
      status: 'active',
      lastSync: integrationMap.get('fitbit')?.last_sync,
      oauthUrl: '/api/integrations/fitbit/authorize',
    },
    {
      id: 'oura',
      name: 'Oura Ring',
      description: 'Sync sleep, readiness, and activity from Oura',
      icon: '💍',
      status: 'active',
      lastSync: integrationMap.get('oura')?.last_sync,
      oauthUrl: '/api/integrations/oura/authorize',
    },
    {
      id: 'google-fit',
      name: 'Google Fit',
      description: 'Connect fitness and heart rate data from Google Fit',
      icon: '🎯',
      status: 'active',
      lastSync: integrationMap.get('google-fit')?.last_sync,
      oauthUrl: '/api/integrations/google-fit/authorize',
    },
    {
      id: 'apple-health',
      name: 'Apple Health',
      description: 'Auto-sync with Apple Health (iOS only)',
      icon: '🍎',
      status: 'coming_soon',
    },
  ]

  const handleConnect = async (provider: string, oauthUrl?: string) => {
    if (!oauthUrl) return

    setIsLoading(true)
    setError(null)
    try {
      window.location.href = oauthUrl
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect integration'
      )
      setIsLoading(false)
    }
  }

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/integrations/${provider}/disconnect`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      setSuccess(`${provider} disconnected`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncNow = async (provider: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/integrations/${provider}/sync`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Sync failed')
      }

      const result = await response.json()
      setSuccess(`${result.message} (${result.syncedCount} synced, ${result.skippedCount} skipped)`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-2xl p-4">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/settings"
            className="rounded-lg p-2 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Integrations</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Connect third-party fitness and wearable services
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
            <p className="text-sm text-green-800 dark:text-green-200">
              {success}
            </p>
          </div>
        )}

        {/* Integrations Grid */}
        <div className="grid gap-4">
          {providers.map((provider) => {
            const isConnected = integrationMap.has(provider.id)
            const integration = integrationMap.get(provider.id)

            return (
              <div
                key={provider.id}
                className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{provider.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold">{provider.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {provider.description}
                      </p>
                      {isConnected && integration?.last_sync && (
                        <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                          ✓ Last synced:{' '}
                          {new Date(integration.last_sync).toLocaleDateString()}
                        </p>
                      )}
                      {isConnected && !integration?.last_sync && (
                        <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                          ✓ Connected (pending first sync)
                        </p>
                      )}
                    </div>
                  </div>

                  {provider.status === 'active' ? (
                    isConnected ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSyncNow(provider.id)}
                          disabled={isLoading}
                          className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                        >
                          {isLoading ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            'Sync Now'
                          )}
                        </button>
                        <button
                          onClick={() => handleDisconnect(provider.id)}
                          disabled={isLoading}
                          className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        >
                          {isLoading ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            'Disconnect'
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          handleConnect(provider.id, provider.oauthUrl)
                        }
                        disabled={isLoading}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          'Connect'
                        )}
                      </button>
                    )
                  ) : (
                    <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                      Coming Soon
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
          <h3 className="mb-3 font-semibold">How integrations work</h3>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li>
              • OAuth: We securely connect to your provider account via their
              official OAuth flow
            </li>
            <li>
              • No passwords stored: Your credentials remain secure with the
              provider
            </li>
            <li>
              • Auto-sync: Data syncs automatically on a scheduled basis
            </li>
            <li>
              • Revoke anytime: Disconnect integrations at any time from this
              page
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
