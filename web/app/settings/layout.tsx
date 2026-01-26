import { ThemeProvider } from '@/lib/theme/theme-provider'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ThemeProvider>{children}</ThemeProvider>
}
