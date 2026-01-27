import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'KQuarks - AI-Powered Health Tracking & Insights',
    template: '%s | KQuarks',
  },
  description: 'Sync your Apple Health data to the cloud, visualize trends, and get AI-powered insights to optimize your wellness journey.',
  keywords: ['health tracking', 'apple health sync', 'health dashboard', 'AI health insights', 'fitness tracking', 'wellness analytics'],
  authors: [{ name: 'KQuarks' }],
  creator: 'KQuarks',
  metadataBase: new URL('https://kquarks.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kquarks.com',
    siteName: 'KQuarks',
    title: 'KQuarks - AI-Powered Health Tracking & Insights',
    description: 'Sync your Apple Health data to the cloud, visualize trends, and get AI-powered insights to optimize your wellness journey.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KQuarks - AI-Powered Health Tracking & Insights',
    description: 'Sync your Apple Health data to the cloud, visualize trends, and get AI-powered insights to optimize your wellness journey.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
