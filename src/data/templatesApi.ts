import { apiFetch, apiUpload } from './apiClient'
import type { ChecklistTemplate } from '../types/checklist'

export interface ParsedChecklistDocx {
  suggestedLabel: string
  suggestedDescription: string
  items: string[]
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
}

export async function createChecklistTemplate(input: CreateChecklistTemplateInput): Promise<ChecklistTemplate> {
  return apiFetch<ChecklistTemplate>('/templates', { method: 'POST', body: JSON.stringify(input) })
}
