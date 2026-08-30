import { useState } from 'react'
import { createChecklist } from '../data/repository'
import type { ChecklistCreateInput, ChecklistRecord } from '../types/checklist'

export function useCreateChecklist() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (input: ChecklistCreateInput): Promise<ChecklistRecord> => {
    setSubmitting(true)
    setError(null)
    try {
      return await createChecklist(input)
    } catch {
      setError('Could not submit this checklist. Please try again.')
      throw new Error('submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  return { submit, submitting, error }
}
