'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, LogOut, LogIn, Settings, BarChart2, Tag, MapPin, Boxes, ArrowLeftRight, ClipboardCheck, ClipboardList, FileText, ScanLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

const navItems = [
  { href: '/',          label: 'Dashboard',  icon: Home,             requiresRole: false },
  { href: '/inventory', label: 'Inventory',  icon: Package,          requiresRole: false },
  { href: '/checkout',  label: 'Check Out',  icon: LogOut,           requiresRole: true },
  { href: '/checkin',   label: 'Check In',   icon: LogIn,            requiresRole: true },
  { href: '/scan',      label: 'Scan QR',    icon: ScanLine,         requiresRole: false },
  { href: '/transfers', label: 'Transfers',  icon: ArrowLeftRight,   requiresRole: false },
]

const adminItems = [
  { href: '/admin',             label: 'Admin',       icon: Settings,  requiresRole: false },
  { href: '/admin/reports',     label: 'Reports',     icon: BarChart2, requiresRole: false },
  { href: '/admin/packages',    label: 'Packages',    icon: Boxes,     requiresRole: false },
  { href: '/admin/templates',   label: 'Kit Templates', icon: FileText, requiresRole: false },
  { href: '/admin/bulk-checkin', label: 'Bulk Check-In', icon: ClipboardCheck, requiresRole: false },
  { href: '/admin/stock-take',   label: 'Stock Take',    icon: ClipboardList,  requiresRole: false },
  { href: '/admin/categories',  label: 'Categories',  icon: Tag,       requiresRole: false },
  { href: '/admin/locations',   label: 'Locations',   icon: MapPin,    requiresRole: false },
]

export function DesktopSidebar({ profile, pendingTransferCount = 0 }: { profile: Profile; pendingTransferCount?: number }) {
  const pathname = usePathname()
  const isAdmin = profile.role === 'admin'
  const canManage = profile.role === 'admin' || profile.role === 'equipment_manager'
  const visibleNavItems = navItems.filter(item => !item.requiresRole || canManage)

  const renderLink = ({ href, label, icon: Icon }: typeof navItems[0]) => {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
    const badge = href === '/transfers' && pendingTransferCount > 0 ? pendingTransferCount : null
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          active
            ? 'bg-gold-50 text-gold-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
        {label}
        {badge && (
          <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <nav className="flex-1 p-4 space-y-1">
      {visibleNavItems.map(renderLink)}
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
