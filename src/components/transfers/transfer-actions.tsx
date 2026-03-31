'use client'

import { respondToTransfer, cancelTransfer } from '@/actions/transfers'
import { useState } from 'react'

export function TransferActions({ transferId, type }: { transferId: string; type: 'incoming' | 'outgoing' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAction(action: string) {
    setLoading(true)
    setError(null)
    const formData = new FormData()

    if (type === 'incoming') {
      formData.set('transfer_id', transferId)
      formData.set('action', action)
      const result = await respondToTransfer(formData)
      if (result?.error) setError(result.error)
    } else {
      formData.set('transfer_id', transferId)
      const result = await cancelTransfer(formData)
      if (result?.error) setError(result.error)
    }
    setLoading(false)
  }

  if (type === 'incoming') {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          <button
            onClick={() => handleAction('accept')}
            disabled={loading}
            className="text-xs font-medium px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => handleAction('reject')}
            disabled={loading}
            className="text-xs font-medium px-3 py-1.5 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            Decline
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => handleAction('cancel')}
        disabled={loading}
        className="text-xs font-medium px-3 py-1.5 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors"
      >
        Cancel
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
