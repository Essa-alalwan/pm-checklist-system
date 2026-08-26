import { useCallback, useEffect, useState } from 'react'
import { getChecklist } from '../data/repository'
import type { ChecklistRecord } from '../types/checklist'

interface UseChecklistResult {
  record: ChecklistRecord | undefined
  loading: boolean
  error: string | null
  notFound: boolean
  refetch: () => void
}

export function useChecklist(id: string | undefined): UseChecklistResult {
  const [record, setRecord] = useState<ChecklistRecord | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setNotFound(false)
    getChecklist(id)
      .then((data) => {
        if (cancelled) return
        if (!data) setNotFound(true)
        setRecord(data)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this record. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, reloadToken])

  const refetch = useCallback(() => setReloadToken((t) => t + 1), [])

  return { record, loading, error, notFound, refetch }
}
