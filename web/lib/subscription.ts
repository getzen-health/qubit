/**
 * Subscription and feature access helpers
 * Manages subscription tiers and feature access control
 */

import { useState, useEffect } from 'react'

export type SubscriptionTier = 'free' | 'pro' | 'team'

// Feature definitions by tier
export const FEATURE_ACCESS: Record<SubscriptionTier, Set<string>> = {
  free: new Set([
    'basic_tracking',
    'health_dashboard',
    'limited_history', // 30 days
    'one_insight_per_day',
    'csv_export',
  ]),
  pro: new Set([
    'basic_tracking',
    'health_dashboard',
    'unlimited_history',
    'unlimited_insights',
    'csv_export',
    'pdf_export',
    'advanced_analytics',
    'workout_sync',
    'api_access',
  ]),
  team: new Set([
    'basic_tracking',
    'health_dashboard',
    'unlimited_history',
    'unlimited_insights',
    'csv_export',
    'pdf_export',
    'advanced_analytics',
    'workout_sync',
    'api_access',
    'team_management',
    'team_sharing',
  ]),
}

// Subscription tier details
export const SUBSCRIPTION_TIERS: Record<
  SubscriptionTier,
  {
    name: string
    description: string
    priceMonthly: number | null // in cents
    historyDays: number
    insightsPerDay: number
  }
> = {
  free: {
    name: 'Free',
    description: 'Perfect for getting started',
    priceMonthly: null,
    historyDays: 30,
    insightsPerDay: 1,
  },
  pro: {
    name: 'Pro',
    description: 'Unlimited everything',
    priceMonthly: 999, // $9.99/month
    historyDays: 36500, // ~100 years
    insightsPerDay: 999,
  },
  team: {
    name: 'Team',
    description: 'For organizations',
    priceMonthly: 2999, // $29.99/month
    historyDays: 36500,
    insightsPerDay: 999,
  },
}

/**
 * Check if a user has access to a feature
 */
export function hasFeatureAccess(
  tier: SubscriptionTier,
  feature: string
): boolean {
  return FEATURE_ACCESS[tier]?.has(feature) ?? false
}

/**
 * Get the subscription tier for a user from the database
 * This should be called from a server component or server action
 */
export async function getUserTier(
  supabase: any,
  userId: string
): Promise<SubscriptionTier> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (error || !user) {
      console.error('Failed to fetch user tier:', error)
      return 'free'
    }

    return (user.subscription_tier as SubscriptionTier) || 'free'
  } catch (error) {
    console.error('Error getting user tier:', error)
    return 'free'
  }
}

/**
 * Check feature access for a user
 */
export async function checkFeatureAccess(
  supabase: any,
  userId: string,
  feature: string
): Promise<boolean> {
  const tier = await getUserTier(supabase, userId)
  return hasFeatureAccess(tier, feature)
}

/**
 * Get feature availability details
 */
export function getFeatureDetails(feature: string) {
  const details: Record<
    string,
    {
      name: string
      description: string
      minimumTier: SubscriptionTier
    }
  > = {
    unlimited_history: {
      name: 'Unlimited History',
      description: 'Access to all your health data without time limit',
      minimumTier: 'pro',
    },
    unlimited_insights: {
      name: 'Unlimited AI Insights',
      description: 'Generate unlimited daily AI-powered health insights',
      minimumTier: 'pro',
    },
    advanced_analytics: {
      name: 'Advanced Analytics',
      description: 'Deep-dive analytics and correlations in your health data',
      minimumTier: 'pro',
    },
    workout_sync: {
      name: 'Workout Integrations',
      description: 'Sync workouts from Strava, Garmin, Fitbit, and more',
      minimumTier: 'pro',
    },
    pdf_export: {
      name: 'PDF Reports',
      description: 'Export your health data as professional PDF reports',
      minimumTier: 'pro',
    },
    api_access: {
      name: 'API Access',
      description: 'Access your health data via REST API',
      minimumTier: 'pro',
    },
    team_management: {
      name: 'Team Management',
      description: 'Manage team members and permissions',
      minimumTier: 'team',
    },
    team_sharing: {
      name: 'Data Sharing',
      description: 'Share health metrics with team members',
      minimumTier: 'team',
    },
  }

  return details[feature] || null
}

/**
 * Format price for display
 */
export function formatPrice(cents: number | null): string {
  if (cents === null) return 'Free'
  return `$${(cents / 100).toFixed(2)}/mo`
}

/**
 * React hook — returns true when the current user has an active Pro subscription.
 * Reads `user_profiles.is_pro` from Supabase.
 * Must be called from a Client Component.
 */
export function useIsPro(): boolean {
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      if (!supabase) return
      supabase.auth.getUser().then(async ({ data }: { data: { user: { id: string } | null } }) => {
        if (!data.user) return
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_pro')
          .eq('user_id', data.user.id)
          .single()
        if (profile?.is_pro) setIsPro(true)
      })
    })
  }, [])

  return isPro
}

/**
 * Server-side Pro check — reads `user_profiles.is_pro` for the given user.
 * Pass the server Supabase client as `supabaseClient`.
 */
export async function getIsProServer(
  supabaseClient: any,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabaseClient
      .from('user_profiles')
      .select('is_pro')
      .eq('user_id', userId)
      .single()
    return data?.is_pro === true
  } catch {
    return false
  }
}
