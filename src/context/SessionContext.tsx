import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { readJson, writeJson } from '../data/storage'

export type UserRole = 'technician' | 'supervisor'

export interface Session {
  isAuthenticated: boolean
  name: string
  role: UserRole
  department: string
}

const DEFAULT_SESSION: Session = {
  isAuthenticated: false,
  name: 'Faisal Al-Otaibi',
  role: 'technician',
  department: 'Electrical Maintenance',
}

interface SessionContextValue extends Session {
  login: (details: { name: string; role: UserRole }) => void
  logout: () => void
  setRole: (role: UserRole) => void
  updateProfile: (details: Partial<Pick<Session, 'name' | 'department'>>) => void
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

const SESSION_KEY = 'session'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(() => readJson(SESSION_KEY, DEFAULT_SESSION))

  const persist = (next: Session) => {
    setSession(next)
    writeJson(SESSION_KEY, next)
  }

  const value = useMemo<SessionContextValue>(
    () => ({
      ...session,
      login: ({ name, role }) => persist({ ...session, isAuthenticated: true, name, role }),
      logout: () => persist({ ...session, isAuthenticated: false }),
      setRole: (role) => persist({ ...session, role }),
      updateProfile: (details) => persist({ ...session, ...details }),
    }),
    [session],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
