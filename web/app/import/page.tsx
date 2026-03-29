import type { Metadata } from 'next'
import { ImportClient } from './import-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata: Metadata = { title: 'Import Data | KQuarks' }

export default function ImportPage() {
  return (
    <>
      <ImportClient />
      <BottomNav />
    </>
  )
}
