import { useId, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CircleGauge, ClipboardList, FileUp, Pencil, Search, SearchX, Trash2, Zap } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardBody } from '../components/ui/Card'
import { SkeletonCard } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { inputClasses } from '../components/ui/Field'
import { useTemplates } from '../context/TemplatesContext'
import { useSession } from '../context/SessionContext'
import { deleteChecklistTemplate } from '../data/templatesApi'
import { ApiError } from '../data/apiClient'
import { BUILT_IN_CHECKLIST_TYPES, type ChecklistType } from '../types/checklist'

const ICONS: Partial<Record<ChecklistType, typeof CircleGauge>> = { 'lv-ac-motor': CircleGauge, generator: Zap }

function isBuiltIn(type: string): boolean {
  return (BUILT_IN_CHECKLIST_TYPES as readonly string[]).includes(type)
}

export default function NewChecklistTypePage() {
  const { templates, loading, error, refetch } = useTemplates()
  const { role } = useSession()
  const navigate = useNavigate()
  const searchId = useId()
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; label: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return templates
    return templates.filter((t) => t.label.toLowerCase().includes(term) || t.description.toLowerCase().includes(term))
  }, [templates, search])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteChecklistTemplate(deleteTarget.type)
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Could not delete this checklist type. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader title="New Checklist" description="Choose the equipment type to start a preventive maintenance checklist." />

      {!loading && !error && templates.length > 0 && (
        <label htmlFor={searchId} className="mb-4 block">
          <span className="sr-only">Search checklist types</span>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" aria-hidden="true" />
            <input
              id={searchId}
              className={`${inputClasses} pl-9`}
              placeholder="Search checklist types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </label>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : search.trim() && filteredTemplates.length === 0 ? (
        <EmptyState icon={SearchX} title="No matching checklist types" description="Try a different search term." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredTemplates.map((template) => {
            const Icon = ICONS[template.type] ?? ClipboardList
            const canManage = role === 'supervisor' && !isBuiltIn(template.type)
            return (
              <Link key={template.type} to={`/checklists/new/${template.type}`} className="group relative block">
                <Card className="h-full transition-colors group-hover:border-brand/50 group-hover:bg-surface-2 group-focus-visible:border-brand">
                  <CardBody className="flex h-full flex-col gap-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex size-12 items-center justify-center rounded-lg border border-border-strong bg-surface-2 text-brand-strong">
                        <Icon className="size-6" aria-hidden="true" />
                      </div>
                      {canManage && (
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              navigate(`/checklists/types/${template.type}/edit`)
                            }}
                            className="flex size-8 items-center justify-center rounded-lg text-text-faint hover:bg-surface-3 hover:text-text"
                            aria-label={`Edit ${template.label}`}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setDeleteError(null)
                              setDeleteTarget({ type: template.type, label: template.label })
                            }}
                            className="flex size-8 items-center justify-center rounded-lg text-text-faint hover:bg-critical/10 hover:text-critical"
                            aria-label={`Delete ${template.label}`}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-semibold text-text">{template.label}</h2>
                      <p className="mt-1 text-sm text-text-muted">{template.description}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-faint">{template.items.length} checklist items</span>
                      <span className="flex items-center gap-1 font-medium text-brand-strong">
                        Start
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            )
          })}

          {role === 'supervisor' && !search.trim() && (
            <Link to="/checklists/new/upload" className="group block">
              <Card className="h-full border-dashed transition-colors group-hover:border-brand/50 group-hover:bg-surface-2 group-focus-visible:border-brand">
                <CardBody className="flex h-full flex-col gap-4">
                  <div className="flex size-12 items-center justify-center rounded-lg border border-border-strong bg-surface-2 text-text-muted">
                    <FileUp className="size-6" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-text">Upload New Checklist Type</h2>
                    <p className="mt-1 text-sm text-text-muted">Upload a Word-doc checklist and turn it into a new checklist type for the department.</p>
                  </div>
                  <div className="flex items-center justify-end text-sm">
                    <span className="flex items-center gap-1 font-medium text-brand-strong">
                      Upload
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          )}
        </div>
      )}

      {deleteError && (
        <p role="alert" className="mt-4 text-sm font-medium text-critical">
          {deleteError}
        </p>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.label}"?`}
        description="This permanently removes the checklist type. This is only possible while it has no submitted records."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
