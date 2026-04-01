'use client'

import { useState, useTransition } from 'react'
import { retireItem, markItemLostOrDamaged } from '@/actions/items'
import { useRouter } from 'next/navigation'

type RemovalType = 'retired' | 'lost' | 'damaged' | null

export function RemoveFromService({ itemId, itemName }: { itemId: string; itemName: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<RemovalType>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (selected === 'retired') {
      if (!confirm(`Retire "${itemName}"? It will be hidden from the inventory but kept in history.`)) return
      startTransition(async () => {
        await retireItem(itemId)
        router.push('/inventory')
      })
    } else if (selected === 'lost' || selected === 'damaged') {
      if (!reason.trim()) {
        setError('Please describe what happened')
        return
      }
      startTransition(async () => {
        const result = await markItemLostOrDamaged(itemId, selected, reason)
        if (result?.error) {
          setError(result.error)
        } else {
          router.push('/inventory')
        }
      })
    }
  }

  if (!selected) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-500 mb-2">Remove from service</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelected('lost')}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            Mark as Lost
          </button>
          <button
            onClick={() => setSelected('damaged')}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors"
          >
            Mark as Damaged
          </button>
          <button
            onClick={() => setSelected('retired')}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Retire
          </button>
        </div>
      </div>
    )
  }

  const labels: Record<string, { title: string; placeholder: string; color: string }> = {
    lost: {
      title: 'Mark as Lost',
      placeholder: 'Where was it last seen? When did you notice it was missing?',
      color: 'text-red-700',
    },
    damaged: {
      title: 'Mark as Damaged',
      placeholder: 'What happened? Is it repairable?',
      color: 'text-orange-700',
    },
    retired: {
      title: 'Retire Item',
      placeholder: '',
      color: 'text-gray-700',
    },
  }

  const config = labels[selected]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${config.color}`}>{config.title}</p>
        <button
          onClick={() => { setSelected(null); setReason(''); setError(null) }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>

      {selected !== 'retired' && (
        <textarea
          value={reason}
          onChange={e => { setReason(e.target.value); setError(null) }}
          placeholder={config.placeholder}
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
        />
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className={`text-xs font-medium px-4 py-2 rounded-lg text-white disabled:opacity-50 transition-colors ${
          selected === 'lost' ? 'bg-red-600 hover:bg-red-700' :
          selected === 'damaged' ? 'bg-orange-600 hover:bg-orange-700' :
          'bg-gray-600 hover:bg-gray-700'
        }`}
      >
        {isPending ? 'Saving...' : `Confirm ${config.title}`}
      </button>
    </div>
  )
}
