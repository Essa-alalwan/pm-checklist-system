import { useId } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { inputClasses } from '../ui/Field'
import type { ChecklistTemplateLogFieldDef, ChecklistTemplateMeasurementFieldDef } from '../../types/checklist'

export interface TemplateFieldsState {
  measurementFields: Omit<ChecklistTemplateMeasurementFieldDef, 'id'>[]
  logFields: Omit<ChecklistTemplateLogFieldDef, 'id'>[]
}

interface TemplateFieldsEditorProps {
  fields: TemplateFieldsState
  onChange: (next: TemplateFieldsState) => void
}

// A measurement/log field's group, unpacked into independently-editable parts.
// `columns` carry the per-column metadata (label/unit/fieldType), `rows` are
// just row labels — a table group's fields are the plain cross-product of
// the two, so there's nothing else to store per-cell. Zero rows means a flat
// field list (matches the >1-distinct-rowLabel rule the app already renders
// by, in src/lib/measurementPivot.ts).
interface FieldColumnDraft {
  columnLabel: string
  unit: string
  fieldType: 'text' | 'number'
}
interface MeasurementGroupDraft {
  groupLabel: string
  rows: string[]
  columns: FieldColumnDraft[]
}
interface LogGroupDraft {
  groupLabel: string
  columns: FieldColumnDraft[]
}

function groupMeasurementDrafts(fields: Omit<ChecklistTemplateMeasurementFieldDef, 'id'>[]): MeasurementGroupDraft[] {
  const order: string[] = []
  const byGroup = new Map<string, Omit<ChecklistTemplateMeasurementFieldDef, 'id'>[]>()
  for (const f of fields) {
    const groupLabel = f.groupLabel ?? 'Measurements'
    if (!byGroup.has(groupLabel)) {
      byGroup.set(groupLabel, [])
      order.push(groupLabel)
    }
    byGroup.get(groupLabel)!.push(f)
  }
  return order.map((groupLabel) => {
    const groupFields = byGroup.get(groupLabel)!
    const rows: string[] = []
    for (const f of groupFields) {
      const row = f.rowLabel ?? ''
      if (row && !rows.includes(row)) rows.push(row)
    }
    const columns: FieldColumnDraft[] = []
    const seen = new Set<string>()
    for (const f of groupFields) {
      if (seen.has(f.columnLabel)) continue
      seen.add(f.columnLabel)
      columns.push({ columnLabel: f.columnLabel, unit: f.unit ?? '', fieldType: f.fieldType })
    }
    return { groupLabel, rows, columns }
  })
}

function flattenMeasurementDrafts(groups: MeasurementGroupDraft[]): Omit<ChecklistTemplateMeasurementFieldDef, 'id'>[] {
  const fields: Omit<ChecklistTemplateMeasurementFieldDef, 'id'>[] = []
  for (const g of groups) {
    const rows = g.rows.length > 0 ? g.rows : [undefined]
    for (const row of rows) {
      for (const col of g.columns) {
        fields.push({
          groupLabel: g.groupLabel,
          rowLabel: row,
          columnLabel: col.columnLabel,
          unit: col.unit || undefined,
          fieldType: col.fieldType,
        })
      }
    }
  }
  return fields
}

function groupLogDrafts(fields: Omit<ChecklistTemplateLogFieldDef, 'id'>[]): LogGroupDraft[] {
  const order: string[] = []
  const byGroup = new Map<string, Omit<ChecklistTemplateLogFieldDef, 'id'>[]>()
  for (const f of fields) {
    if (!byGroup.has(f.groupLabel)) {
      byGroup.set(f.groupLabel, [])
      order.push(f.groupLabel)
    }
    byGroup.get(f.groupLabel)!.push(f)
  }
  return order.map((groupLabel) => ({
    groupLabel,
    columns: byGroup.get(groupLabel)!.map((f) => ({ columnLabel: f.columnLabel, unit: f.unit ?? '', fieldType: f.fieldType })),
  }))
}

function flattenLogDrafts(groups: LogGroupDraft[]): Omit<ChecklistTemplateLogFieldDef, 'id'>[] {
  const fields: Omit<ChecklistTemplateLogFieldDef, 'id'>[] = []
  for (const g of groups) {
    for (const col of g.columns) {
      fields.push({ groupLabel: g.groupLabel, columnLabel: col.columnLabel, unit: col.unit || undefined, fieldType: col.fieldType })
    }
  }
  return fields
}

function emptyColumn(): FieldColumnDraft {
  return { columnLabel: '', unit: '', fieldType: 'number' }
}

function ColumnRow({
  column,
  onChange,
  onRemove,
}: {
  column: FieldColumnDraft
  onChange: (next: FieldColumnDraft) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        className={`${inputClasses} flex-1`}
        placeholder="Column label"
        value={column.columnLabel}
        onChange={(e) => onChange({ ...column, columnLabel: e.target.value })}
      />
      <input
        className={`${inputClasses} w-24 shrink-0`}
        placeholder="Unit"
        value={column.unit}
        onChange={(e) => onChange({ ...column, unit: e.target.value })}
      />
      <select
        className={`${inputClasses} w-28 shrink-0`}
        value={column.fieldType}
        onChange={(e) => onChange({ ...column, fieldType: e.target.value as 'text' | 'number' })}
      >
        <option value="number">Number</option>
        <option value="text">Text</option>
      </select>
      <button
        type="button"
        onClick={onRemove}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-faint hover:bg-critical/10 hover:text-critical"
        aria-label="Remove column"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-9 items-center gap-1.5 self-start rounded-lg border border-dashed border-border-strong px-3 text-sm font-medium text-text-muted hover:border-brand hover:text-brand-strong"
    >
      <Plus className="size-4" aria-hidden="true" />
      {label}
    </button>
  )
}

function MeasurementGroupCard({
  group,
  onChange,
  onRemove,
}: {
  group: MeasurementGroupDraft
  onChange: (next: MeasurementGroupDraft) => void
  onRemove: () => void
}) {
  const labelId = useId()

  const updateColumn = (index: number, next: FieldColumnDraft) => {
    onChange({ ...group, columns: group.columns.map((c, i) => (i === index ? next : c)) })
  }
  const removeColumn = (index: number) => {
    onChange({ ...group, columns: group.columns.filter((_, i) => i !== index) })
  }
  const addColumn = () => onChange({ ...group, columns: [...group.columns, emptyColumn()] })

  const updateRow = (index: number, label: string) => {
    onChange({ ...group, rows: group.rows.map((r, i) => (i === index ? label : r)) })
  }
  const removeRow = (index: number) => onChange({ ...group, rows: group.rows.filter((_, i) => i !== index) })
  const addRow = () => onChange({ ...group, rows: [...group.rows, `Row ${group.rows.length + 1}`] })

  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <label htmlFor={labelId} className="sr-only">
          Group label
        </label>
        <input
          id={labelId}
          className={`${inputClasses} flex-1 font-semibold`}
          value={group.groupLabel}
          onChange={(e) => onChange({ ...group, groupLabel: e.target.value })}
          placeholder="Group label"
        />
        <button
          type="button"
          onClick={onRemove}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-faint hover:bg-critical/10 hover:text-critical"
          aria-label="Remove group"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-text-faint">
            Columns {group.rows.length > 0 ? '(applies to every row below)' : ''}
          </span>
          {group.columns.map((col, i) => (
            <ColumnRow key={i} column={col} onChange={(next) => updateColumn(i, next)} onRemove={() => removeColumn(i)} />
          ))}
          <AddButton label="Add column" onClick={addColumn} />
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <span className="text-xs font-medium text-text-faint">
            {group.rows.length > 0 ? 'Rows (this group renders as a table)' : 'No rows — renders as a flat field list. Add a row to make it a table.'}
          </span>
          {group.rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className={`${inputClasses} flex-1`} placeholder="Row label" value={row} onChange={(e) => updateRow(i, e.target.value)} />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-faint hover:bg-critical/10 hover:text-critical"
                aria-label="Remove row"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          <AddButton label="Add row" onClick={addRow} />
        </div>
      </CardBody>
    </Card>
  )
}

function LogGroupCard({ group, onChange, onRemove }: { group: LogGroupDraft; onChange: (next: LogGroupDraft) => void; onRemove: () => void }) {
  const labelId = useId()

  const updateColumn = (index: number, next: FieldColumnDraft) => {
    onChange({ ...group, columns: group.columns.map((c, i) => (i === index ? next : c)) })
  }
  const removeColumn = (index: number) => {
    onChange({ ...group, columns: group.columns.filter((_, i) => i !== index) })
  }
  const addColumn = () => onChange({ ...group, columns: [...group.columns, emptyColumn()] })

  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <label htmlFor={labelId} className="sr-only">
          Log name
        </label>
        <input
          id={labelId}
          className={`${inputClasses} flex-1 font-semibold`}
          value={group.groupLabel}
          onChange={(e) => onChange({ ...group, groupLabel: e.target.value })}
          placeholder="Log name"
        />
        <button
          type="button"
          onClick={onRemove}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-faint hover:bg-critical/10 hover:text-critical"
          aria-label="Remove log"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </CardHeader>
      <CardBody className="flex flex-col gap-2">
        <span className="text-xs text-text-faint">
          Columns — the technician adds as many rows as needed at record time, so only the columns are defined here.
        </span>
        {group.columns.map((col, i) => (
          <ColumnRow key={i} column={col} onChange={(next) => updateColumn(i, next)} onRemove={() => removeColumn(i)} />
        ))}
        <AddButton label="Add column" onClick={addColumn} />
      </CardBody>
    </Card>
  )
}

export function TemplateFieldsEditor({ fields, onChange }: TemplateFieldsEditorProps) {
  const measurementGroups = groupMeasurementDrafts(fields.measurementFields)
  const logGroups = groupLogDrafts(fields.logFields)

  const updateMeasurementGroups = (next: MeasurementGroupDraft[]) => {
    onChange({ ...fields, measurementFields: flattenMeasurementDrafts(next) })
  }
  const updateLogGroups = (next: LogGroupDraft[]) => {
    onChange({ ...fields, logFields: flattenLogDrafts(next) })
  }

  const addMeasurementGroup = () => {
    updateMeasurementGroups([...measurementGroups, { groupLabel: 'New Group', rows: [], columns: [emptyColumn()] }])
  }
  const addLogGroup = () => {
    updateLogGroups([...logGroups, { groupLabel: 'New Log', columns: [emptyColumn()] }])
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Measurement Fields</h2>
          <span className="text-xs text-text-faint">Fixed readings — every row/column combination is fillable on every record.</span>
        </div>
        {measurementGroups.map((group, i) => (
          <MeasurementGroupCard
            key={i}
            group={group}
            onChange={(next) => updateMeasurementGroups(measurementGroups.map((g, gi) => (gi === i ? next : g)))}
            onRemove={() => updateMeasurementGroups(measurementGroups.filter((_, gi) => gi !== i))}
          />
        ))}
        <AddButton label="Add measurement group" onClick={addMeasurementGroup} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Log Tables</h2>
          <span className="text-xs text-text-faint">Open-ended registers — the technician adds rows freely at record time.</span>
        </div>
        {logGroups.map((group, i) => (
          <LogGroupCard
            key={i}
            group={group}
            onChange={(next) => updateLogGroups(logGroups.map((g, gi) => (gi === i ? next : g)))}
            onRemove={() => updateLogGroups(logGroups.filter((_, gi) => gi !== i))}
          />
        ))}
        <AddButton label="Add log table" onClick={addLogGroup} />
      </div>
    </div>
  )
}
