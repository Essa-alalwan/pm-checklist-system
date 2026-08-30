import { Plus, Trash2 } from 'lucide-react'
import type { GeneratorDraft } from '../../../features/wizard/draftFactory'
import type { BrushLengthRow } from '../../../types/checklist'
import type { NumericOrNA } from '../../../lib/numericOrNA'
import { Card, CardBody, CardHeader } from '../../ui/Card'
import { NumberField } from '../../ui/NumberField'
import { NumericOrNACellInput } from '../../ui/NumericOrNACellInput'
import { inputClasses } from '../../ui/Field'
import { generateId } from '../../../lib/id'

interface StepMeasurementsGeneratorProps {
  draft: GeneratorDraft
  onChange: (patch: Partial<GeneratorDraft>) => void
}

export function StepMeasurementsGenerator({ draft, onChange }: StepMeasurementsGeneratorProps) {
  const updateShaftBrush = (holderNumber: number, lengthMm: NumericOrNA | undefined) => {
    onChange({
      shaftGroundingBrushes: draft.shaftGroundingBrushes.map((b) => (b.holderNumber === holderNumber ? { ...b, lengthMm } : b)),
    })
  }

  const updateBrushRow = (id: string, patch: Partial<BrushLengthRow>) => {
    onChange({ brushLengths: draft.brushLengths.map((row) => (row.id === id ? { ...row, ...patch } : row)) })
  }

  const addBrushRow = () => {
    const nextHolder = draft.brushLengths.length > 0 ? Math.max(...draft.brushLengths.map((r) => r.holderNumber)) : 0
    const isNewHolder = draft.brushLengths.length % 2 === 0
    onChange({
      brushLengths: [
        ...draft.brushLengths,
        { id: generateId('brush'), holderNumber: isNewHolder ? nextHolder + 1 : nextHolder, side: isNewHolder ? 'DE' : 'NDE', lengthMm: undefined },
      ],
    })
  }

  const removeBrushRow = (id: string) => {
    onChange({ brushLengths: draft.brushLengths.filter((row) => row.id !== id) })
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text">Shaft Grounding Brush Lengths</h2>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {draft.shaftGroundingBrushes.map((brush) => (
            <NumberField
              key={brush.holderNumber}
              label={`Holder ${brush.holderNumber}`}
              unit="mm"
              value={brush.lengthMm}
              onChange={(v) => updateShaftBrush(brush.holderNumber, v)}
            />
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Carbon Brush Length Table</h2>
          <span className="text-xs text-text-faint">{draft.brushLengths.length} row{draft.brushLengths.length === 1 ? '' : 's'}</span>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          {draft.brushLengths.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-muted">No brush rows added yet.</p>
          ) : (
            <table className="w-full min-w-[420px] border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-text-faint">
                  <th className="w-24 font-medium">Holder #</th>
                  <th className="w-28 font-medium">Side</th>
                  <th className="font-medium">Length (mm)</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {draft.brushLengths.map((row) => (
                  <tr key={row.id}>
                    <td className="py-1 pr-2">
                      <input
                        type="number"
                        min={1}
                        className={`${inputClasses} min-h-10 font-mono tabular-nums`}
                        value={row.holderNumber}
                        onChange={(e) => updateBrushRow(row.id, { holderNumber: Number(e.target.value) || 1 })}
                        aria-label="Holder number"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <select
                        className={`${inputClasses} min-h-10`}
                        value={row.side}
                        onChange={(e) => updateBrushRow(row.id, { side: e.target.value })}
                        aria-label="Side"
                      >
                        <option value="DE">DE</option>
                        <option value="NDE">NDE</option>
                      </select>
                    </td>
                    <td className="py-1 pr-2">
                      <NumericOrNACellInput
                        value={row.lengthMm}
                        onChange={(lengthMm) => updateBrushRow(row.id, { lengthMm })}
                        ariaLabel="Length in millimeters"
                      />
                    </td>
                    <td className="py-1">
                      <button
                        type="button"
                        onClick={() => removeBrushRow(row.id)}
                        className="flex size-10 items-center justify-center rounded-lg text-text-faint hover:bg-critical/10 hover:text-critical"
                        aria-label="Remove row"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button
            type="button"
            onClick={addBrushRow}
            className="mt-3 flex min-h-10 items-center gap-1.5 rounded-lg border border-dashed border-border-strong px-3 text-sm font-medium text-text-muted hover:border-brand hover:text-brand-strong"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add row
          </button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text">Gas &amp; IPB Readings</h2>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <NumberField label="H₂ Pressure" unit="bar" value={draft.h2PressureBar} onChange={(v) => onChange({ h2PressureBar: v })} />
          <NumberField label="IPB Pressure" unit="bar" value={draft.ipbPressureBar} onChange={(v) => onChange({ ipbPressureBar: v })} />
          <NumberField label="IPB Temperature" unit="°C" value={draft.ipbTempC} onChange={(v) => onChange({ ipbTempC: v })} />
          <NumberField label="IPB Humidity" unit="%" value={draft.ipbHumidityPercent} onChange={(v) => onChange({ ipbHumidityPercent: v })} />
          <NumberField label="GT Running Hours" unit="hrs" value={draft.gtRunningHours} onChange={(v) => onChange({ gtRunningHours: v })} />
        </CardBody>
      </Card>
    </div>
  )
}
