'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { checkOutPackage } from '@/actions/packages'
import { Send } from 'lucide-react'

interface Props {
  packageId: string
  packageName: string
  assignedTo: string | null
  availableCount: number
}

export function PackageCheckout({ packageId, packageName, assignedTo, availableCount }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('package_id', packageId)

    const result = await checkOutPackage(formData)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      router.refresh()
    }
  }

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 text-center text-sm text-green-700">
          All available items checked out successfully!
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gold-200">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Send size={14} />
          Check out {availableCount} available item{availableCount !== 1 ? 's' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Recipient</label>
            <Input
              name="recipient_name"
              defaultValue={assignedTo ?? ''}
              placeholder="Coach name"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Expected return date</label>
            <Input name="expected_return_date" type="date" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Purpose</label>
            <Input name="purpose" defaultValue={`${packageName} season loan`} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full bg-gray-900 text-gold-400 hover:bg-gray-800">
            {loading ? 'Checking out...' : `Check out ${availableCount} items`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
