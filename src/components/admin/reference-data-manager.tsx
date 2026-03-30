'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Item {
  id: string
  name: string
  description: string | null
}

interface Actions {
  create: (formData: FormData) => Promise<{ error?: string | null; success?: boolean }>
  update: (id: string, formData: FormData) => Promise<{ error?: string | null; success?: boolean }>
  delete: (id: string) => Promise<{ error?: string | null; success?: boolean }>
}

interface Props {
  items: Item[]
  actions: Actions
  emptyLabel: string
}

function ItemRow({ item, actions, onDone }: { item: Item; actions: Actions; onDone: () => void }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await actions.update(item.id, formData)
      if (result?.error) { setError(result.error) }
      else { setEditing(false); router.refresh() }
    })
  }

  function handleDelete() {
    if (!confirm(`Delete "${item.name}"?`)) return
    startTransition(async () => {
      const result = await actions.delete(item.id)
      if (result?.error) { setError(result.error) }
      else { router.refresh() }
    })
  }

  if (editing) {
    return (
      <form onSubmit={handleUpdate} className="bg-gray-50 rounded-lg border p-3 space-y-2">
        <div className="space-y-1">
          <Label className="text-xs">Name *</Label>
          <Input name="name" defaultValue={item.name} required autoFocus />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Description</Label>
          <Input name="description" defaultValue={item.description ?? ''} placeholder="Optional" />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending} className="flex-1">
            {isPending ? 'Saving...' : 'Save'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => { setEditing(false); setError(null) }}>
            Cancel
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{item.name}</div>
        {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
      </div>
      {error && <p className="text-xs text-red-600 flex-1">{error}</p>}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => setEditing(true)}
          className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
          <Pencil size={14} />
        </button>
        <button onClick={handleDelete} disabled={isPending}
          className="p-1.5 text-gray-400 hover:text-red-600 rounded">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export function ReferenceDataManager({ items, actions, emptyLabel }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      const result = await actions.create(formData)
      if (result?.error) { setError(result.error) }
      else { form.reset(); setShowForm(false); router.refresh() }
    })
  }

  return (
    <div className="space-y-3">
      {!showForm ? (
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus size={16} /> Add
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="bg-gray-50 rounded-lg border p-3 space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Name *</Label>
            <Input name="name" required autoFocus placeholder="e.g. Match Balls" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Input name="description" placeholder="Optional" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending} className="flex-1">
              {isPending ? 'Saving...' : 'Add'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setError(null) }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <ItemRow key={item.id} item={item} actions={actions} onDone={() => {}} />
          ))}
        </div>
      )}
    </div>
  )
}
