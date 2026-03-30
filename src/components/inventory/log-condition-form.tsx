'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logCondition } from '@/actions/items'
import { ItemCondition } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { ClipboardList } from 'lucide-react'

const CONDITIONS: { value: ItemCondition; label: string; color: string }[] = [
  { value: 'new',     label: 'New',     color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'good',    label: 'Good',    color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'fair',    label: 'Fair',    color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'poor',    label: 'Poor',    color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'replace', label: 'Replace', color: 'bg-red-100 text-red-800 border-red-200' },
]

export function LogConditionForm({ itemId }: { itemId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [condition, setCondition] = useState<ItemCondition | ''>('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit() {
    if (!condition) return
    setError(null)

    const formData = new FormData()
    formData.set('item_id', itemId)
    formData.set('condition', condition)
    if (notes.trim()) formData.set('notes', notes.trim())

    startTransition(async () => {
      const result = await logCondition(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        setCondition('')
        setNotes('')
        router.refresh()
      }
    })
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <ClipboardList size={15} />
        Log condition
      </Button>
    )
  }

  return (
    <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
      <div className="text-sm font-semibold text-gray-700">Log condition</div>
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
      <Input
        placeholder="Notes (optional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={!condition || isPending} className="flex-1">
          {isPending ? 'Saving...' : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setOpen(false); setCondition(''); setNotes('') }}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
