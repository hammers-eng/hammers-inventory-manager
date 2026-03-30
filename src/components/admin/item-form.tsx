'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createItem, updateItem } from '@/actions/items'
import { useRouter } from 'next/navigation'

interface Category { id: string; name: string }
interface Location { id: string; name: string }

interface ItemData {
  id?: string
  name?: string
  category_id?: string
  home_location_id?: string | null
  asset_tag?: string | null
  serial_number?: string | null
  description?: string | null
  purchase_date?: string | null
  purchase_cost?: number | null
  expected_life_years?: number | null
  notes?: string | null
}

interface Props {
  categories: Category[]
  locations: Location[]
  item?: ItemData
}

export default function ItemForm({ categories, locations, item }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState(item?.category_id ?? '')
  const [locationId, setLocationId] = useState(item?.home_location_id ?? '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('category_id', categoryId)
    formData.set('home_location_id', locationId)

    startTransition(async () => {
      const result = item?.id
        ? await updateItem(item.id, formData)
        : await createItem(formData)

      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/admin/items')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" defaultValue={item?.name ?? ''} required placeholder="e.g. Match Ball #3" />
        </div>

        <div className="space-y-1.5">
          <Label>Category *</Label>
          <Select value={categoryId} onValueChange={v => setCategoryId(v ?? '')} required>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Home location</Label>
          <Select value={locationId} onValueChange={v => setLocationId(v ?? '')}>
            <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="asset_tag">Asset tag</Label>
          <Input id="asset_tag" name="asset_tag" defaultValue={item?.asset_tag ?? ''} placeholder="e.g. BALL-001" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="serial_number">Serial number</Label>
          <Input id="serial_number" name="serial_number" defaultValue={item?.serial_number ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="purchase_date">Purchase date</Label>
          <Input id="purchase_date" name="purchase_date" type="date" defaultValue={item?.purchase_date ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="purchase_cost">Purchase cost ($)</Label>
          <Input id="purchase_cost" name="purchase_cost" type="number" step="0.01" min="0"
            defaultValue={item?.purchase_cost ?? ''} placeholder="0.00" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expected_life_years">Expected life (years)</Label>
          <Input id="expected_life_years" name="expected_life_years" type="number" min="1" max="30"
            defaultValue={item?.expected_life_years ?? ''} placeholder="e.g. 3" />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" defaultValue={item?.notes ?? ''} placeholder="Any additional notes..." />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? 'Saving...' : item?.id ? 'Save changes' : 'Add item'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
