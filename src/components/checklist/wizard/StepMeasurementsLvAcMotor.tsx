import type { LvAcMotorDraft } from '../../../features/wizard/draftFactory'
import type { WindingResistanceRow } from '../../../types/checklist'
import { Card, CardBody, CardHeader } from '../../ui/Card'
import { NumberField } from '../../ui/NumberField'
import { NumericOrNACellInput } from '../../ui/NumericOrNACellInput'

interface StepMeasurementsLvAcMotorProps {
  draft: LvAcMotorDraft
  onChange: (patch: Partial<LvAcMotorDraft>) => void
}

export function StepMeasurementsLvAcMotor({ draft, onChange }: StepMeasurementsLvAcMotorProps) {
  const updateRow = (phase: WindingResistanceRow['phase'], patch: Partial<WindingResistanceRow>) => {
    onChange({
      windingResistance: draft.windingResistance.map((row) => (row.phase === phase ? { ...row, ...patch } : row)),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text">Winding Resistance &amp; Inductance</h2>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-text-faint">
                <th className="w-20 font-medium">Phase</th>
                <th className="font-medium">Resistance (Ω)</th>
                <th className="font-medium">Inductance (mH)</th>
              </tr>
            </thead>
            <tbody>
              {draft.windingResistance.map((row) => (
                <tr key={row.phase}>
                  <td className="py-1 font-mono font-semibold text-text">{row.phase}</td>
                  <td className="py-1 pr-2">
                    <NumericOrNACellInput
                      value={row.resistanceOhm}
                      onChange={(resistanceOhm) => updateRow(row.phase, { resistanceOhm })}
                      ariaLabel={`${row.phase} resistance in ohms`}
                    />
                  </td>
                  <td className="py-1">
                    <NumericOrNACellInput
                      value={row.inductanceMh}
                      onChange={(inductanceMh) => updateRow(row.phase, { inductanceMh })}
                      ariaLabel={`${row.phase} inductance in millihenries`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text">Space Heater Test</h2>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="Resistance"
            unit="Ω"
            value={draft.spaceHeaterResistanceOhm}
            onChange={(v) => onChange({ spaceHeaterResistanceOhm: v })}
          />
          <NumberField
            label="Insulation Resistance"
            unit="MΩ"
            value={draft.spaceHeaterInsulationMOhm}
            onChange={(v) => onChange({ spaceHeaterInsulationMOhm: v })}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text">Insulation &amp; Environment</h2>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberField
            label="Phase-to-Earth Insulation"
            unit="MΩ"
            value={draft.phaseToEarthInsulationMOhm}
            onChange={(v) => onChange({ phaseToEarthInsulationMOhm: v })}
          />
          <NumberField label="Ambient Temperature" unit="°C" value={draft.ambientTempC} onChange={(v) => onChange({ ambientTempC: v })} />
          <NumberField label="Humidity" unit="%" value={draft.humidityPercent} onChange={(v) => onChange({ humidityPercent: v })} />
        </CardBody>
      </Card>
    </div>
  )
}
