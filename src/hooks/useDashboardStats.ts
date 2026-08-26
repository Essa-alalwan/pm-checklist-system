import { useEffect, useState } from 'react'
import { getDashboardStats, getRecentActivity, type DashboardStats } from '../data/repository'
import type { ChecklistRecord } from '../types/checklist'

interface UseDashboardResult {
  stats: DashboardStats | null
  recent: ChecklistRecord[]
  loading: boolean
  error: string | null
}

export function useDashboardStats(): UseDashboardResult {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<ChecklistRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([getDashboardStats(), getRecentActivity()])
      .then(([statsData, recentData]) => {
        if (cancelled) return
        setStats(statsData)
        setRecent(recentData)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load dashboard data. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { stats, recent, loading, error }
}
