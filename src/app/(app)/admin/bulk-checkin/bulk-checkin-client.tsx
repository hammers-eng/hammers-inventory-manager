'use client'

import { useState, useMemo } from 'react'
import { bulkCheckIn } from '@/actions/loans'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Loan {
  id: string
  recipient_name: string | null
  checked_out_at: string
  expected_return_date: string | null
  purpose: string | null
  equipment_items: {
    id: string
    name: string
    asset_tag: string | null
    equipment_categories: { name: string } | null
  }
}

export function BulkCheckInClient({ loans }: { loans: Loan[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ checked: number; failed: number } | null>(null)

  const holders = useMemo(() => {
    const names = new Set(loans.map(l => l.recipient_name ?? 'Unknown'))
    return Array.from(names).sort()
  }, [loans])

  const filtered = useMemo(() => {
    if (!filter) return loans
    return loans.filter(l => (l.recipient_name ?? 'Unknown') === filter)
  }, [loans, filter])

  const allFilteredSelected = filtered.length > 0 && filtered.every(l => selected.has(l.id))

  function toggleAll() {
    if (allFilteredSelected) {
      const next = new Set(selected)
      filtered.forEach(l => next.delete(l.id))
      setSelected(next)
    } else {
      const next = new Set(selected)
      filtered.forEach(l => next.add(l.id))
      setSelected(next)
    }
  }

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function selectByHolder(name: string) {
    const next = new Set(selected)
    loans.filter(l => (l.recipient_name ?? 'Unknown') === name).forEach(l => next.add(l.id))
    setSelected(next)
  }

  async function handleSubmit() {
    if (selected.size === 0) return
    if (!confirm(`Check in ${selected.size} item${selected.size !== 1 ? 's' : ''}?`)) return

    setLoading(true)
    const res = await bulkCheckIn(Array.from(selected))
    setLoading(false)

    if (res.error) {
      alert(res.error)
    } else {
      setResult({ checked: res.checked ?? 0, failed: res.failed ?? 0 })
      setSelected(new Set())
      router.refresh()
    }
  }

  const today = new Date()

  if (loans.length === 0 && !result) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center text-sm text-gray-500">
        No items currently on loan.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-green-800">
            Checked in {result.checked} item{result.checked !== 1 ? 's' : ''}
            {result.failed > 0 && <span className="text-red-600"> ({result.failed} failed)</span>}
          </p>
        </div>
      )}

      {/* Filter by holder */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={cn(
            'px-3 py-1 rounded-full text-xs border transition-colors',
            !filter ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
          )}
        >
          All holders
        </button>
        {holders.map(name => (
          <button
            key={name}
            onClick={() => setFilter(name)}
            className={cn(
              'px-3 py-1 rounded-full text-xs border transition-colors',
              filter === name ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            )}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Select all / actions bar */}
      <div className="flex items-center justify-between bg-white rounded-lg border p-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleAll}
            className="rounded border-gray-300"
          />
          <span className="text-gray-600">
            {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
          </span>
        </label>
        {selected.size > 0 && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-sm font-medium px-4 py-1.5 rounded-lg bg-gold-600 text-white hover:bg-gold-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Checking in...' : `Check in ${selected.size} item${selected.size !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {/* Quick select by holder */}
      {!filter && holders.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-gray-400 py-1">Quick select:</span>
          {holders.map(name => (
            <button
              key={name}
              onClick={() => selectByHolder(name)}
              className="text-xs text-gold-600 hover:text-gold-800 underline"
            >
              All from {name}
            </button>
          ))}
        </div>
      )}

      {/* Loan list */}
      <div className="space-y-1">
        {filtered.map(loan => {
          const item = loan.equipment_items
          const isOverdue = loan.expected_return_date && new Date(loan.expected_return_date) < today
          return (
            <label
              key={loan.id}
              className={cn(
                'flex items-center gap-3 bg-white rounded-lg border p-3 cursor-pointer hover:bg-gray-50 transition-colors',
                selected.has(loan.id) && 'bg-gold-50 border-gold-300',
                isOverdue && !selected.has(loan.id) && 'border-red-200'
              )}
            >
              <input
                type="checkbox"
                checked={selected.has(loan.id)}
                onChange={() => toggle(loan.id)}
                className="rounded border-gray-300 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {item.name}
                  {item.asset_tag && <span className="text-gray-400 font-normal"> · {item.asset_tag}</span>}
                </div>
                <div className="text-xs text-gray-500">
                  {loan.recipient_name ?? 'Unknown'}
                  {item.equipment_categories && <span> · {item.equipment_categories.name}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-gray-400">
                  Out {new Date(loan.checked_out_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                {isOverdue && (
                  <div className="text-[10px] font-semibold text-red-600">Overdue</div>
                )}
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
