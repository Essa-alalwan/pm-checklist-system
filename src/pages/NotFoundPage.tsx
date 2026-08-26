import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'
import { getButtonClasses } from '../components/ui/buttonStyles'

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved."
      action={
        <Link to="/" className={getButtonClasses('primary', 'md')}>
          Back to dashboard
        </Link>
      }
    />
  )
}
