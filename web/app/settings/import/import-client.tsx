"use client"
import { useState } from "react"

export function ImportClient() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<"idle"|"uploading"|"processing"|"done"|"error">("idle")
  const [message, setMessage] = useState("")
  const [progress, setProgress] = useState(0)

  async function handleImport() {
    if (!file) return
    setStatus("uploading"); setProgress(10)
    try {
      const formData = new FormData()
      formData.append("file", file)
      setProgress(30)
      const res = await fetch("/api/import", { method: "POST", body: formData })
      setProgress(70)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Import failed")
      setProgress(100); setStatus("done")
      setMessage(`✅ Imported ${json.rowsImported} records successfully`)
    } catch (e: any) { setStatus("error"); setMessage(e.message) }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center">
        <p className="text-zinc-400 mb-3">Drag & drop or click to upload</p>
        <p className="text-zinc-500 text-sm mb-4">Supported: Apple Health export.zip, CSV</p>
        <input type="file" accept=".zip,.csv,.xml"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="hidden" id="import-file" />
        <label htmlFor="import-file"
          className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm">
          Choose File
        </label>
        {file && <p className="mt-3 text-green-400 text-sm">{file.name} ({(file.size/1024/1024).toFixed(1)} MB)</p>}
      </div>

      {status === "uploading" || status === "processing" ? (
        <div className="w-full bg-zinc-800 rounded-full h-2">
          <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      {message && (
        <p className={`text-sm ${status === "done" ? "text-green-400" : "text-red-400"}`}>{message}</p>
      )}

      <button onClick={handleImport} disabled={!file || status === "uploading"}
        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg">
        {status === "uploading" ? "Importing…" : "Import Data"}
      </button>

      <details className="text-sm text-zinc-500">
        <summary className="cursor-pointer hover:text-zinc-300">How to export from Apple Health</summary>
        <ol className="mt-2 space-y-1 list-decimal list-inside">
          <li>Open the Health app on iPhone</li>
          <li>Tap your profile photo → Export All Health Data</li>
          <li>Upload the resulting export.zip here</li>
        </ol>
      </details>
    </div>
  )
}
