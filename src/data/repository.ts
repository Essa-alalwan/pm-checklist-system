import type { ChecklistCreateInput, ChecklistRecord, ChecklistType } from '../types/checklist'
import { apiFetch, buildQueryString } from './apiClient'

export function hasFlaggedItems(record: ChecklistRecord): boolean {
  return record.items.some((item) => item.status === 'flagged')
}

export interface ChecklistFilters {
  type?: ChecklistType | 'all'
  kksCode?: string
  technician?: string
  dateFrom?: string
  dateTo?: string
  onlyFlagged?: boolean
}

/**
 * This module is the seam Phase 2 replaced: every function below keeps the
 * exact signature and return shape it had in Phase 1 (when it read/wrote
 * localStorage) — only the implementation changed, to real API calls. Pages
 * and hooks built against this module needed no changes.
 */

export async function listChecklists(filters: ChecklistFilters = {}): Promise<ChecklistRecord[]> {
  const qs = buildQueryString({
    type: filters.type,
    kksCode: filters.kksCode,
    technician: filters.technician,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    onlyFlagged: filters.onlyFlagged ? 'true' : undefined,
  })
  return apiFetch<ChecklistRecord[]>(`/records${qs}`)
}

export async function getChecklist(id: string): Promise<ChecklistRecord | undefined> {
  try {
    return await apiFetch<ChecklistRecord>(`/records/${id}`)
  } catch (err) {
    if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404) return undefined
    throw err
  }
}

export async function createChecklist(input: ChecklistCreateInput): Promise<ChecklistRecord> {
  return apiFetch<ChecklistRecord>('/records', { method: 'POST', body: JSON.stringify(input) })
}

export async function reviewChecklist(id: string, reviewedBy: string): Promise<ChecklistRecord> {
  return apiFetch<ChecklistRecord>(`/records/${id}/review`, { method: 'PATCH', body: JSON.stringify({ reviewedBy }) })
}

export async function updateChecklist(id: string, input: ChecklistCreateInput): Promise<ChecklistRecord> {
  return apiFetch<ChecklistRecord>(`/records/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
}

export async function deleteChecklist(id: string): Promise<void> {
  await apiFetch<void>(`/records/${id}`, { method: 'DELETE' })
}

export interface DashboardStats {
  recordsThisWeek: number
  flaggedAwaitingReview: number
  totalRecords: number
  pendingReview: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/dashboard/stats')
}

export async function getRecentActivity(limit = 6): Promise<ChecklistRecord[]> {
  return apiFetch<ChecklistRecord[]>(`/dashboard/recent${buildQueryString({ limit: String(limit) })}`)
}
