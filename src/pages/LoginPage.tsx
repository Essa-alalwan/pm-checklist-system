import { useId, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, User as UserIcon } from 'lucide-react'
import { useSession } from '../context/SessionContext'
import { ApiError } from '../data/apiClient'
import { Button } from '../components/ui/Button'
import { Field, inputClasses } from '../components/ui/Field'
import acwaLogo from '../assets/acwa-logo.jpg'

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
          <span className="mb-4 flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2.5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <img src={acwaLogo} alt="ACWA Power" className="size-full object-contain" />
          </span>
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
