'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, LogOut, LogIn, ArrowLeftRight, ScanLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserRole } from '@/lib/supabase/database.types'

const allTabs = [
  { href: '/',          label: 'Home',      icon: Home,             requiresRole: false },
  { href: '/inventory', label: 'Inventory', icon: Package,          requiresRole: false },
  { href: '/scan',      label: 'Scan',      icon: ScanLine,         requiresRole: false },
  { href: '/transfers', label: 'Transfers', icon: ArrowLeftRight,   requiresRole: false },
  { href: '/checkout',  label: 'Out',       icon: LogOut,           requiresRole: true },
  { href: '/checkin',   label: 'In',        icon: LogIn,            requiresRole: true },
]

export function MobileNav({ pendingTransferCount = 0, role }: { pendingTransferCount?: number; role?: UserRole }) {
  const pathname = usePathname()
  const canManage = role === 'admin' || role === 'equipment_manager'
  const tabs = allTabs.filter(t => !t.requiresRole || canManage)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border-t safe-area-pb">
      <div className={cn('grid h-16', canManage ? 'grid-cols-6' : 'grid-cols-4')}>
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          const badge = href === '/transfers' && pendingTransferCount > 0 ? pendingTransferCount : null
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs transition-colors relative',
                active ? 'text-gold-600' : 'text-gray-400'
              )}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                {badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px]', active && 'font-semibold')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
