'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createPackage, updatePackage } from '@/actions/packages'

interface Props {
  pkg?: {
    id: string
    name: string
    description: string | null
    season: string | null
    assigned_to: string | null
  }
}

export function PackageForm({ pkg }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    if (pkg) formData.set('id', pkg.id)

    const result = pkg ? await updatePackage(formData) : await createPackage(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else if (!pkg && 'id' in result) {
      router.push(`/admin/packages/${result.id}`)
    } else {
      router.push('/admin/packages')
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <Input name="name" defaultValue={pkg?.name ?? ''} placeholder="e.g. TRY-U10s" required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Input name="description" defaultValue={pkg?.description ?? ''} placeholder="What this package is for" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Season</label>
            <Input name="season" defaultValue={pkg?.season ?? ''} placeholder="e.g. Spring 2026" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Assigned to</label>
            <Input name="assigned_to" defaultValue={pkg?.assigned_to ?? ''} placeholder="Coach name" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full bg-gray-900 text-gold-400 hover:bg-gray-800">
            {loading ? 'Saving...' : pkg ? 'Update package' : 'Create package'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
