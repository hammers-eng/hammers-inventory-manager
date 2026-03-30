'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addItemToPackage, removeItemFromPackage } from '@/actions/packages'
import { X, Plus, Search } from 'lucide-react'

interface RemoveProps {
  mode: 'remove'
  packageId: string
  packageItemId: string
  availableItems?: never
}

interface AddProps {
  mode: 'add'
  packageId: string
  packageItemId?: never
  availableItems: Array<{
    id: string
    name: string
    asset_tag: string | null
    equipment_categories: { name: string } | null
  }>
}

type Props = RemoveProps | AddProps

export function PackageItemsManager(props: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  if (props.mode === 'remove') {
    const packageItemId = props.packageItemId
    const packageId = props.packageId

    async function handleRemove() {
      setLoading(true)
      const fd = new FormData()
      fd.set('package_item_id', packageItemId)
      fd.set('package_id', packageId)
      const result = await removeItemFromPackage(fd)
      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        router.refresh()
      }
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRemove}
        disabled={loading}
        className="text-gray-400 hover:text-red-600 shrink-0"
        title="Remove from package"
      >
        <X size={14} />
      </Button>
    )
  }

  // Add mode
  const filtered = props.availableItems.filter(item => {
    if (!search) return true
    const q = search.toLowerCase()
    return item.name.toLowerCase().includes(q)
      || (item.asset_tag ?? '').toLowerCase().includes(q)
      || (item.equipment_categories?.name ?? '').toLowerCase().includes(q)
  })

  async function handleAdd(itemId: string) {
    setLoading(true)
    setError(null)
    const fd = new FormData()
    fd.set('package_id', props.packageId)
    fd.set('item_id', itemId)
    const result = await addItemToPackage(fd)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.refresh()
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {props.availableItems.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          All available items are already in packages
        </p>
      ) : (
        <>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search available items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="max-h-60 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No items match</p>
            ) : (
              filtered.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-400">
                      {item.equipment_categories?.name}
                      {item.asset_tag && ` · ${item.asset_tag}`}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAdd(item.id)}
                    disabled={loading}
                    className="text-gray-400 hover:text-green-600 shrink-0"
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
