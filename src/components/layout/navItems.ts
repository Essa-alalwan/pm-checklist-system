import { LayoutDashboard, ListChecks, PlusCircle, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/checklists/new', label: 'New Checklist', icon: PlusCircle },
  { to: '/records', label: 'Records', icon: ListChecks },
  { to: '/settings', label: 'Settings', icon: Settings },
]
