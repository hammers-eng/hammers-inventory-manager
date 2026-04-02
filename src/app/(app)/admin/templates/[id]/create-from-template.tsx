'use client'

import { useState } from 'react'
import { createPackageFromTemplate } from '@/actions/templates'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function CreateFromTemplate({ templateId, templateName }: { templateId: string; templateName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('template_id', templateId)
    const result = await createPackageFromTemplate(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push(`/admin/packages/${result.packageId}`)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-gold-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-gold-700 transition-colors text-sm"
      >
        Create Package from Template
      </button>
    )
  }

  return (
    <Card className="border-gold-200">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center justify-between">
          Create Package from &quot;{templateName}&quot;
          <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 font-normal">
            Cancel
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="package_name" className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
            <input
              id="package_name"
              name="package_name"
              required
              placeholder={`${templateName} - Spring 2026`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-1">Season</label>
              <input
                id="season"
                name="season"
                placeholder="Spring 2026"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <input
                id="assigned_to"
                name="assigned_to"
                placeholder="Coach name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-gold-700 disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? 'Creating...' : 'Create Package'}
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
