'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function KeyboardShortcuts() {
  const router = useRouter()
  
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only trigger if not in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      if (e.key === 'g') {
        // g+d = go to dashboard, g+s = scanner, etc.
        const handleSecond = (e2: KeyboardEvent) => {
          document.removeEventListener('keydown', handleSecond)
          if (e2.key === 'd') router.push('/dashboard')
          else if (e2.key === 's') router.push('/scanner')
          else if (e2.key === 'f') router.push('/food/log')
          else if (e2.key === 'i') router.push('/insights')
          else if (e2.key === 'p') router.push('/profile')
        }
        document.addEventListener('keydown', handleSecond)
        setTimeout(() => document.removeEventListener('keydown', handleSecond), 1000)
      }
      
      if (e.key === '?' && e.shiftKey) {
        // Show keyboard shortcut help
        const dialog = document.getElementById('kbd-shortcuts-dialog')
        if (dialog instanceof HTMLDialogElement) dialog.showModal()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router])
  
  return (
    <dialog id="kbd-shortcuts-dialog" className="rounded-xl p-6 shadow-xl border border-border backdrop:bg-black/50 max-w-sm w-full">
      <div className="space-y-3">
        <h2 className="font-bold text-lg">Keyboard Shortcuts</h2>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            {[
              ['g d', 'Go to Dashboard'],
              ['g s', 'Go to Scanner'],
              ['g f', 'Log Food'],
              ['g i', 'Go to Insights'],
              ['g p', 'Go to Profile'],
              ['?', 'Show this dialog'],
            ].map(([key, desc]) => (
              <tr key={key} className="py-2">
                <td className="py-1.5 pr-4"><kbd className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{key}</kbd></td>
                <td className="py-1.5 text-muted-foreground">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={() => (document.getElementById('kbd-shortcuts-dialog') as HTMLDialogElement)?.close()}
          className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          Close
        </button>
      </div>
    </dialog>
  )
}
