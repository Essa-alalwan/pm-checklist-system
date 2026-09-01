import { Plus, Trash2 } from 'lucide-react'
import type { ChecklistTemplateLogFieldDef, LogRowValue, NumericOrNA } from '../../../types/checklist'
import { inputClasses } from '../../ui/Field'
import { NumericOrNACellInput } from '../../ui/NumericOrNACellInput'

interface LogTableEditorProps {
  groupLabel: string
  fields: ChecklistTemplateLogFieldDef[]
  rows: LogRowValue[]
  onChange: (rows: LogRowValue[]) => void
}

export function LogTableEditor({ groupLabel, fields, rows, onChange }: LogTableEditorProps) {
  const updateCell = (rowIndex: number, fieldId: string, value: string | NumericOrNA | undefined) => {
    onChange(rows.map((row, i) => (i === rowIndex ? { ...row, [fieldId]: value } : row)))
  }

  const addRow = () => onChange([...rows, {}])
  const removeRow = (rowIndex: number) => onChange(rows.filter((_, i) => i !== rowIndex))

  return (
    <div className="flex flex-col gap-2">
      {rows.length === 0 ? (
        <p className="text-sm text-text-muted">No entries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-text-faint">
                {fields.map((f) => (
                  <th key={f.id} className="min-w-[9rem] font-medium">
                    {f.columnLabel}
                    {f.unit ? <span className="ml-1 normal-case text-text-faint">({f.unit})</span> : null}
                  </th>
                ))}
                <th className="w-9"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {fields.map((f) => (
                    <td key={f.id} className="py-1 pr-2">
                      {f.fieldType === 'number' ? (
                        <NumericOrNACellInput
                          value={row[f.id] as NumericOrNA | undefined}
                          onChange={(v) => updateCell(rowIndex, f.id, v)}
                          ariaLabel={`Row ${rowIndex + 1} ${f.columnLabel}`}
                        />
                      ) : (
                        <input
                          type="text"
                          className={`${inputClasses} min-h-10`}
                          value={(row[f.id] as string | undefined) ?? ''}
                          onChange={(e) => updateCell(rowIndex, f.id, e.target.value)}
                          aria-label={`Row ${rowIndex + 1} ${f.columnLabel}`}
                        />
                      )}
                    </td>
                  ))}
                  <td className="py-1">
                    <button
                      type="button"
                      onClick={() => removeRow(rowIndex)}
                      className="flex size-9 items-center justify-center rounded-lg text-text-faint hover:bg-critical/10 hover:text-critical"
                      aria-label={`Remove row ${rowIndex + 1}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button
        type="button"
        onClick={addRow}
        className="mt-1 flex min-h-10 items-center gap-1.5 self-start rounded-lg border border-dashed border-border-strong px-3 text-sm font-medium text-text-muted hover:border-brand hover:text-brand-strong"
        aria-label={`Add row to ${groupLabel}`}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add row
      </button>
    </div>
  )
}
