'use client'

import { initiateTransfer } from '@/actions/transfers'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Loan {
  id: string
  item_id: string
  item: { id: string; name: string; asset_tag: string | null }
}

interface Coach {
  id: string
  full_name: string
}

export function NewTransferForm({ loans, coaches, preselectedLoanId }: { loans: Loan[]; coaches: Coach[]; preselectedLoanId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await initiateTransfer(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/transfers')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-4 space-y-4">
      <div>
        <label htmlFor="loan_id" className="block text-sm font-medium text-gray-700 mb-1">
          Item to Transfer
        </label>
        <select
          id="loan_id"
          name="loan_id"
          required
          defaultValue={preselectedLoanId ?? ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
        >
          <option value="">Select an item...</option>
          {loans.map((loan) => (
            <option key={loan.id} value={loan.id}>
              {loan.item?.name}
              {loan.item?.asset_tag ? ` (${loan.item.asset_tag})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="to_profile_id" className="block text-sm font-medium text-gray-700 mb-1">
          Transfer To
        </label>
        <select
          id="to_profile_id"
          name="to_profile_id"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
        >
          <option value="">Select a coach...</option>
          {coaches.map((coach) => (
            <option key={coach.id} value={coach.id}>
              {coach.full_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="Any notes about this transfer..."
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-gold-700 disabled:opacity-50 transition-colors text-sm"
      >
        {loading ? 'Sending...' : 'Send Transfer Request'}
      </button>
    </form>
  )
}
