import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiFetch } from '../data/apiClient'
import type { ChecklistTemplate, ChecklistType } from '../types/checklist'

interface TemplatesContextValue {
  templates: ChecklistTemplate[]
  loading: boolean
  error: string | null
  getTemplate: (type: ChecklistType) => ChecklistTemplate | undefined
  refetch: () => void
}

const TemplatesContext = createContext<TemplatesContextValue | undefined>(undefined)

export function TemplatesProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiFetch<ChecklistTemplate[]>('/templates')
      .then((data) => {
        if (!cancelled) setTemplates(data)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load checklist templates.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const value = useMemo<TemplatesContextValue>(
    () => ({
      templates,
      loading,
      error,
      getTemplate: (type) => templates.find((t) => t.type === type),
      refetch: () => setReloadToken((t) => t + 1),
    }),
    [templates, loading, error],
  )

  return <TemplatesContext.Provider value={value}>{children}</TemplatesContext.Provider>
}

export function useTemplates(): TemplatesContextValue {
  const ctx = useContext(TemplatesContext)
  if (!ctx) throw new Error('useTemplates must be used within a TemplatesProvider')
  return ctx
}
