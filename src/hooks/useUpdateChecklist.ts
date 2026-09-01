import { useState } from 'react'
import { updateChecklist } from '../data/repository'
import { ApiError } from '../data/apiClient'
import type { ChecklistCreateInput, ChecklistRecord } from '../types/checklist'

export function useUpdateChecklist() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (id: string, input: ChecklistCreateInput): Promise<ChecklistRecord> => {
    setSubmitting(true)
    setError(null)
    try {
      return await updateChecklist(id, input)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save these changes. Please try again.')
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  return { submit, submitting, error }
}
