import { PrivacyClient } from "./privacy-client"

export const metadata = { title: "Privacy Settings" }

import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export default function PrivacyPage() {
  return (
    <main className="container mx-auto max-w-lg px-4 py-8">
      <Breadcrumbs items={[{label:'Settings',href:'/settings'},{label:'Privacy'}]} />
      <h1 className="text-2xl font-bold text-white mb-6">Privacy & Sharing</h1>
      <PrivacyClient />
    </main>
  )
}
