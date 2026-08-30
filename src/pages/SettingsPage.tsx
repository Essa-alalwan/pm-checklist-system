import { LogOut } from 'lucide-react'
import { useSession } from '../context/SessionContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export default function SettingsPage() {
  const { name, department, role, logout } = useSession()

  return (
    <div>
      <PageHeader title="Settings" description="Your account details for PM Logbook." />

      <div className="flex max-w-xl flex-col gap-5">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Profile</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">Name</p>
              <p className="mt-0.5 text-sm text-text">{name}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">Role</p>
              <p className="mt-0.5 text-sm text-text capitalize">{role}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">Department</p>
              <p className="mt-0.5 text-sm text-text">{department}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Session</h2>
          </CardHeader>
          <CardBody>
            <Button variant="danger" onClick={logout}>
              <LogOut className="size-4" aria-hidden="true" />
              Log out
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
