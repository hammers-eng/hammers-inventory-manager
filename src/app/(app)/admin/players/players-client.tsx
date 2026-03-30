'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createPlayer, updatePlayer } from '@/actions/items'
import { Plus, ChevronDown, ChevronUp, UserCheck, UserX } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Player {
  id: string
  full_name: string
  jersey_number: number | null
  position: string | null
  email: string | null
  phone: string | null
  is_active: boolean
}

export default function PlayersClient({ players }: { players: Player[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const active = players.filter(p => p.is_active)
  const inactive = players.filter(p => !p.is_active)

  function PlayerForm({ player, onDone }: { player?: Player; onDone: () => void }) {
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault()
      setError(null)
      const formData = new FormData(e.currentTarget)
      if (player) formData.set('is_active', player.is_active.toString())

      startTransition(async () => {
        const result = player
          ? await updatePlayer(player.id, formData)
          : await createPlayer(formData)

        if (result?.error) {
          setError(result.error)
        } else {
          onDone()
          router.refresh()
        }
      })
    }

    return (
      <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg border p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label htmlFor="full_name" className="text-xs">Full name *</Label>
            <Input id="full_name" name="full_name" required defaultValue={player?.full_name ?? ''} placeholder="e.g. John Smith" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="jersey_number" className="text-xs">Jersey #</Label>
            <Input id="jersey_number" name="jersey_number" type="number" min="1" defaultValue={player?.jersey_number ?? ''} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="position" className="text-xs">Position</Label>
            <Input id="position" name="position" defaultValue={player?.position ?? ''} placeholder="e.g. Flanker" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={player?.email ?? ''} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-xs">Phone</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={player?.phone ?? ''} />
          </div>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending} className="flex-1">
            {isPending ? 'Saving...' : player ? 'Save' : 'Add player'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onDone}>Cancel</Button>
        </div>
      </form>
    )
  }

  async function toggleActive(player: Player) {
    const formData = new FormData()
    formData.set('full_name', player.full_name)
    if (player.jersey_number) formData.set('jersey_number', player.jersey_number.toString())
    if (player.position) formData.set('position', player.position)
    if (player.email) formData.set('email', player.email)
    if (player.phone) formData.set('phone', player.phone)
    formData.set('is_active', (!player.is_active).toString())

    startTransition(async () => {
      await updatePlayer(player.id, formData)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus size={16} /> Add player
        </Button>
      ) : (
        <PlayerForm onDone={() => setShowForm(false)} />
      )}

      <div className="space-y-2">
        {active.map(player => (
          <div key={player.id}>
            {editingId === player.id ? (
              <PlayerForm player={player} onDone={() => setEditingId(null)} />
            ) : (
              <div className="bg-white rounded-lg border p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{player.full_name}</span>
                    {player.jersey_number && (
                      <span className="text-xs text-gray-400">#{player.jersey_number}</span>
                    )}
                  </div>
                  {player.position && <div className="text-xs text-gray-500">{player.position}</div>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditingId(player.id)}
                    className="text-xs text-blue-600 px-2 py-1 hover:underline">Edit</button>
                  <button onClick={() => toggleActive(player)} disabled={isPending}
                    className="p-1 text-gray-300 hover:text-gray-500" title="Deactivate">
                    <UserX size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {inactive.length > 0 && (
        <details>
          <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 select-none">
            {inactive.length} inactive players
          </summary>
          <div className="mt-2 space-y-2">
            {inactive.map(player => (
              <div key={player.id} className="bg-gray-50 rounded-lg border p-3 flex items-center gap-3 opacity-60">
                <div className="flex-1 text-sm text-gray-600">{player.full_name}</div>
                <button onClick={() => toggleActive(player)} disabled={isPending}
                  className="p-1 text-gray-400 hover:text-green-600" title="Reactivate">
                  <UserCheck size={15} />
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
