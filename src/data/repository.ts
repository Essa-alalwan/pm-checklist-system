import type { ChecklistRecord, ChecklistType } from '../types/checklist'
import { checklistSeed } from './seed/checklists.seed'
import { readJson, writeJson } from './storage'

const STORE_KEY = 'checklists'
const SIMULATED_LATENCY_MS = 350

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS))
}

function loadAll(): ChecklistRecord[] {
  return readJson<ChecklistRecord[]>(STORE_KEY, checklistSeed)
}

function saveAll(records: ChecklistRecord[]): void {
  writeJson(STORE_KEY, records)
}

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
 * This module is the seam that Phase 2 replaces: every function below keeps its
 * signature and return shape, but the implementation swaps from localStorage
 * reads/writes to real `fetch` calls against the backend API.
 */

export async function listChecklists(filters: ChecklistFilters = {}): Promise<ChecklistRecord[]> {
  const all = loadAll()
  const filtered = all.filter((record) => {
    if (filters.type && filters.type !== 'all' && record.type !== filters.type) return false
    if (filters.kksCode && !record.kksCode.toLowerCase().includes(filters.kksCode.toLowerCase())) return false
    if (filters.technician && !record.doneBy.toLowerCase().includes(filters.technician.toLowerCase())) return false
    if (filters.dateFrom && record.date < filters.dateFrom) return false
    if (filters.dateTo && record.date > filters.dateTo) return false
    if (filters.onlyFlagged && !hasFlaggedItems(record)) return false
    return true
  })
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return delay(filtered)
}

export async function getChecklist(id: string): Promise<ChecklistRecord | undefined> {
  const all = loadAll()
  return delay(all.find((r) => r.id === id))
}

export async function createChecklist(record: ChecklistRecord): Promise<ChecklistRecord> {
  const all = loadAll()
  const next = [record, ...all]
  saveAll(next)
  return delay(record)
}

export async function reviewChecklist(id: string, reviewedBy: string): Promise<ChecklistRecord> {
  const all = loadAll()
  const idx = all.findIndex((r) => r.id === id)
  if (idx === -1) throw new Error(`Checklist ${id} not found`)
  const updated: ChecklistRecord = {
    ...all[idx],
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    status: 'reviewed',
  }
  all[idx] = updated
  saveAll(all)
  return delay(updated)
}

export interface DashboardStats {
  recordsThisWeek: number
  flaggedAwaitingReview: number
  totalRecords: number
  pendingReview: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const all = loadAll()
  const now = new Date('2026-08-26T23:59:59')
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const recordsThisWeek = all.filter((r) => new Date(r.createdAt) >= weekAgo).length
  const flaggedAwaitingReview = all.filter((r) => hasFlaggedItems(r) && r.status !== 'reviewed').length
  const pendingReview = all.filter((r) => r.status !== 'reviewed').length

  return delay({
    recordsThisWeek,
    flaggedAwaitingReview,
    totalRecords: all.length,
    pendingReview,
  })
}

export async function getRecentActivity(limit = 6): Promise<ChecklistRecord[]> {
  const all = loadAll()
  const sorted = [...all].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return delay(sorted.slice(0, limit))
}
