import { useCallback, useEffect, useRef, useState } from 'react'
import { readJson, removeJson, writeJson } from '../data/storage'

export type SaveState = 'idle' | 'saving' | 'saved'

export function useDraft<T>(draftKey: string, initial: T) {
  const [draft, setDraft] = useState<T>(() => readJson(draftKey, initial))
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (savedTimeout.current) clearTimeout(savedTimeout.current)
    }
  }, [])

  const persist = useCallback(
    (value: T) => {
      setDraft(value)
      setSaveState('saving')
      writeJson(draftKey, value)
      if (savedTimeout.current) clearTimeout(savedTimeout.current)
      savedTimeout.current = setTimeout(() => setSaveState('saved'), 250)
    },
    [draftKey],
  )

  const clearDraft = useCallback(() => {
    removeJson(draftKey)
    setSaveState('idle')
  }, [draftKey])

  return { draft, setDraft: persist, saveState, clearDraft }
}
