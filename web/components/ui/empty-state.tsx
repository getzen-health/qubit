import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  /** Accepts either a LucideIcon component or any ReactNode (e.g. an emoji) */
  icon?: LucideIcon | ReactNode
  title: string
  description?: string
  action?: ReactNode | { label: string; onClick: () => void }
}

function isLucideIcon(icon: unknown): icon is LucideIcon {
  return typeof icon === 'function'
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const iconEl = icon
    ? isLucideIcon(icon)
      ? (() => { const Icon = icon as LucideIcon; return <Icon className="h-8 w-8 text-muted-foreground" /> })()
      : icon as ReactNode
    : null

  const actionEl =
    action && typeof action === 'object' && 'label' in (action as object) && 'onClick' in (action as object)
      ? (() => {
          const { label, onClick } = action as { label: string; onClick: () => void }
          return (
            <button
              onClick={onClick}
              className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              {label}
            </button>
          )
        })()
      : (action as ReactNode)

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      {iconEl && (
        <div className="rounded-full bg-muted p-4">{iconEl}</div>
      )}
      <div>
        <p className="font-semibold text-lg">{title}</p>
        {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
      </div>
      {actionEl}
    </div>
  )
}
