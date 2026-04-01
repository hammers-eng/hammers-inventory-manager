'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { ItemCard } from '@/components/inventory/item-card'
import { ItemWithDetails } from '@/lib/queries/items'
import { ExportButton } from '@/components/export-button'
import { exportInventory } from '@/actions/exports'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  items: ItemWithDetails[]
  categories: { id: string; name: string }[]
  locations: { id: string; name: string }[]
}

const statusFilters = [
  { value: 'all',       label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'on_loan',   label: 'On Loan' },
]

export default function InventoryClient({ items, categories, locations }: Props) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [location, setLocation] = useState('all')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(item => {
      if (status !== 'all' && item.status !== status) return false
      if (category !== 'all') {
        const cat = item.equipment_categories as { id: string } | null
        if (cat?.id !== category) return false
      }
      if (location !== 'all') {
        const loc = item.locations as { id: string } | null
        if (loc?.id !== location) return false
      }
      if (q) {
        const name = item.name.toLowerCase()
        const tag = (item.asset_tag ?? '').toLowerCase()
        const holder = (item.currentLoan?.recipient_name ?? '').toLowerCase()
        if (!name.includes(q) && !tag.includes(q) && !holder.includes(q)) return false
      }
      return true
    })
  }, [items, search, status, category, location])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">
            {filtered.length === items.length ? `${items.length} items` : `${filtered.length} of ${items.length} items`}
          </p>
        </div>
        <ExportButton label="Export CSV" action={exportInventory} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by name, asset tag, or holder..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={cn(
              'px-3 py-1 rounded-full text-sm border transition-colors',
              status === f.value
                ? 'bg-gray-900 text-gold-400 border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategory('all')}
          className={cn(
            'px-3 py-1 rounded-full text-xs border transition-colors',
            category === 'all'
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
          )}
        >
          All categories
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              'px-3 py-1 rounded-full text-xs border transition-colors',
              category === c.id
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Location filter */}
      {locations.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setLocation('all')}
            className={cn(
              'px-3 py-1 rounded-full text-xs border transition-colors',
              location === 'all'
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            )}
          >
            All locations
          </button>
          {locations.map(l => (
            <button
              key={l.id}
              onClick={() => setLocation(l.id)}
              className={cn(
                'px-3 py-1 rounded-full text-xs border transition-colors',
                location === l.id
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              )}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-12">
            {search || status !== 'all' || category !== 'all' ? 'No items match your filters' : 'No items yet'}
          </div>
        ) : (
          filtered.map(item => <ItemCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  )
}
