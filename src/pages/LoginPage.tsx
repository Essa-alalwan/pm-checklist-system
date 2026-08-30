import { useId, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, User as UserIcon } from 'lucide-react'
import { useSession } from '../context/SessionContext'
import { ApiError } from '../data/apiClient'
import { Button } from '../components/ui/Button'
import { Field, inputClasses } from '../components/ui/Field'

export default function LoginPage() {
  const { isAuthenticated, loading: sessionLoading, login } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const usernameId = useId()
  const passwordId = useId()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!sessionLoading && isAuthenticated) {
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? '/'
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login({ username: username.trim(), password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <svg viewBox="0 0 32 32" className="mb-4 size-14" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="var(--color-surface-3)" />
            <circle cx="16" cy="16" r="10.5" fill="none" stroke="var(--color-brand)" strokeWidth="2" />
            <circle cx="16" cy="16" r="3" fill="var(--color-brand)" />
            <path
              d="M16 5.5V2.5M16 29.5V26.5M5.5 16H2.5M29.5 16H26.5"
              stroke="var(--color-brand)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <h1 className="font-mono text-lg font-semibold tracking-wide text-text">PM Logbook</h1>
          <p className="mt-1 text-sm text-text-muted">Aldur-2 Power &amp; Water Services</p>
          <p className="text-xs text-text-faint">Electrical Maintenance Department · NOMAC</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-surface p-6 shadow-[0_0_0_1px_rgba(45,212,224,0.08)]"
        >
          <div className="flex flex-col gap-4">
            <Field label="Username" htmlFor={usernameId}>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" aria-hidden="true" />
                <input
                  id={usernameId}
                  className={`${inputClasses} pl-9`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </Field>

            <Field label="Password" htmlFor={passwordId}>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" aria-hidden="true" />
                <input
                  id={passwordId}
                  type="password"
                  className={`${inputClasses} pl-9`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                />
              </div>
            </Field>

            {error && (
              <p role="alert" className="text-sm font-medium text-critical">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
