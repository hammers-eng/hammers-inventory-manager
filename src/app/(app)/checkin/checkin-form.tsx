'use client'

import { useState, useMemo, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { checkInItem } from '@/actions/loans'
import { Search, X, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { ItemCondition } from '@/lib/supabase/database.types'

const CONDITIONS: { value: ItemCondition; label: string; color: string }[] = [
  { value: 'new',     label: 'New',     color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'good',    label: 'Good',    color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'fair',    label: 'Fair',    color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'poor',    label: 'Poor',    color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'replace', label: 'Replace', color: 'bg-red-100 text-red-800 border-red-200' },
]

interface Loan {
  id: string
  checked_out_at: string
  expected_return_date: string | null
  purpose: string | null
  recipient_name: string | null
  equipment_items: { id: string; name: string; asset_tag: string | null } | null
}

export default function CheckInForm({ openLoans }: { openLoans: Loan[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState('')
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [condition, setCondition] = useState<ItemCondition | ''>('')
  const [conditionNotes, setConditionNotes] = useState('')
  const [returnNotes, setReturnNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return openLoans
    return openLoans.filter(l => {
      const itemName = l.equipment_items?.name.toLowerCase() ?? ''
      const tag = (l.equipment_items?.asset_tag ?? '').toLowerCase()
      const person = (l.recipient_name ?? '').toLowerCase()
      return itemName.includes(q) || tag.includes(q) || person.includes(q)
    })
  }, [openLoans, search])

  function getLoanLabel(loan: Loan) {
    return loan.recipient_name ?? 'Unknown'
  }

  function isOverdue(loan: Loan) {
    return loan.expected_return_date && loan.expected_return_date < today
  }

  async function handleSubmit() {
    if (!selectedLoan) return
    setError(null)

    const formData = new FormData()
    formData.set('loan_id', selectedLoan.id)
    if (returnNotes) formData.set('return_notes', returnNotes)
    if (condition) formData.set('condition', condition)
    if (conditionNotes) formData.set('condition_notes', conditionNotes)

    startTransition(async () => {
      const result = await checkInItem(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/inventory'), 1500)
      }
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <CheckCircle size={48} className="text-green-500" />
        <div className="text-lg font-semibold text-gray-900">Checked in!</div>
        <div className="text-sm text-gray-500">
          {selectedLoan?.equipment_items?.name} returned
        </div>
      </div>
    )
  }

  if (openLoans.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <CheckCircle size={40} className="mx-auto mb-3 text-green-300" />
        <div className="font-medium text-gray-600">All equipment is in</div>
        <div className="text-sm mt-1">Nothing currently on loan</div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Loan selection */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">1. Select item to return</Label>
        {selectedLoan ? (
          <div className="bg-white border rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-gray-900">{selectedLoan.equipment_items?.name}</div>
                <div className="text-sm text-gray-500">
                  {selectedLoan.equipment_items?.asset_tag && `${selectedLoan.equipment_items.asset_tag} · `}
                  With {getLoanLabel(selectedLoan)}
                </div>
                {selectedLoan.purpose && (
                  <div className="text-xs text-gray-400 mt-0.5">{selectedLoan.purpose}</div>
                )}
                {isOverdue(selectedLoan) && (
                  <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                    <AlertTriangle size={12} />
                    Overdue since {new Date(selectedLoan.expected_return_date!).toLocaleDateString()}
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedLoan(null)}>
                <X size={16} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by item or person..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
                autoComplete="off"
              />
            </div>
            <div className="border rounded-lg divide-y bg-white max-h-64 overflow-y-auto">
              {filtered.map(loan => (
                <button
                  key={loan.id}
                  onClick={() => { setSelectedLoan(loan); setSearch('') }}
                  className="w-full text-left px-3 py-2.5 hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {loan.equipment_items?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {loan.equipment_items?.asset_tag && `${loan.equipment_items.asset_tag} · `}
                        {getLoanLabel(loan)}
                      </div>
                    </div>
                    {isOverdue(loan) && (
                      <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Condition assessment */}
      {selectedLoan && (
        <div className="space-y-3">
          <Label className="text-sm font-semibold">2. Condition on return (optional)</Label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map(c => (
              <button
                key={c.value}
                onClick={() => setCondition(prev => prev === c.value ? '' : c.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm border font-medium transition-colors',
                  condition === c.value ? c.color : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          {condition && (
            <Input
              placeholder="Notes on condition (optional)"
              value={conditionNotes}
              onChange={e => setConditionNotes(e.target.value)}
            />
          )}
        </div>
      )}

      {/* Return notes */}
      {selectedLoan && (
        <div className="space-y-1">
          <Label className="text-sm font-semibold">3. Return notes (optional)</Label>
          <Input
            placeholder="Any notes about the return..."
            value={returnNotes}
            onChange={e => setReturnNotes(e.target.value)}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={!selectedLoan || isPending}
        className="w-full"
        size="lg"
      >
        {isPending ? 'Processing...' : 'Confirm Check In'}
      </Button>
    </div>
  )
}
