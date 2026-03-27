"use client"
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const CATEGORIES = [
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
  { value: 'side', label: 'Side' },
  { value: 'face', label: 'Face' },
  { value: 'other', label: 'Other' },
]

interface Photo {
  id: string
  photo_url: string
  category: string
  taken_at: string
  weight_kg?: number | null
  notes?: string | null
}

function groupByMonth(photos: Photo[]): Record<string, Photo[]> {
  return photos.reduce((acc: Record<string, Photo[]>, photo: Photo) => {
    const month = new Date(photo.taken_at).toLocaleString('default', { month: 'long', year: 'numeric' })
    acc[month] = acc[month] || []
    acc[month].push(photo)
    return acc
  }, {})
}

export default function ProgressPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState('front')
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [compare, setCompare] = useState<Photo[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/progress-photos')
      .then(r => r.json())
      .then(d => setPhotos(d.photos || []))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    // 1. Get signed upload URL
    const res = await fetch('/api/progress-photos/upload', {
      method: 'POST',
      body: JSON.stringify({ category }),
      headers: { 'Content-Type': 'application/json' },
    })
    const { signedUrl, path } = await res.json()
    // 2. Upload file
    await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    // 3. Save metadata
    await fetch('/api/progress-photos', {
      method: 'POST',
      body: JSON.stringify({
        storage_path: path,
        photo_url: `/storage/v1/object/public/progress-photos/${path}`,
        category,
        notes,
        weight_kg: weight ? parseFloat(weight) : null,
        taken_at: new Date().toISOString().slice(0, 10),
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    setFile(null)
    setWeight('')
    setNotes('')
    if (inputRef.current) inputRef.current.value = ''
    router.refresh()
    fetch('/api/progress-photos').then(r => r.json()).then(d => setPhotos(d.photos || []))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this photo?')) return
    await fetch(`/api/progress-photos/${id}`, { method: 'DELETE' })
    setPhotos(photos.filter(p => p.id !== id))
  }

  function handleCompare(photo: Photo) {
    if (compare.length === 2) setCompare([photo])
    else if (compare.some(p => p.id === photo.id)) setCompare(compare.filter(p => p.id !== photo.id))
    else setCompare([...compare, photo].slice(-2))
  }

  const grouped = groupByMonth(photos)

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Progress Photos</h1>
      <p className="text-sm text-text-secondary mb-4">Your photos are stored privately and never shared.</p>
      <form onSubmit={handleUpload} className="bg-surface border border-border rounded-2xl p-4 mb-6 flex flex-col gap-3">
        <label className="font-medium">Upload Photo</label>
        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          required
        />
        <div className="flex gap-2">
          <select className="border rounded px-2 py-1" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <Input
            type="number"
            step="0.1"
            min="0"
            placeholder="Weight (kg)"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            className="w-32"
          />
        </div>
        <Input
          placeholder="Notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <Button type="submit" className="w-fit">Upload</Button>
      </form>
      <div className="mb-4 flex items-center gap-2">
        <Button variant="outline" onClick={() => setShowCompare(!showCompare)} disabled={compare.length !== 2} className="text-primary">
          {showCompare ? 'Exit Compare' : 'Compare Selected'}
        </Button>
        <span className="text-xs text-text-secondary">Select 2 photos to compare</span>
      </div>
      {showCompare && compare.length === 2 && (
        <CompareSlider before={compare[0]} after={compare[1]} onClose={() => setShowCompare(false)} />
      )}
      {loading ? <div>Loading...</div> : (
        Object.entries(grouped).map(([month, group]) => (
          <div key={month} className="mb-6">
            <h2 className="text-lg font-semibold mb-2">{month}</h2>
            <div className="grid grid-cols-2 gap-4">
              {group.map(photo => (
                <div key={photo.id} className={`bg-surface border border-border rounded-2xl p-2 flex flex-col items-center relative ${compare.some(p => p.id === photo.id) ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => handleCompare(photo)}
                  style={{ cursor: 'pointer' }}
                >
                  <Image src={photo.photo_url} alt="Progress photo" width={160} height={160} className="rounded-xl object-cover aspect-square" />
                  <div className="flex gap-2 mt-2 items-center">
                    <Badge>{photo.category}</Badge>
                    {photo.weight_kg && <span className="text-xs">{photo.weight_kg}kg</span>}
                  </div>
                  <span className="text-xs text-text-secondary mt-1">{photo.taken_at}</span>
                  <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={e => { e.stopPropagation(); handleDelete(photo.id) }}>🗑️</Button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function CompareSlider({ before, after, onClose }: { before: Photo; after: Photo; onClose: () => void }) {
  const [pos, setPos] = useState(50)
  return (
    <div className="relative bg-surface border border-border rounded-2xl p-4 mb-6 flex flex-col items-center">
      <h3 className="font-semibold mb-2">Before / After Comparison</h3>
      <div className="relative w-full max-w-xs h-72 mb-2">
        <div className="absolute inset-0 w-full h-full">
          <Image src={before.photo_url} alt="Before" fill className="object-cover rounded-xl" style={{ clipPath: `inset(0 ${100-pos}% 0 0)` }} />
          <Image src={after.photo_url} alt="After" fill className="object-cover rounded-xl absolute top-0 left-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }} />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={e => setPos(Number(e.target.value))}
          className="w-full absolute bottom-2 left-0 z-10"
        />
      </div>
      <div className="flex justify-between w-full max-w-xs text-xs mb-2">
        <span>{before.taken_at} ({before.category})</span>
        <span>{after.taken_at} ({after.category})</span>
      </div>
      <Button variant="outline" onClick={onClose}>Close</Button>
    </div>
  )
}
