'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { parseVoiceInput, describeEntry, ParsedVoiceEntry } from '@/lib/voice-parser'

type State = 'idle' | 'listening' | 'parsed' | 'confirming' | 'success' | 'error'

export function VoiceLogger({ onLogged }: { onLogged?: (entry: ParsedVoiceEntry) => void }) {
  const [state, setState] = useState<State>('idle')
  const [transcript, setTranscript] = useState('')
  const [parsed, setParsed] = useState<ParsedVoiceEntry | null>(null)
  const [message, setMessage] = useState('')
  const recognitionRef = useRef<any>(null)

  const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const startListening = useCallback(() => {
    if (!isSupported) return
    const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const text = result[0].transcript
      setTranscript(text)
      if (result.isFinal) {
        const entry = parseVoiceInput(text)
        setParsed(entry)
        setState('parsed')
      }
    }
    recognition.onerror = () => { setState('error'); setMessage('Could not hear clearly. Try again.') }
    recognition.onend = () => { if (state === 'listening') setState('idle') }

    recognitionRef.current = recognition
    recognition.start()
    setState('listening')
    setTranscript('')
    setParsed(null)
  }, [isSupported, state])

  const confirmLog = async () => {
    if (!parsed || parsed.type === 'unknown') return
    setState('confirming')
    const res = await fetch('/api/voice/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    })
    const d = await res.json()
    if (d.success) {
      setState('success')
      setMessage(d.message ?? 'Logged!')
      onLogged?.(parsed)
      setTimeout(() => { setState('idle'); setTranscript(''); setParsed(null) }, 2000)
    } else {
      setState('error')
      setMessage(d.error ?? 'Failed to log')
    }
  }

  const cancel = () => {
    recognitionRef.current?.stop()
    setState('idle')
    setTranscript('')
    setParsed(null)
  }

  if (!isSupported) return null

  return (
    <>
      {/* Floating mic button */}
      <button
        onClick={state === 'idle' ? startListening : cancel}
        className={`fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 transition-all ${
          state === 'listening' ? 'bg-red-500 animate-pulse scale-110' :
          state === 'success' ? 'bg-green-500' :
          'bg-primary'
        }`}
      >
        <span className="text-white text-2xl">
          {state === 'listening' ? '🔴' : state === 'success' ? '✓' : '🎤'}
        </span>
      </button>

      {/* Overlay panel */}
      {state !== 'idle' && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 pb-24" onClick={cancel}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            {state === 'listening' && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-semibold text-text-primary">Listening...</span>
                </div>
                <p className="text-text-secondary text-sm mb-2">Try: "log 500ml water" · "mood is 7" · "ran 5k in 30 minutes"</p>
                {transcript && <p className="text-text-primary bg-surface rounded-xl p-3 text-sm">"{transcript}"</p>}
              </>
            )}

            {state === 'parsed' && parsed && (
              <>
                <div className="mb-1">
                  <p className="text-xs text-text-secondary mb-1">Heard: "{transcript}"</p>
                  <div className={`rounded-xl p-4 mb-4 ${parsed.type === 'unknown' ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                    <p className="font-semibold text-text-primary">{describeEntry(parsed)}</p>
                  </div>
                </div>
                {parsed.type !== 'unknown' ? (
                  <div className="flex gap-3">
                    <button onClick={cancel} className="flex-1 py-3 rounded-xl border border-border text-text-secondary font-medium">Cancel</button>
                    <button onClick={confirmLog} className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold">✓ Log it</button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-yellow-700 mb-3">Couldn't parse this. Try being more specific.</p>
                    <div className="flex gap-3">
                      <button onClick={cancel} className="flex-1 py-3 rounded-xl border border-border text-text-secondary">Cancel</button>
                      <button onClick={startListening} className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold">Try Again</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {state === 'confirming' && (
              <div className="text-center py-4">
                <div className="text-2xl mb-2">⏳</div>
                <p className="text-text-secondary">Logging...</p>
              </div>
            )}

            {state === 'success' && (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">✅</div>
                <p className="font-semibold text-green-600">{message}</p>
              </div>
            )}

            {state === 'error' && (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">❌</div>
                <p className="text-red-600 mb-3">{message}</p>
                <button onClick={startListening} className="bg-primary text-white px-6 py-2 rounded-xl font-medium">Try Again</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
