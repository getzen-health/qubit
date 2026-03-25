import { ImportClient } from "./import-client"

export const metadata = { title: "Import Health Data" }

export default function ImportPage() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">Import Health Data</h1>
      <p className="text-zinc-400 mb-6">Upload Apple Health export.zip or a CSV file to import historical data.</p>
      <ImportClient />
    </main>
  )
}
