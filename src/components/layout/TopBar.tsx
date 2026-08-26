import { useEffect, useState } from 'react'
import { useSession } from '../../context/SessionContext'
import { Wordmark } from './Wordmark'

function formatClock(d: Date) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

export function TopBar() {
  const [now, setNow] = useState(() => new Date())
  const { name, role } = useSession()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface/70 px-4 backdrop-blur md:px-6">
      <div className="md:hidden">
        <Wordmark />
      </div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        <div className="hidden text-right font-mono text-xs text-text-faint sm:block">
          <div className="tabular-nums text-text-muted">{formatClock(now)}</div>
          <div>{formatDate(now)}</div>
        </div>
        <div className="flex md:hidden items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5">
          <span className="size-1.5 rounded-full bg-done shadow-[0_0_6px_var(--color-done)]" aria-hidden="true" />
          <span className="text-xs font-medium text-text-muted capitalize">{role}</span>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5">
          <span className="size-1.5 rounded-full bg-done shadow-[0_0_6px_var(--color-done)]" aria-hidden="true" />
          <span className="text-xs font-medium text-text-muted">
            Signed in as <span className="text-text">{name}</span>
          </span>
        </div>
      </div>
    </header>
  )
}
