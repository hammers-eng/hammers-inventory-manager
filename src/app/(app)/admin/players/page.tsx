import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlayersClient from './players-client'

export default async function PlayersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (profile?.role !== 'admin') redirect('/')

  const { data: players } = await supabase
    .from('players')
    .select('id, full_name, jersey_number, position, email, phone, is_active')
    .order('full_name')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Players</h1>
        <p className="text-sm text-gray-500">Manage squad members for equipment assignment</p>
      </div>
      <PlayersClient players={players ?? []} />
    </div>
  )
}
