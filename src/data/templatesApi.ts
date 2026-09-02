import { apiFetch, apiUpload } from './apiClient'
import type { ChecklistTemplate, ChecklistTemplateLogFieldDef, ChecklistTemplateMeasurementFieldDef } from '../types/checklist'

export interface DetectedItem {
  text: string
  source: 'list' | 'table'
  sourceTableIndex?: number
}

export type TableClassificationKind = 'grid' | 'log' | 'skipped-reference' | 'skipped-header' | 'ambiguous'

export interface DetectedTableGroup {
  sourceTableIndex: number
  classification: TableClassificationKind
  groupLabel: string
  measurementFields?: Omit<ChecklistTemplateMeasurementFieldDef, 'id'>[]
  logFields?: Omit<ChecklistTemplateLogFieldDef, 'id'>[]
  previewRows: string[][]
}

export interface ParsedChecklistDocx {
  suggestedLabel: string
  suggestedDescription: string
  items: DetectedItem[]
  tableGroups: DetectedTableGroup[]
}

export async function parseChecklistDocx(file: File): Promise<ParsedChecklistDocx> {
  const formData = new FormData()
  formData.append('file', file)
  return apiUpload<ParsedChecklistDocx>('/templates/parse-docx', formData)
}

export interface CreateChecklistTemplateInput {
  label: string
  description?: string
  items: string[]
  measurementFields?: Omit<ChecklistTemplateMeasurementFieldDef, 'id'>[]
  logFields?: Omit<ChecklistTemplateLogFieldDef, 'id'>[]
}

export async function createChecklistTemplate(input: CreateChecklistTemplateInput): Promise<ChecklistTemplate> {
  return apiFetch<ChecklistTemplate>('/templates', { method: 'POST', body: JSON.stringify(input) })
}

export async function updateChecklistTemplate(type: string, input: CreateChecklistTemplateInput): Promise<ChecklistTemplate> {
  return apiFetch<ChecklistTemplate>(`/templates/${type}`, { method: 'PATCH', body: JSON.stringify(input) })
}

export async function deleteChecklistTemplate(type: string): Promise<void> {
  await apiFetch<void>(`/templates/${type}`, { method: 'DELETE' })
}
