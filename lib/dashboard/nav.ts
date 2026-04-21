import {
  Home,
  FileText,
  PlusCircle,
  LayoutTemplate,
  Users,
  Settings,
  User,
  type LucideIcon,
} from 'lucide-react'
import type { UserRole } from './types'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  accent?: boolean
  exact?: boolean
}

const OWNER_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Обзор', icon: Home, exact: true },
  { href: '/dashboard/contracts', label: 'Договоры', icon: FileText },
  { href: '/dashboard/contracts/new', label: 'Создать договор', icon: PlusCircle, accent: true },
  { href: '/dashboard/templates', label: 'Шаблоны', icon: LayoutTemplate },
  { href: '/dashboard/team', label: 'Команда', icon: Users },
  { href: '/dashboard/settings', label: 'Настройки', icon: Settings },
]

const MANAGER_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Обзор', icon: Home, exact: true },
  { href: '/dashboard/contracts', label: 'Мои договоры', icon: FileText },
  { href: '/dashboard/contracts/new', label: 'Создать договор', icon: PlusCircle, accent: true },
  { href: '/dashboard/profile', label: 'Профиль', icon: User },
]

export function getNavItems(role: UserRole): NavItem[] {
  return role === 'owner' ? OWNER_ITEMS : MANAGER_ITEMS
}

export function getMobileNavItems(role: UserRole): NavItem[] {
  if (role === 'owner') {
    return [
      OWNER_ITEMS[0],
      OWNER_ITEMS[1],
      OWNER_ITEMS[2],
      OWNER_ITEMS[4],
      OWNER_ITEMS[5],
    ]
  }
  return MANAGER_ITEMS
}

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(item.href + '/')
}
