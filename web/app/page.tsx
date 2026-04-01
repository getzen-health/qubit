import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LandingPage } from './landing-client'

export const metadata: Metadata = {
  title: 'GetZen — Your Health, Quantified',
  description: 'Sync Apple Health data to the cloud, explore beautiful analytics, and get AI-powered insights about your health.',
  openGraph: {
    title: 'GetZen — Your Health, Quantified',
    description: 'Sync Apple Health data to the cloud, explore beautiful analytics, and get AI-powered insights about your health.',
    type: 'website',
    url: 'https://kquarks.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GetZen — Your Health, Quantified',
    description: 'Sync Apple Health data to the cloud, explore beautiful analytics, and get AI-powered insights about your health.',
  },
}

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <LandingPage />
}
