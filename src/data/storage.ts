const NAMESPACE = 'pm-logbook'

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(`${NAMESPACE}:${key}`)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(`${NAMESPACE}:${key}`, JSON.stringify(value))
  } catch {
    // storage unavailable (private mode / quota) — fail silently, in-memory state still works for this session
  }
}

export function removeJson(key: string): void {
  try {
    window.localStorage.removeItem(`${NAMESPACE}:${key}`)
  } catch {
    // ignore
  }
}
