import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Integrations – KQuarks' }

const PROVIDERS = [
  {
    id: 'strava',
    name: 'Strava',
    description: 'Sync workouts and activities from Strava',
    icon: '🏃',
    authorizeUrl: '/api/integrations/strava/authorize',
  },
  {
    id: 'garmin',
    name: 'Garmin',
    description: 'Sync data from Garmin Connect devices',
    icon: '⌚',
    authorizeUrl: '/api/integrations/garmin/authorize',
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    description: 'Connect activity, heart rate, and sleep from Fitbit',
    icon: '💪',
    authorizeUrl: '/api/integrations/fitbit/authorize',
  },
  {
    id: 'google-fit',
    name: 'Google Fit',
    description: 'Sync fitness and heart rate data from Google Fit',
    icon: '🎯',
    authorizeUrl: '/api/integrations/google-fit/authorize',
  },
  {
    id: 'oura',
    name: 'Oura Ring',
    description: 'Sync sleep, readiness, and activity from Oura',
    icon: '💍',
    authorizeUrl: '/api/integrations/oura/authorize',
  },
]

export default async function IntegrationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userIntegrations } = await supabase
    .from('user_integrations')
    .select('provider, is_active, last_sync')
    .eq('user_id', user.id)

  const connectedSet = new Set((userIntegrations ?? []).map((i) => i.provider))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-2xl p-4 py-8">
        <div className="mb-8">
          <Link
            href="/settings"
            className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            ← Settings
          </Link>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Connect your fitness platforms and wearables to KQuarks.
          </p>
        </div>

        <div className="grid gap-4">
          {PROVIDERS.map((provider) => {
            const connected = connectedSet.has(provider.id)
            const integration = (userIntegrations ?? []).find(
              (i) => i.provider === provider.id
            )

            return (
              <div
                key={provider.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{provider.icon}</span>
                  <div>
                    <p className="font-semibold">{provider.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {provider.description}
                    </p>
                    {connected && integration?.last_sync && (
                      <p className="mt-0.5 text-xs text-green-600 dark:text-green-400">
                        Last synced:{' '}
                        {new Date(integration.last_sync).toLocaleDateString()}
                      </p>
                    )}
                    {connected && !integration?.last_sync && (
                      <p className="mt-0.5 text-xs text-blue-500">
                        Connected — pending first sync
                      </p>
                    )}
                  </div>
                </div>

                {connected ? (
                  <form
                    action={`/api/integrations/${provider.id}/disconnect`}
                    method="POST"
                  >
                    <button
                      type="submit"
                      className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                    >
                      Disconnect
                    </button>
                  </form>
                ) : (
                  <a
                    href={provider.authorizeUrl}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Connect
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
