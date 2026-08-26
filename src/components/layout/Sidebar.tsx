import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { LogOut } from 'lucide-react'
import { useSession } from '../../context/SessionContext'
import { navItems } from './navItems'
import { Wordmark } from './Wordmark'

export function Sidebar() {
  const { name, role, logout } = useSession()

  return (
    <aside className="hidden md:flex md:w-18 lg:w-64 md:flex-col md:border-r md:border-border md:bg-surface md:shrink-0">
      <div className="flex h-16 items-center border-b border-border px-3 lg:px-5">
        <Wordmark compact />
        <span className="hidden lg:block lg:ml-2.5">
          <span className="sr-only">PM Logbook — Aldur-2 Power & Water Services</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2.5 py-4" aria-label="Primary">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors lg:justify-start justify-center',
                isActive
                  ? 'bg-brand-dim text-brand-strong shadow-[0_0_0_1px_var(--color-brand)_inset]'
                  : 'text-text-muted hover:bg-surface-2 hover:text-text',
              )
            }
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className="hidden lg:inline">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-3 font-mono text-xs font-semibold text-text">
            {name
              .split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-medium text-text">{name}</p>
            <p className="truncate text-xs text-text-faint capitalize">{role}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="hidden lg:flex ml-auto size-8 items-center justify-center rounded-md text-text-faint hover:text-critical hover:bg-critical/10"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  )
}
