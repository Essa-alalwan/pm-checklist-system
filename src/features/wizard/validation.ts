import type { ChecklistDraft } from './draftFactory'

export interface JobInfoErrors {
  kksCode?: string
  equipmentDescription?: string
  date?: string
  preparedBy?: string
  doneBy?: string
}

export function validateJobInfo(draft: ChecklistDraft): JobInfoErrors {
  const errors: JobInfoErrors = {}
  if (!draft.kksCode.trim()) errors.kksCode = 'KKS code is required'
  if (!draft.equipmentDescription.trim()) errors.equipmentDescription = 'Equipment description is required'
  if (!draft.date) errors.date = 'Date is required'
  if (!draft.preparedBy.trim()) errors.preparedBy = 'Prepared By is required'
  if (!draft.doneBy.trim()) errors.doneBy = 'Done By is required'
  return errors
}

export interface ItemsValidationError {
  message: string
  itemId: string
}

export function validateItems(draft: ChecklistDraft): ItemsValidationError | null {
  const unmarked = draft.items.find((item) => item.status === 'pending')
  if (unmarked) return { message: `Mark a status for "${unmarked.label}" before continuing.`, itemId: unmarked.id }

  const missingNote = draft.items.find((item) => item.status === 'flagged' && !item.note?.trim())
  if (missingNote) return { message: `Add a note describing the issue for "${missingNote.label}".`, itemId: missingNote.id }
  return null
}

export function validateSignature(draft: ChecklistDraft): string | null {
  if (!draft.signatureDataUrl) return 'Technician signature is required before submitting.'
  return null
}

export function isJobInfoValid(draft: ChecklistDraft): boolean {
  return Object.keys(validateJobInfo(draft)).length === 0
}
