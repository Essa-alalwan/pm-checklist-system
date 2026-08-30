import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiFetch, ApiError } from '../data/apiClient'

export type UserRole = 'technician' | 'supervisor'

export interface Session {
  isAuthenticated: boolean
  loading: boolean
  name: string
  role: UserRole
  department: string
  signatureDataUrl?: string
}

const INITIAL_SESSION: Session = {
  isAuthenticated: false,
  loading: true,
  name: '',
  role: 'technician',
  department: '',
  signatureDataUrl: undefined,
}

interface ApiUser {
  id: string
  name: string
  username: string
  role: UserRole
  department: string
  signatureDataUrl?: string
}

interface SessionContextValue extends Session {
  login: (details: { username: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  updateSignature: (signatureDataUrl: string) => Promise<void>
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

function toSession(user: ApiUser): Session {
  return { isAuthenticated: true, loading: false, name: user.name, role: user.role, department: user.department, signatureDataUrl: user.signatureDataUrl }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(INITIAL_SESSION)

  useEffect(() => {
    let cancelled = false
    apiFetch<{ user: ApiUser }>('/auth/me')
      .then(({ user }) => {
        if (!cancelled) setSession(toSession(user))
      })
      .catch(() => {
        if (!cancelled) setSession({ ...INITIAL_SESSION, loading: false })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      ...session,
      login: async ({ username, password }) => {
        const { user } = await apiFetch<{ user: ApiUser }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        })
        setSession(toSession(user))
      },
      logout: async () => {
        await apiFetch('/auth/logout', { method: 'POST' })
        setSession({ ...INITIAL_SESSION, loading: false })
      },
      updateSignature: async (signatureDataUrl: string) => {
        const { user } = await apiFetch<{ user: ApiUser }>('/auth/me/signature', {
          method: 'PATCH',
          body: JSON.stringify({ signatureDataUrl }),
        })
        setSession(toSession(user))
      },
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

export { ApiError }
