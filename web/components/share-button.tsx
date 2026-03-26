'use client'
import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

interface ShareButtonProps {
  title: string
  text: string
  url?: string
  className?: string
}

export function ShareButton({ title, text, url, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  
  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '')
  
  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl })
        return
      } catch {}
    }
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(`${text}\n${shareUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-sm font-medium hover:bg-surface-secondary transition-colors ${className}`}
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}
