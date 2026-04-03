import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SWRegister } from '@/components/sw-register'
import { WidgetProvider } from '@/lib/widgets/widget-context'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: {
    default: 'GetZen - AI-Powered Health Tracking & Insights',
    template: '%s | GetZen',
  },
  description: 'Sync your Apple Health data to the cloud, visualize trends, and get AI-powered insights to optimize your wellness journey.',
  keywords: ['health tracking', 'apple health sync', 'health dashboard', 'AI health insights', 'fitness tracking', 'wellness analytics'],
  authors: [{ name: 'GetZen' }],
  creator: 'GetZen',
  metadataBase: new URL('https://kquarks.com'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GetZen',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kquarks.com',
    siteName: 'GetZen',
    title: 'GetZen - AI-Powered Health Tracking & Insights',
    description: 'Sync your Apple Health data to the cloud, visualize trends, and get AI-powered insights to optimize your wellness journey.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'GetZen Health Dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GetZen - AI-Powered Health Tracking & Insights',
    description: 'Sync your Apple Health data to the cloud, visualize trends, and get AI-powered insights to optimize your wellness journey.',
    images: ['/og-image.png'],
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages()
  return (
    <html lang="en">
      <head>
        {/* Apply dark class before first paint to avoid flash of light mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}else if(t==='light'){document.documentElement.classList.add('light')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={inter.className}>
        <SWRegister />
        <WidgetProvider>
          <NextIntlClientProvider messages={messages}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm"
          >
            Skip to main content
          </a>
          <nav className="flex gap-4 items-center px-4 py-2 border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-40">
  <a href="/dashboard" className="text-primary font-bold hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">Dashboard</a>
  <a href="/challenges" className="ml-auto px-3 py-1.5 rounded-lg hover:bg-surface-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-sm font-medium" title="Challenges">🏆 Challenges</a>
</nav>
<div id="main-content">{children}</div>
<footer className="border-t border-border mt-16 py-6 px-4">
  <div className="max-w-3xl mx-auto flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-muted-foreground">
    <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
    <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
    <a href="/support" className="hover:text-foreground transition-colors">Support</a>
    <span className="hidden sm:inline">© {new Date().getFullYear()} GetZen</span>
  </div>
</footer>
          </NextIntlClientProvider>
        </WidgetProvider>
        <Analytics />
      </body>
    </html>
  )
}
