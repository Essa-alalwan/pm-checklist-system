import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { TemplateItemsEditor, type TemplateReviewState } from '../components/templates/TemplateItemsEditor'
import { TemplateFieldsEditor, type TemplateFieldsState } from '../components/templates/TemplateFieldsEditor'
import { useTemplates } from '../context/TemplatesContext'
import { useSession } from '../context/SessionContext'
import { updateChecklistTemplate } from '../data/templatesApi'
import { ApiError } from '../data/apiClient'
import { BUILT_IN_CHECKLIST_TYPES, type ChecklistTemplate } from '../types/checklist'

function EditChecklistTypeInner({ template }: { template: ChecklistTemplate }) {
  const navigate = useNavigate()
  const { refetch } = useTemplates()
  const [review, setReview] = useState<TemplateReviewState>({
    label: template.label,
    description: template.description,
    items: template.items.map((i) => i.label),
  })
  const [fields, setFields] = useState<TemplateFieldsState>({
    measurementFields: template.measurementFields.map((f) => ({
      groupLabel: f.groupLabel,
      rowLabel: f.rowLabel,
      columnLabel: f.columnLabel,
      unit: f.unit,
      fieldType: f.fieldType,
    })),
    logFields: template.logFields.map((f) => ({
      groupLabel: f.groupLabel,
      columnLabel: f.columnLabel,
      fieldType: f.fieldType,
      unit: f.unit,
    })),
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const items = review.items.map((i) => i.trim()).filter(Boolean)
    if (!review.label.trim() || items.length === 0) {
      setSubmitError('A title and at least one checklist item are required.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await updateChecklistTemplate(template.type, {
        label: review.label.trim(),
        description: review.description.trim(),
        items,
        measurementFields: fields.measurementFields,
        logFields: fields.logFields,
      })
      refetch()
      navigate('/checklists/new')
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Could not save these changes. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/checklists/new')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to checklist types
      </button>

      <PageHeader title={`Edit "${template.label}"`} description="Changes apply immediately once saved." />

      <TemplateItemsEditor review={review} onChange={setReview} />

      <div className="mt-5">
        <TemplateFieldsEditor fields={fields} onChange={setFields} />
      </div>

      {submitError && (
        <p role="alert" className="mt-4 text-sm font-medium text-critical">
          {submitError}
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <Button onClick={handleSubmit} loading={submitting}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}

export default function EditChecklistTypePage() {
  const { type } = useParams<{ type: string }>()
  const { role } = useSession()
  const { getTemplate, loading } = useTemplates()

  if (loading) return null

  const template = type ? getTemplate(type) : undefined
  if (role !== 'supervisor' || !type || (BUILT_IN_CHECKLIST_TYPES as readonly string[]).includes(type) || !template) {
    return <Navigate to="/checklists/new" replace />
  }

  return <EditChecklistTypeInner key={type} template={template} />
}
