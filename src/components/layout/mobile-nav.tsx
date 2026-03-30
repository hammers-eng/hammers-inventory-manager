'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, LogOut, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/',          label: 'Home',      icon: Home },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/checkout',  label: 'Check Out', icon: LogOut },
  { href: '/checkin',   label: 'Check In',  icon: LogIn },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border-t safe-area-pb">
      <div className="grid grid-cols-4 h-16">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs transition-colors',
                active ? 'text-gold-600' : 'text-gray-400'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className={cn('text-[10px]', active && 'font-semibold')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
