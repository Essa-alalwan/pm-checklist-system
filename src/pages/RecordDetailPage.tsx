import { useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Download, FileQuestion, Pencil, Trash2 } from 'lucide-react'
import { useChecklist } from '../hooks/useChecklist'
import { useReviewChecklist } from '../hooks/useReviewChecklist'
import { useDeleteChecklist } from '../hooks/useDeleteChecklist'
import { useSession } from '../context/SessionContext'
import { ChecklistDetailView } from '../components/checklist/ChecklistDetailView'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { getButtonClasses } from '../components/ui/buttonStyles'
import { Field, inputClasses } from '../components/ui/Field'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

function ReviewPanel({ recordId, onReviewed }: { recordId: string; onReviewed: () => void }) {
  const { name, role } = useSession()
  const { submit, submitting, error } = useReviewChecklist()
  const [reviewedBy, setReviewedBy] = useState(role === 'supervisor' ? name : '')
  const fieldId = useId()

  const handleReview = async () => {
    if (!reviewedBy.trim()) return
    await submit(recordId, reviewedBy.trim())
    onReviewed()
  }

  return (
    <Card className="border-brand/40">
      <CardHeader>
        <h2 className="text-sm font-semibold text-text">Supervisor Review</h2>
      </CardHeader>
      <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <Field label="Reviewed By" htmlFor={fieldId} className="flex-1" required>
          <input id={fieldId} className={inputClasses} value={reviewedBy} onChange={(e) => setReviewedBy(e.target.value)} placeholder="Supervisor name" />
        </Field>
        <Button onClick={handleReview} loading={submitting} disabled={!reviewedBy.trim()} className="shrink-0">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Mark Reviewed
        </Button>
      </CardBody>
      {error && (
        <CardBody className="pt-0">
          <p className="text-sm text-critical">{error}</p>
        </CardBody>
      )}
    </Card>
  )
}

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { record, loading, error, notFound, refetch } = useChecklist(id)
  const { role, userId } = useSession()
  const navigate = useNavigate()
  const { submit: submitDelete, deleting, error: deleteError } = useDeleteChecklist()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const canModify = record !== undefined && (role === 'supervisor' || record.createdByUserId === userId) && record.status !== 'reviewed'

  const handleDelete = async () => {
    if (!record) return
    try {
      await submitDelete(record.id)
      navigate('/records')
    } catch {
      // surfaced via deleteError below
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link to="/records" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to records
        </Link>
        {!loading && !error && !notFound && record && (
          <div className="flex items-center gap-2">
            {canModify && (
              <>
                <Link to={`/records/${record.id}/edit`} className={getButtonClasses('secondary', 'md')}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Link>
                <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              </>
            )}
            <a
              href={`/api/records/${record.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className={getButtonClasses('secondary', 'md')}
            >
              <Download className="size-4" aria-hidden="true" />
              Download PDF
            </a>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-60 w-full rounded-xl" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : notFound || !record ? (
        <EmptyState icon={FileQuestion} title="Record not found" description="This checklist record may have been removed." />
      ) : (
        <div className="flex flex-col gap-5">
          {deleteError && (
            <p role="alert" className="text-sm font-medium text-critical">
              {deleteError}
            </p>
          )}
          <ChecklistDetailView record={record} />
          {role === 'supervisor' && record.status !== 'reviewed' && <ReviewPanel recordId={record.id} onReviewed={refetch} />}
        </div>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this checklist record?"
        description="This permanently removes the submitted checklist and cannot be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  )
}
