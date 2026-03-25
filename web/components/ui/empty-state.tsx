import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 text-6xl opacity-50">{icon}</div>}
      <h2 className="text-2xl font-bold text-text-primary mb-2">{title}</h2>
      {description && <p className="text-text-secondary mb-6 max-w-sm">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
