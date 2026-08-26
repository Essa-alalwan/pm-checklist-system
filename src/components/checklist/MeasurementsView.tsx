import type { GeneratorChecklist, LvAcMotorChecklist } from '../../types/checklist'

type LvSource = { type: 'lv-ac-motor' } & Pick<
  LvAcMotorChecklist,
  'windingResistance' | 'spaceHeaterResistanceOhm' | 'spaceHeaterInsulationMOhm' | 'phaseToEarthInsulationMOhm' | 'ambientTempC' | 'humidityPercent'
>

type GenSource = { type: 'generator' } & Pick<
  GeneratorChecklist,
  'shaftGroundingBrushes' | 'brushLengths' | 'h2PressureBar' | 'ipbPressureBar' | 'ipbTempC' | 'ipbHumidityPercent' | 'gtRunningHours'
>

function ReadingTile({ label, value, unit }: { label: string; value: number | undefined; unit: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-text">
        {value !== undefined ? value : <span className="text-text-faint">—</span>}
        {value !== undefined && <span className="ml-1 text-xs font-normal text-text-faint">{unit}</span>}
      </p>
    </div>
  )
}

function LvAcMotorMeasurements({ source }: { source: LvSource }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-faint">Winding Resistance &amp; Inductance</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-text-faint">
                <th className="pb-2 font-medium">Phase</th>
                <th className="pb-2 font-medium">Resistance (Ω)</th>
                <th className="pb-2 font-medium">Inductance (mH)</th>
              </tr>
            </thead>
            <tbody className="font-mono text-text tabular-nums">
              {source.windingResistance.map((row) => (
                <tr key={row.phase} className="border-t border-border">
                  <td className="py-2 font-semibold">{row.phase}</td>
                  <td className="py-2">{row.resistanceOhm ?? '—'}</td>
                  <td className="py-2">{row.inductanceMh ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <ReadingTile label="Heater Resistance" value={source.spaceHeaterResistanceOhm} unit="Ω" />
        <ReadingTile label="Heater Insulation" value={source.spaceHeaterInsulationMOhm} unit="MΩ" />
        <ReadingTile label="Phase-Earth Insulation" value={source.phaseToEarthInsulationMOhm} unit="MΩ" />
        <ReadingTile label="Ambient Temp" value={source.ambientTempC} unit="°C" />
        <ReadingTile label="Humidity" value={source.humidityPercent} unit="%" />
      </div>
    </div>
  )
}

function GeneratorMeasurements({ source }: { source: GenSource }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-faint">Shaft Grounding Brush Lengths</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {source.shaftGroundingBrushes.map((b) => (
            <ReadingTile key={b.holderNumber} label={`Holder ${b.holderNumber}`} value={b.lengthMm} unit="mm" />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-faint">
          Carbon Brush Length Table
          <span className="ml-1.5 normal-case text-text-faint">({source.brushLengths.length} rows)</span>
        </h3>
        {source.brushLengths.length === 0 ? (
          <p className="text-sm text-text-muted">No brush rows recorded.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[320px] text-sm">
              <thead className="sticky top-0 bg-surface-2">
                <tr className="text-left text-xs font-medium text-text-faint">
                  <th className="px-3 py-2 font-medium">Holder #</th>
                  <th className="px-3 py-2 font-medium">Side</th>
                  <th className="px-3 py-2 font-medium">Length (mm)</th>
                </tr>
              </thead>
              <tbody className="font-mono text-text tabular-nums">
                {source.brushLengths.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-3 py-1.5">{row.holderNumber}</td>
                    <td className="px-3 py-1.5">{row.side}</td>
                    <td className="px-3 py-1.5">{row.lengthMm ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <ReadingTile label="H₂ Pressure" value={source.h2PressureBar} unit="bar" />
        <ReadingTile label="IPB Pressure" value={source.ipbPressureBar} unit="bar" />
        <ReadingTile label="IPB Temp" value={source.ipbTempC} unit="°C" />
        <ReadingTile label="IPB Humidity" value={source.ipbHumidityPercent} unit="%" />
        <ReadingTile label="GT Running Hours" value={source.gtRunningHours} unit="hrs" />
      </div>
    </div>
  )
}

export function MeasurementsView({ source }: { source: LvSource | GenSource }) {
  if (source.type === 'lv-ac-motor') return <LvAcMotorMeasurements source={source} />
  return <GeneratorMeasurements source={source} />
}
