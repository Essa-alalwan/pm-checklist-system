import { useState } from 'react'
import { deleteChecklist } from '../data/repository'
import { ApiError } from '../data/apiClient'

export function useDeleteChecklist() {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (id: string): Promise<void> => {
    setDeleting(true)
    setError(null)
    try {
      await deleteChecklist(id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this record. Please try again.')
      throw err
    } finally {
      setDeleting(false)
    }
  }

  return { submit, deleting, error }
}
