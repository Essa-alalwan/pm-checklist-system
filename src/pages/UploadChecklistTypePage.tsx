import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileUp, Upload } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TemplateItemsEditor, type TemplateReviewState } from '../components/templates/TemplateItemsEditor'
import { TemplateFieldsEditor, type TemplateFieldsState } from '../components/templates/TemplateFieldsEditor'
import { TableSuggestionsPanel } from '../components/templates/TableSuggestionsPanel'
import { useTemplates } from '../context/TemplatesContext'
import { useSession } from '../context/SessionContext'
import { parseChecklistDocx, createChecklistTemplate, type DetectedTableGroup, type ParsedChecklistDocx } from '../data/templatesApi'
import { ApiError } from '../data/apiClient'

const emptyFields: TemplateFieldsState = { measurementFields: [], logFields: [] }

export default function UploadChecklistTypePage() {
  const navigate = useNavigate()
  const { role } = useSession()
  const { refetch } = useTemplates()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [review, setReview] = useState<TemplateReviewState | null>(null)
  const [fields, setFields] = useState<TemplateFieldsState>(emptyFields)
  const [tableGroups, setTableGroups] = useState<DetectedTableGroup[]>([])
  const [acceptedTableIndexes, setAcceptedTableIndexes] = useState<Set<number>>(new Set())
  const [discardedTableIndexes, setDiscardedTableIndexes] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)
    setParseError(null)
    try {
      const parsed: ParsedChecklistDocx = await parseChecklistDocx(file)
      setReview({ label: parsed.suggestedLabel, description: parsed.suggestedDescription, items: parsed.items.map((i) => i.text) })
      setFields(emptyFields)
      setTableGroups(parsed.tableGroups)
      setAcceptedTableIndexes(new Set())
      setDiscardedTableIndexes(new Set())
    } catch (err) {
      setParseError(err instanceof ApiError ? err.message : 'Could not read this document. Please try again.')
    } finally {
      setParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAcceptTable = (group: DetectedTableGroup) => {
    setFields((prev) => ({
      measurementFields: group.classification === 'grid' && group.measurementFields ? [...prev.measurementFields, ...group.measurementFields] : prev.measurementFields,
      logFields: group.classification === 'log' && group.logFields ? [...prev.logFields, ...group.logFields] : prev.logFields,
    }))
    setAcceptedTableIndexes((prev) => new Set(prev).add(group.sourceTableIndex))
  }

  const handleDiscardTable = (sourceTableIndex: number) => {
    setDiscardedTableIndexes((prev) => new Set(prev).add(sourceTableIndex))
  }

  const startOver = () => {
    setReview(null)
    setFields(emptyFields)
    setTableGroups([])
    setAcceptedTableIndexes(new Set())
    setDiscardedTableIndexes(new Set())
    setSubmitError(null)
  }

  const handleSubmit = async () => {
    if (!review) return
    const items = review.items.map((i) => i.trim()).filter(Boolean)
    if (!review.label.trim() || items.length === 0) {
      setSubmitError('A title and at least one checklist item are required.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await createChecklistTemplate({
        label: review.label.trim(),
        description: review.description.trim(),
        items,
        measurementFields: fields.measurementFields,
        logFields: fields.logFields,
      })
      refetch()
      navigate('/checklists/new')
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Could not create this checklist type. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (role !== 'supervisor') {
    return <Navigate to="/checklists/new" replace />
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

      <PageHeader
        title="Upload New Checklist Type"
        description="Upload the department's existing Word-doc checklist. Review the detected items and tables before it becomes a real checklist type — nothing is saved automatically."
      />

      {!review ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full border border-border-strong bg-surface-2 text-brand-strong">
              <FileUp className="size-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">Upload a .docx checklist document</p>
              <p className="mt-1 max-w-sm text-sm text-text-muted">
                Numbered items and tables will be detected automatically. You'll be able to review and edit everything before it's saved.
              </p>
            </div>
            <input ref={fileInputRef} type="file" accept=".docx" onChange={handleFileChange} className="hidden" aria-label="Upload .docx checklist" />
            <Button type="button" loading={parsing} onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" aria-hidden="true" />
              Choose File
            </Button>
            {parseError && (
              <p role="alert" className="text-sm font-medium text-critical">
                {parseError}
              </p>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <TemplateItemsEditor review={review} onChange={setReview} />

          <TableSuggestionsPanel
            tableGroups={tableGroups}
            acceptedTableIndexes={acceptedTableIndexes}
            discardedTableIndexes={discardedTableIndexes}
            onAccept={handleAcceptTable}
            onDiscard={handleDiscardTable}
          />

          <TemplateFieldsEditor fields={fields} onChange={setFields} />

          {submitError && (
            <p role="alert" className="text-sm font-medium text-critical">
              {submitError}
            </p>
          )}

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={startOver}>
              Start over
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              Create Checklist Type
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
