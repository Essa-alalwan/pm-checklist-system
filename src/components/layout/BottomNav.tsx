import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { navItems } from './navItems'

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 backdrop-blur md:hidden pb-[env(safe-area-inset-bottom)]"
    >
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            clsx(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
              isActive ? 'text-brand-strong' : 'text-text-faint hover:text-text-muted',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={clsx('size-6', isActive && 'drop-shadow-[0_0_6px_var(--color-brand)]')} aria-hidden="true" />
              {label === 'New Checklist' ? 'New' : label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
