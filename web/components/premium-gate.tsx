'use client'
interface PremiumGateProps {
  feature: string
  children: React.ReactNode
  isPro?: boolean
}
export function PremiumGate({ feature, children, isPro = false }: PremiumGateProps) {
  if (isPro) return <>{children}</>
  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
        <div className="text-center space-y-2 p-4">
          <p className="text-2xl">⭐</p>
          <p className="font-semibold">Pro Feature</p>
          <p className="text-sm text-muted-foreground">{feature} requires KQuarks Pro</p>
          <a href="/upgrade" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Upgrade to Pro
          </a>
        </div>
      </div>
    </div>
  )
}
