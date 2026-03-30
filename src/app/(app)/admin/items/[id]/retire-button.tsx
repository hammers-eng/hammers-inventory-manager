'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { retireItem } from '@/actions/items'
import { useRouter } from 'next/navigation'

export default function RetireButton({ itemId, itemName }: { itemId: string; itemName: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleRetire() {
    if (!confirm(`Retire "${itemName}"? It will be hidden from the inventory but kept in history.`)) return
    startTransition(async () => {
      await retireItem(itemId)
      router.push('/admin/items')
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRetire} disabled={isPending}
      className="text-red-600 border-red-200 hover:bg-red-50">
      {isPending ? 'Retiring...' : 'Retire item'}
    </Button>
  )
}
