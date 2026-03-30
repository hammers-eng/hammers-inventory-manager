'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateCategoryCustomFields } from '@/actions/admin'
import { Plus, X, Save } from 'lucide-react'
import type { CustomFieldDef } from '@/lib/supabase/database.types'

interface Props {
  categoryId: string
  categoryName: string
  initialFields: CustomFieldDef[]
}

export function CustomFieldsEditor({ categoryId, categoryName, initialFields }: Props) {
  const router = useRouter()
  const [fields, setFields] = useState<CustomFieldDef[]>(initialFields)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  function addField() {
    setFields([...fields, { name: '', type: 'text' }])
    setDirty(true)
  }

  function removeField(index: number) {
    setFields(fields.filter((_, i) => i !== index))
    setDirty(true)
  }

  function updateField(index: number, updates: Partial<CustomFieldDef>) {
    setFields(fields.map((f, i) => i === index ? { ...f, ...updates } : f))
    setDirty(true)
  }

  function updateOptions(index: number, optionsStr: string) {
    const options = optionsStr.split(',').map(s => s.trim()).filter(Boolean)
    updateField(index, { options })
  }

  async function handleSave() {
    // Validate
    const validFields = fields.filter(f => f.name.trim())
    const names = validFields.map(f => f.name.trim())
    if (new Set(names).size !== names.length) {
      setError('Field names must be unique')
      return
    }

    setSaving(true)
    setError(null)

    const cleaned = validFields.map(f => ({
      name: f.name.trim(),
      type: f.type,
      ...(f.type === 'select' && f.options ? { options: f.options } : {}),
    }))

    const result = await updateCategoryCustomFields(categoryId, cleaned)
    if (result.error) {
      setError(result.error)
    } else {
      setDirty(false)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Custom fields for {categoryName}
        </h3>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-gray-400">No custom fields</p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={i} className="flex gap-2 items-start bg-gray-50 rounded-lg p-2 border">
              <div className="flex-1 space-y-1.5">
                <Input
                  value={field.name}
                  onChange={e => updateField(i, { name: e.target.value })}
                  placeholder="Field name (e.g. Size)"
                  className="text-sm"
                />
                <Select value={field.type} onValueChange={v => updateField(i, { type: (v as CustomFieldDef['type']) ?? 'text', options: v === 'select' ? field.options ?? [] : undefined })}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="select">Select (dropdown)</SelectItem>
                  </SelectContent>
                </Select>
                {field.type === 'select' && (
                  <Input
                    value={(field.options ?? []).join(', ')}
                    onChange={e => updateOptions(i, e.target.value)}
                    placeholder="Options (comma separated, e.g. 3, 4, 5)"
                    className="text-xs"
                  />
                )}
              </div>
              <button
                onClick={() => removeField(i)}
                className="p-1 text-gray-400 hover:text-red-600 rounded mt-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addField} className="gap-1">
          <Plus size={12} /> Add field
        </Button>
        {dirty && (
          <Button type="button" size="sm" onClick={handleSave} disabled={saving} className="gap-1">
            <Save size={12} /> {saving ? 'Saving...' : 'Save fields'}
          </Button>
        )}
      </div>
    </div>
  )
}
