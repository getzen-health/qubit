'use client'

import { MessageSquare } from 'lucide-react'

interface AnnotationIndicatorProps {
  hasAnnotation: boolean
  onClick?: () => void
  tooltipText?: string
  className?: string
}

export function AnnotationIndicator({
  hasAnnotation,
  onClick,
  tooltipText = 'View note',
  className = '',
}: AnnotationIndicatorProps) {
  if (!hasAnnotation) return null

  return (
    <button
      onClick={onClick}
      title={tooltipText}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent/10 hover:bg-accent/20 transition-colors ${className}`}
    >
      <MessageSquare className="w-4 h-4 text-accent" />
    </button>
  )
}

export function AnnotationDot({ className = '' }: { className?: string }) {
  return (
    <div className={`w-1.5 h-1.5 rounded-full bg-accent ${className}`} />
  )
}
