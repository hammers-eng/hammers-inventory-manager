import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MobileNav } from '@/components/layout/mobile-nav'
import { DesktopSidebar } from '@/components/layout/desktop-sidebar'
import { UserMenu } from '@/components/layout/user-menu'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, email, role, avatar_url')
    .eq('id', user.id)
    .single() as { data: import('@/lib/supabase/database.types').Database['public']['Tables']['profiles']['Row'] | null }

  if (!profile) redirect('/login')

  // Count pending incoming transfers for badge
  const { count: pendingTransferCount } = await (supabase as any)
    .from('equipment_transfers')
    .select('id', { count: 'exact', head: true })
    .eq('to_profile_id', user.id)
    .eq('status', 'pending')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r">
          <div className="flex items-center h-16 px-4 border-b border-b-gold-200 gap-2">
            <Image src="/logo.png" alt="Hammers RUFC" width={36} height={36} className="shrink-0" />
            <div>
              <div className="text-sm font-bold text-gray-900 leading-none">Hammers RUFC</div>
              <div className="text-xs text-gold-600">Equipment</div>
            </div>
          </div>
          <DesktopSidebar profile={profile} pendingTransferCount={pendingTransferCount ?? 0} />
          <div className="p-4 border-t">
            <UserMenu profile={profile} />
          </div>
        </div>
      </div>

      {/* Mobile top header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white border-b border-b-gold-200 h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Hammers RUFC" width={28} height={28} className="shrink-0" />
          <span className="text-sm font-bold text-gray-900">Hammers RUFC</span>
        </div>
        <UserMenu profile={profile} compact />
      </div>

      {/* Main content */}
      <main className="md:pl-64 pt-14 pb-20 md:pt-0 md:pb-0 min-h-screen">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav pendingTransferCount={pendingTransferCount ?? 0} role={profile.role} />
    </div>
  )
}
