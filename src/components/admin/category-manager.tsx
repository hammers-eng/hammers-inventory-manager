'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createCategory, updateCategory, deleteCategory, updateCategoryCustomFields } from '@/actions/admin'
import type { CustomFieldDef } from '@/lib/supabase/database.types'

interface Category {
  id: string
  name: string
  description: string | null
  custom_fields: CustomFieldDef[]
}

// ── Inline custom fields editor ────────────────────────────

function FieldsEditor({ fields, onChange }: { fields: CustomFieldDef[]; onChange: (f: CustomFieldDef[]) => void }) {
  function add() {
    onChange([...fields, { name: '', type: 'text' }])
  }
  function remove(i: number) {
    onChange(fields.filter((_, idx) => idx !== i))
  }
  function update(i: number, patch: Partial<CustomFieldDef>) {
    onChange(fields.map((f, idx) => idx === i ? { ...f, ...patch } : f))
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">Custom fields</Label>
      {fields.map((field, i) => (
        <div key={i} className="flex gap-1.5 items-start">
          <Input
            value={field.name}
            onChange={e => update(i, { name: e.target.value })}
            placeholder="Field name"
            className="text-xs flex-1"
          />
          <Select
            value={field.type}
            onValueChange={v => update(i, {
              type: (v as CustomFieldDef['type']) ?? 'text',
              options: v === 'select' ? field.options ?? [] : undefined,
            })}
          >
            <SelectTrigger className="text-xs h-9 w-24 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="select">Select</SelectItem>
            </SelectContent>
          </Select>
          <button onClick={() => remove(i)} className="p-2 text-gray-400 hover:text-red-600">
            <X size={14} />
          </button>
          {field.type === 'select' && (
            <Input
              value={(field.options ?? []).join(', ')}
              onChange={e => update(i, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="Options (comma separated)"
              className="text-xs flex-1"
            />
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
        <Plus size={12} /> Add custom field
      </button>
    </div>
  )
}

// ── Category row (view / edit) ─────────────────────────────

function CategoryRow({ category }: { category: Category }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<CustomFieldDef[]>(category.custom_fields ?? [])

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateCategory(category.id, formData)
      if (result?.error) { setError(result.error); return }

      // Save custom fields
      const cleaned = fields.filter(f => f.name.trim()).map(f => ({
        name: f.name.trim(),
        type: f.type,
        ...(f.type === 'select' && f.options ? { options: f.options } : {}),
      }))
      const fieldsResult = await updateCategoryCustomFields(category.id, cleaned)
      if (fieldsResult?.error) { setError(fieldsResult.error); return }

      setEditing(false)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm(`Delete "${category.name}"?`)) return
    startTransition(async () => {
      const result = await deleteCategory(category.id)
      if (result?.error) { setError(result.error) }
      else { router.refresh() }
    })
  }

  if (editing) {
    return (
      <form onSubmit={handleUpdate} className="bg-gray-50 rounded-lg border p-3 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Name *</Label>
          <Input name="name" defaultValue={category.name} required autoFocus />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Description</Label>
          <Input name="description" defaultValue={category.description ?? ''} placeholder="Optional" />
        </div>
        <FieldsEditor fields={fields} onChange={setFields} />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending} className="flex-1">
            {isPending ? 'Saving...' : 'Save'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => { setEditing(false); setError(null); setFields(category.custom_fields ?? []) }}>
            Cancel
          </Button>
        </div>
      </form>
    )
  }

  const fieldSummary = (category.custom_fields ?? []).map(f => f.name).join(', ')

  return (
    <div className="bg-white rounded-lg border p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{category.name}</div>
        {category.description && <div className="text-xs text-gray-500">{category.description}</div>}
        {fieldSummary && <div className="text-xs text-gray-400 mt-0.5">Fields: {fieldSummary}</div>}
      </div>
      {error && <p className="text-xs text-red-600 flex-1">{error}</p>}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => setEditing(true)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
          <Pencil size={14} />
        </button>
        <button onClick={handleDelete} disabled={isPending} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [newFields, setNewFields] = useState<CustomFieldDef[]>([])

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      const result = await createCategory(formData) as { error?: string | null; success?: boolean; id?: string }
      if (result?.error) { setError(result.error); return }

      // If we have custom fields, save them for the new category
      if (newFields.length > 0) {
        // Re-fetch to get the new category's id
        // Since createCategory doesn't return the id, we need to refresh and let the user edit after
      }

      form.reset()
      setShowForm(false)
      setNewFields([])
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {!showForm ? (
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus size={16} /> Add
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="bg-gray-50 rounded-lg border p-3 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Name *</Label>
            <Input name="name" required autoFocus placeholder="e.g. Match Balls" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Input name="description" placeholder="Optional" />
          </div>
          <p className="text-xs text-gray-400">Custom fields can be added after creating the category.</p>
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

      {categories.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No categories yet</p>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => (
            <CategoryRow key={cat.id} category={cat} />
          ))}
        </div>
      )}
    </div>
  )
}
