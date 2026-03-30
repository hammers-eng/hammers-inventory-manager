import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Shield } from 'lucide-react'

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  coach: 'Coach',
  equipment_manager: 'Equipment Manager',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, created_at')
    .eq('id', user.id)
    .single() as { data: { id: string; full_name: string; email: string; role: string; avatar_url: string | null; created_at: string } | null }

  if (!profile) redirect('/login')

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Profile</h1>

      <div className="bg-white rounded-xl border p-6 flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="text-lg bg-gray-900 text-gold-400">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-lg font-semibold text-gray-900">{profile.full_name}</div>
          <div className="text-sm text-gray-500">{profile.email}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <Shield size={12} />
            {roleLabel[profile.role] ?? profile.role}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Account details</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-gray-500">Name</dt>
          <dd className="text-gray-900">{profile.full_name}</dd>
          <dt className="text-gray-500">Email</dt>
          <dd className="text-gray-900">{profile.email}</dd>
          <dt className="text-gray-500">Role</dt>
          <dd className="text-gray-900">{roleLabel[profile.role] ?? profile.role}</dd>
          <dt className="text-gray-500">Member since</dt>
          <dd className="text-gray-900">{new Date(profile.created_at).toLocaleDateString()}</dd>
        </dl>
      </div>
    </div>
  )
}
