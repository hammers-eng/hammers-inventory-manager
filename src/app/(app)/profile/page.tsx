import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Shield, Package, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

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

  // Fetch open loans where this user is the recipient or checked it out
  const { data: loans } = await (supabase as any)
    .from('equipment_loans')
    .select('id, recipient_name, checked_out_at, expected_return_date, purpose, item_id, equipment_items(id, name, asset_tag)')
    .is('checked_in_at', null)
    .or(`recipient_name.ilike.${profile.full_name},checked_out_by.eq.${profile.id}`)
    .order('checked_out_at', { ascending: false }) as { data: Array<{
      id: string
      recipient_name: string
      checked_out_at: string
      expected_return_date: string | null
      purpose: string | null
      item_id: string
      equipment_items: { id: string; name: string; asset_tag: string | null }
    }> | null }

  const openLoans = loans ?? []
  const now = new Date()

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

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Current equipment</h2>
          <span className="text-xs text-gray-500">{openLoans.length} item{openLoans.length !== 1 ? 's' : ''}</span>
        </div>

        {openLoans.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No equipment currently issued to you</p>
        ) : (
          <div className="space-y-3">
            {openLoans.map(loan => {
              const item = loan.equipment_items
              const isOverdue = loan.expected_return_date && new Date(loan.expected_return_date) < now
              const checkedOut = new Date(loan.checked_out_at).toLocaleDateString()
              const dueDate = loan.expected_return_date
                ? new Date(loan.expected_return_date).toLocaleDateString()
                : null

              return (
                <Link
                  key={loan.id}
                  href={`/inventory/${item.id}`}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <Package size={18} className="text-gray-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    {item.asset_tag && (
                      <div className="text-xs text-gray-400">{item.asset_tag}</div>
                    )}
                    {loan.purpose && (
                      <div className="text-xs text-gray-500 mt-0.5">{loan.purpose}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      Checked out {checkedOut}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {dueDate ? (
                      <div className={`text-xs font-medium flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                        {isOverdue && <AlertTriangle size={12} />}
                        {isOverdue ? 'Overdue' : 'Due'} {dueDate}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">No due date</div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
