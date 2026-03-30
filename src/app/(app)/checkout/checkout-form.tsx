'use client'

import { useState, useMemo, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { checkOutItem } from '@/actions/loans'
import { Search, Package, User, X, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Item {
  id: string
  name: string
  asset_tag: string | null
  equipment_categories: { name: string } | null
}

interface Player {
  id: string
  full_name: string
  jersey_number: number | null
  position: string | null
}

interface Props {
  availableItems: Item[]
  players: Player[]
}

export default function CheckOutForm({ availableItems, players }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [itemSearch, setItemSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  const [playerSearch, setPlayerSearch] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [useManualName, setUseManualName] = useState(false)
  const [manualName, setManualName] = useState('')

  const [returnDate, setReturnDate] = useState('')
  const [purpose, setPurpose] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const filteredItems = useMemo(() => {
    const q = itemSearch.toLowerCase()
    if (!q) return availableItems.slice(0, 10)
    return availableItems.filter(
      i => i.name.toLowerCase().includes(q) || (i.asset_tag ?? '').toLowerCase().includes(q)
    ).slice(0, 10)
  }, [availableItems, itemSearch])

  const filteredPlayers = useMemo(() => {
    const q = playerSearch.toLowerCase()
    if (!q) return players.slice(0, 8)
    return players.filter(
      p => p.full_name.toLowerCase().includes(q) ||
        (p.jersey_number?.toString() ?? '').includes(q)
    ).slice(0, 8)
  }, [players, playerSearch])

  const canSubmit = selectedItem && (selectedPlayer || (useManualName && manualName.trim()))

  async function handleSubmit() {
    if (!canSubmit) return
    setError(null)

    const formData = new FormData()
    formData.set('item_id', selectedItem.id)
    if (selectedPlayer) formData.set('player_id', selectedPlayer.id)
    if (useManualName) formData.set('recipient_name', manualName.trim())
    if (returnDate) formData.set('expected_return_date', returnDate)
    if (purpose) formData.set('purpose', purpose)

    startTransition(async () => {
      const result = await checkOutItem(formData)
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
        <div className="text-lg font-semibold text-gray-900">Checked out!</div>
        <div className="text-sm text-gray-500">
          {selectedItem?.name} → {selectedPlayer?.full_name ?? manualName}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Item */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">1. Select item</Label>
        {selectedItem ? (
          <div className="flex items-center gap-3 bg-white border rounded-lg p-3">
            <Package size={18} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900">{selectedItem.name}</div>
              <div className="text-xs text-gray-500">
                {(selectedItem.equipment_categories as any)?.name}
                {selectedItem.asset_tag && ` · ${selectedItem.asset_tag}`}
              </div>
            </div>
            <button onClick={() => { setSelectedItem(null); setItemSearch('') }}>
              <X size={16} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name or asset tag..."
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                className="pl-9"
                autoComplete="off"
              />
            </div>
            {availableItems.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No items available</p>
            ) : (
              <div className="border rounded-lg divide-y bg-white max-h-56 overflow-y-auto">
                {filteredItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setSelectedItem(item); setItemSearch('') }}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 active:bg-gray-100"
                  >
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {(item.equipment_categories as any)?.name}
                      {item.asset_tag && ` · ${item.asset_tag}`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Recipient */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">2. Who is taking it?</Label>
          <button
            onClick={() => { setUseManualName(!useManualName); setSelectedPlayer(null); setPlayerSearch('') }}
            className="text-xs text-blue-600 hover:underline"
          >
            {useManualName ? 'Search players' : 'Enter name manually'}
          </button>
        </div>

        {useManualName ? (
          <Input
            placeholder="Full name"
            value={manualName}
            onChange={e => setManualName(e.target.value)}
          />
        ) : selectedPlayer ? (
          <div className="flex items-center gap-3 bg-white border rounded-lg p-3">
            <User size={18} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900">{selectedPlayer.full_name}</div>
              <div className="text-xs text-gray-500">
                {[
                  selectedPlayer.jersey_number && `#${selectedPlayer.jersey_number}`,
                  selectedPlayer.position,
                ].filter(Boolean).join(' · ')}
              </div>
            </div>
            <button onClick={() => { setSelectedPlayer(null); setPlayerSearch('') }}>
              <X size={16} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search players..."
                value={playerSearch}
                onChange={e => setPlayerSearch(e.target.value)}
                className="pl-9"
                autoComplete="off"
              />
            </div>
            {players.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">
                No players yet.{' '}
                <a href="/admin/players" className="text-blue-600 hover:underline">Add players</a>
                {' '}or enter a name manually.
              </p>
            ) : (
              <div className="border rounded-lg divide-y bg-white max-h-48 overflow-y-auto">
                {filteredPlayers.map(player => (
                  <button
                    key={player.id}
                    onClick={() => { setSelectedPlayer(player); setPlayerSearch('') }}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 active:bg-gray-100"
                  >
                    <div className="text-sm font-medium text-gray-900">{player.full_name}</div>
                    <div className="text-xs text-gray-500">
                      {[
                        player.jersey_number && `#${player.jersey_number}`,
                        player.position,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Details */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">3. Details (optional)</Label>
        <div className="space-y-1">
          <Label htmlFor="return-date" className="text-xs text-gray-500">Expected return date</Label>
          <Input
            id="return-date"
            type="date"
            value={returnDate}
            onChange={e => setReturnDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="purpose" className="text-xs text-gray-500">Purpose / event</Label>
          <Input
            id="purpose"
            placeholder="e.g. Match vs Denver RFC"
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || isPending}
        className="w-full"
        size="lg"
      >
        {isPending ? 'Processing...' : 'Confirm Check Out'}
      </Button>
    </div>
  )
}
