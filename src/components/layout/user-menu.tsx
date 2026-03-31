'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/actions/auth'
import { Database } from '@/lib/supabase/database.types'
import { LogOut, Shield, User, Settings, BarChart2, Boxes, Tag, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Profile = Database['public']['Tables']['profiles']['Row']

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  coach: 'Coach',
  equipment_manager: 'Equipment Manager',
}

export function UserMenu({ profile, compact = false }: { profile: Profile; compact?: boolean }) {
  const router = useRouter()
  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg hover:bg-gray-100 p-1.5 w-full text-left cursor-pointer bg-transparent border-0">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs bg-gray-900 text-gold-400">{initials}</AvatarFallback>
          </Avatar>
          {!compact && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</div>
              <div className="text-xs text-gray-500">{roleLabel[profile.role] ?? profile.role}</div>
            </div>
          )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="font-medium">{profile.full_name}</div>
            <div className="text-xs text-gray-500 font-normal">{profile.email}</div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push('/profile')}>
          <User size={14} />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="text-xs text-gray-400 gap-2">
          <Shield size={14} />
          {roleLabel[profile.role] ?? profile.role}
        </DropdownMenuItem>
        {profile.role === 'admin' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-gray-400">Admin</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push('/admin')}>
              <Settings size={14} /> Admin
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push('/admin/reports')}>
              <BarChart2 size={14} /> Reports
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push('/admin/packages')}>
              <Boxes size={14} /> Packages
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push('/admin/categories')}>
              <Tag size={14} /> Categories
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push('/admin/locations')}>
              <MapPin size={14} /> Locations
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 gap-2 cursor-pointer"
          onClick={() => signOut()}
        >
          <LogOut size={14} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
