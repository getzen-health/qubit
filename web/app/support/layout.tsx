import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with GetZen — FAQs, contact, and resources.',
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
