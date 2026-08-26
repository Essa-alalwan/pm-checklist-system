import { useState } from 'react'
import { reviewChecklist } from '../data/repository'
import type { ChecklistRecord } from '../types/checklist'

export function useReviewChecklist() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (id: string, reviewedBy: string): Promise<ChecklistRecord> => {
    setSubmitting(true)
    setError(null)
    try {
      return await reviewChecklist(id, reviewedBy)
    } catch {
      setError('Could not save the review. Please try again.')
      throw new Error('review failed')
    } finally {
      setSubmitting(false)
    }
  }

  return { submit, submitting, error }
}
