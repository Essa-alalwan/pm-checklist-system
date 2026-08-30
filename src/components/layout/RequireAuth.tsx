import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '../../context/SessionContext'

export function RequireAuth() {
  const { isAuthenticated, loading } = useSession()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <div className="size-8 animate-spin rounded-full border-2 border-border-strong border-t-brand" role="status" aria-label="Loading" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
