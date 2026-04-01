'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

interface Props {
  label: string
  action: () => Promise<{ csv?: string; filename?: string; error?: string }>
}

export function ExportButton({ label, action }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const result = await action()
    setLoading(false)

    if (result.error || !result.csv) return

    const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = result.filename ?? 'export.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-colors"
    >
      <Download size={13} />
      {loading ? 'Exporting...' : label}
    </button>
  )
}
