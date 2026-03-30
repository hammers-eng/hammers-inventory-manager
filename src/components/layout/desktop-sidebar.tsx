'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, LogOut, LogIn, Settings, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

const navItems = [
  { href: '/',          label: 'Dashboard', icon: Home },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/checkout',  label: 'Check Out', icon: LogOut },
  { href: '/checkin',   label: 'Check In',  icon: LogIn },
]

const adminItems = [
  { href: '/admin',         label: 'Admin',    icon: Settings },
  { href: '/admin/reports', label: 'Reports',  icon: BarChart2 },
]

export function DesktopSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const isAdmin = profile.role === 'admin'

  const renderLink = ({ href, label, icon: Icon }: typeof navItems[0]) => {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          active
            ? 'bg-red-50 text-red-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
        {label}
      </Link>
    )
  }

  return (
    <nav className="flex-1 p-4 space-y-1">
      {navItems.map(renderLink)}
      {isAdmin && (
        <>
          <div className="pt-4 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Admin
          </div>
          {adminItems.map(renderLink)}
        </>
      )}
    </nav>
  )
}
