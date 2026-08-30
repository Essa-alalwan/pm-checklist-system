import { useState } from 'react'
import { LogOut, Save } from 'lucide-react'
import { useSession, ApiError } from '../context/SessionContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SignaturePad } from '../components/checklist/SignaturePad'

export default function SettingsPage() {
  const { name, department, role, signatureDataUrl, logout, updateSignature } = useSession()
  const [signatureDraft, setSignatureDraft] = useState(signatureDataUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleSaveSignature = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await updateSignature(signatureDraft)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save your signature. Please try again.')
    } finally {
      setSaving(false)
    }
  }

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
            <h2 className="text-sm font-semibold text-text">Your Signature</h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">
              Saved here, it's pre-filled automatically on every new checklist so you don't have to redraw it each time. You can still
              clear and draw a different one for any individual checklist without changing what's saved here.
            </p>
            <SignaturePad value={signatureDraft} onChange={setSignatureDraft} label="Saved signature" />
            {saveError && (
              <p role="alert" className="text-sm font-medium text-critical">
                {saveError}
              </p>
            )}
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={handleSaveSignature} loading={saving} disabled={!signatureDraft}>
                <Save className="size-4" aria-hidden="true" />
                Save Signature
              </Button>
              {saved && <span className="text-sm font-medium text-done">Saved.</span>}
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
