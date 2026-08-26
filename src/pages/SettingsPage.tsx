import { useId, useState } from 'react'
import { LogOut, Save } from 'lucide-react'
import { useSession } from '../context/SessionContext'
import type { UserRole } from '../context/SessionContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Field, inputClasses } from '../components/ui/Field'
import { Button } from '../components/ui/Button'

export default function SettingsPage() {
  const { name, department, role, updateProfile, setRole, logout } = useSession()
  const [nameInput, setNameInput] = useState(name)
  const [departmentInput, setDepartmentInput] = useState(department)
  const [saved, setSaved] = useState(false)
  const nameId = useId()
  const deptId = useId()

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({ name: nameInput.trim() || name, department: departmentInput.trim() || department })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <PageHeader title="Settings" description="Profile and preview options for this build." />

      <div className="flex max-w-xl flex-col gap-5">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Profile</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Field label="Name" htmlFor={nameId}>
                <input id={nameId} className={inputClasses} value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
              </Field>
              <Field label="Department" htmlFor={deptId}>
                <input id={deptId} className={inputClasses} value={departmentInput} onChange={(e) => setDepartmentInput(e.target.value)} />
              </Field>
              <div className="flex items-center gap-3">
                <Button type="submit" variant="secondary">
                  <Save className="size-4" aria-hidden="true" />
                  Save changes
                </Button>
                {saved && <span className="text-sm font-medium text-done">Saved.</span>}
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Role Preview</h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">
              Authentication isn't connected yet. Use this to preview the app as either role — technicians submit checklists, supervisors
              review and approve them.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['technician', 'supervisor'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  aria-pressed={role === r}
                  className={`min-h-11 rounded-lg border text-sm font-semibold capitalize transition-colors ${
                    role === r ? 'border-brand bg-brand-dim text-brand-strong' : 'border-border-strong bg-surface-2 text-text-muted hover:text-text'
                  }`}
                >
                  {r}
                </button>
              ))}
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
