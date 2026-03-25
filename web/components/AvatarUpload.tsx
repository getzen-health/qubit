"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

interface Props {
  userId: string
  avatarUrl: string | null
  onUpdate: (url: string) => void
}

export function AvatarUpload({ userId, avatarUrl, onUpdate }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function uploadAvatar(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const ext = file.name.split(".").pop()
      const path = `${userId}/avatar.${ext}`

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true })

      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path)

      await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", userId)

      onUpdate(publicUrl)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative w-20 h-20 rounded-full overflow-hidden bg-zinc-800 cursor-pointer"
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Click to upload profile photo"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            inputRef.current?.click()
          }
        }}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="User profile photo" fill className="object-cover" />
        ) : (
          <span className="flex items-center justify-center w-full h-full text-3xl text-zinc-500" aria-hidden="true">
            👤
          </span>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center" aria-busy="true" aria-label="Uploading photo">
            <span className="text-white text-xs">Uploading…</span>
          </div>
        )}
      </div>
      <button
        onClick={() => inputRef.current?.click()}
        className="text-xs text-zinc-400 hover:text-white"
        aria-label="Change profile photo"
      >
        {uploading ? "Uploading…" : "Change photo"}
      </button>
      {error && <p className="text-red-400 text-xs" role="alert">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label="Select image file for profile photo"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) uploadAvatar(f)
        }}
      />
    </div>
  )
}
