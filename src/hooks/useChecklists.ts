import { useCallback, useEffect, useState } from 'react'
import { listChecklists, type ChecklistFilters } from '../data/repository'
import type { ChecklistRecord } from '../types/checklist'

interface UseChecklistsResult {
  records: ChecklistRecord[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useChecklists(filters: ChecklistFilters): UseChecklistsResult {
  const [records, setRecords] = useState<ChecklistRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const filterKey = JSON.stringify(filters)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listChecklists(filters)
      .then((data) => {
        if (!cancelled) setRecords(data)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load records. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, reloadToken])

  const refetch = useCallback(() => setReloadToken((t) => t + 1), [])

  return { records, loading, error, refetch }
}
