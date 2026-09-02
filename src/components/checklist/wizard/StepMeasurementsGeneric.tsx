import { useId } from 'react'
import type { ChecklistTemplateLogFieldDef, ChecklistTemplateMeasurementFieldDef, LogRowValue, NumericOrNA } from '../../../types/checklist'
import { groupMeasurementFields, tableCellKey } from '../../../lib/measurementPivot'
import { Card, CardBody, CardHeader } from '../../ui/Card'
import { NumberField } from '../../ui/NumberField'
import { NumericOrNACellInput } from '../../ui/NumericOrNACellInput'
import { inputClasses } from '../../ui/Field'
import { LogTableEditor } from './LogTableEditor'

interface StepMeasurementsGenericProps {
  measurementFields: ChecklistTemplateMeasurementFieldDef[]
  measurements: LogRowValue
  onChange: (measurements: LogRowValue) => void
  logFields?: ChecklistTemplateLogFieldDef[]
  logs?: Record<string, LogRowValue[]>
  onLogsChange?: (logs: Record<string, LogRowValue[]>) => void
}

function TextField({ label, value, onChange }: { label: string; value: string | undefined; onChange: (value: string) => void }) {
  const id = useId()
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <input id={id} type="text" className={inputClasses} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export function StepMeasurementsGeneric({
  measurementFields,
  measurements = {},
  onChange,
  logFields = [],
  logs = {},
  onLogsChange,
}: StepMeasurementsGenericProps) {
  const setField = (fieldId: string, value: string | NumericOrNA | undefined) => {
    onChange({ ...measurements, [fieldId]: value })
  }

  const logGroups = new Map<string, ChecklistTemplateLogFieldDef[]>()
  for (const f of logFields) {
    if (!logGroups.has(f.groupLabel)) logGroups.set(f.groupLabel, [])
    logGroups.get(f.groupLabel)!.push(f)
  }

  return (
    <div className="flex flex-col gap-4">
      {groupMeasurementFields(measurementFields).map((group) => (
        <Card key={group.groupLabel}>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">{group.groupLabel}</h2>
          </CardHeader>
          <CardBody>
            {group.kind === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-text-faint">
                      <th className="sticky left-0 z-10 min-w-[9rem] bg-surface font-medium"></th>
                      {group.columns.map((col) => (
                        <th key={col} className="font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={row}>
                        <td className="sticky left-0 z-10 bg-surface py-1 pr-2 font-mono font-semibold text-text">{row}</td>
                        {group.columns.map((col) => {
                          const field = group.cellsByKey.get(tableCellKey(row, col))
                          return (
                            <td key={col} className="py-1 pr-2">
                              {field ? (
                                field.fieldType === 'text' ? (
                                  <input
                                    type="text"
                                    className={`${inputClasses} min-h-10`}
                                    value={(measurements[field.id] as string | undefined) ?? ''}
                                    onChange={(e) => setField(field.id, e.target.value)}
                                    aria-label={`${row} ${col}`}
                                  />
                                ) : (
                                  <NumericOrNACellInput
                                    value={measurements[field.id] as NumericOrNA | undefined}
                                    onChange={(v) => setField(field.id, v)}
                                    ariaLabel={`${row} ${col}${field.unit ? ` in ${field.unit}` : ''}`}
                                  />
                                )
                              ) : null}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {group.fields.map((field) =>
                  field.fieldType === 'text' ? (
                    <TextField
                      key={field.id}
                      label={field.columnLabel}
                      value={measurements[field.id] as string | undefined}
                      onChange={(v) => setField(field.id, v)}
                    />
                  ) : (
                    <NumberField
                      key={field.id}
                      label={field.columnLabel}
                      unit={field.unit}
                      value={measurements[field.id] as NumericOrNA | undefined}
                      onChange={(v) => setField(field.id, v)}
                    />
                  ),
                )}
              </div>
            )}
          </CardBody>
        </Card>
      ))}

      {[...logGroups.entries()].map(([groupLabel, fields]) => (
        <Card key={groupLabel}>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">{groupLabel}</h2>
          </CardHeader>
          <CardBody>
            <LogTableEditor
              groupLabel={groupLabel}
              fields={fields}
              rows={logs[groupLabel] ?? []}
              onChange={(rows) => onLogsChange?.({ ...logs, [groupLabel]: rows })}
            />
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
