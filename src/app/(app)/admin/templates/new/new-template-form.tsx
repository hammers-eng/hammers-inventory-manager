'use client'

import { useState } from 'react'
import { createTemplate, addTemplateLine } from '@/actions/templates'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface Line {
  categoryId: string
  quantity: number
}

export function NewTemplateForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addLine() {
    const usedCategoryIds = lines.map(l => l.categoryId)
    const available = categories.filter(c => !usedCategoryIds.includes(c.id))
    if (available.length === 0) return
    setLines([...lines, { categoryId: available[0].id, quantity: 1 }])
  }

  function updateLine(index: number, field: keyof Line, value: string | number) {
    const next = [...lines]
    if (field === 'quantity') next[index].quantity = Math.max(1, Number(value))
    else next[index].categoryId = value as string
    setLines(next)
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    if (lines.length === 0) { setError('Add at least one item line'); return }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.set('name', name)
    formData.set('description', description)
    const result = await createTemplate(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Add lines
    for (const line of lines) {
      const lineData = new FormData()
      lineData.set('template_id', result.id!)
      lineData.set('category_id', line.categoryId)
      lineData.set('quantity', line.quantity.toString())
      await addTemplateLine(lineData)
    }

    router.push(`/admin/templates/${result.id}`)
  }

  const usedCategoryIds = lines.map(l => l.categoryId)

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-4 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
        <input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. U10s Kit"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What this kit is for..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Kit Contents</label>
          <button
            type="button"
            onClick={addLine}
            disabled={usedCategoryIds.length >= categories.length}
            className="inline-flex items-center gap-1 text-xs font-medium text-gold-600 hover:text-gold-800 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> Add item
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center border border-dashed rounded-lg">
            No items added yet. Click &quot;Add item&quot; to define what this kit contains.
          </p>
        ) : (
          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={e => updateLine(i, 'quantity', e.target.value)}
                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
                <span className="text-sm text-gray-400">×</span>
                <select
                  value={line.categoryId}
                  onChange={e => updateLine(i, 'categoryId', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  {categories
                    .filter(c => c.id === line.categoryId || !usedCategoryIds.includes(c.id))
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-gold-700 disabled:opacity-50 transition-colors text-sm"
      >
        {loading ? 'Creating...' : 'Create Template'}
      </button>
    </form>
  )
}
