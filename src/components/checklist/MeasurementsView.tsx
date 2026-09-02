import type { ChecklistTemplateLogFieldDef, ChecklistTemplateMeasurementFieldDef, GeneratorChecklist, LogRowValue, LvAcMotorChecklist, NumericOrNA } from '../../types/checklist'
import { groupMeasurementFields, tableCellKey } from '../../lib/measurementPivot'

type LvSource = { type: 'lv-ac-motor' } & Pick<
  LvAcMotorChecklist,
  'windingResistance' | 'spaceHeaterResistanceOhm' | 'spaceHeaterInsulationMOhm' | 'phaseToEarthInsulationMOhm' | 'ambientTempC' | 'humidityPercent'
>

type GenSource = { type: 'generator' } & Pick<
  GeneratorChecklist,
  'shaftGroundingBrushes' | 'brushLengths' | 'h2PressureBar' | 'ipbPressureBar' | 'ipbTempC' | 'ipbHumidityPercent' | 'gtRunningHours'
>

type GenericSource = { type: string; measurements?: LogRowValue; logs?: Record<string, LogRowValue[]> }

function ReadingTile({ label, value, unit }: { label: string; value: NumericOrNA | undefined; unit: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-text">
        {value === undefined ? (
          <span className="text-text-faint">—</span>
        ) : value === 'N/A' ? (
          <span className="text-text-faint">N/A</span>
        ) : (
          <>
            {value}
            <span className="ml-1 text-xs font-normal text-text-faint">{unit}</span>
          </>
        )}
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

function GenericLogTable({ groupLabel, fields, rows }: { groupLabel: string; fields: ChecklistTemplateLogFieldDef[]; rows: LogRowValue[] }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-faint">{groupLabel}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-text-muted">No entries recorded.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-text-faint">
                {fields.map((f) => (
                  <th key={f.id} className="pb-2 font-medium">
                    {f.columnLabel}
                    {f.unit ? <span className="ml-1 normal-case text-text-faint">({f.unit})</span> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-text">
              {rows.map((row, index) => (
                <tr key={index} className="border-t border-border">
                  {fields.map((f) => (
                    <td key={f.id} className={f.fieldType === 'number' ? 'py-2 font-mono tabular-nums' : 'py-2'}>
                      {row[f.id] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function GenericMeasurements({
  measurements,
  measurementFields,
  logFields,
  logs,
}: {
  measurements: LogRowValue
  measurementFields: ChecklistTemplateMeasurementFieldDef[]
  logFields: ChecklistTemplateLogFieldDef[]
  logs: Record<string, LogRowValue[]>
}) {
  const logGroups = new Map<string, ChecklistTemplateLogFieldDef[]>()
  for (const f of logFields) {
    if (!logGroups.has(f.groupLabel)) logGroups.set(f.groupLabel, [])
    logGroups.get(f.groupLabel)!.push(f)
  }

  return (
    <div className="flex flex-col gap-5">
      {groupMeasurementFields(measurementFields).map((group) => (
        <div key={group.groupLabel}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-faint">{group.groupLabel}</h3>
          {group.kind === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-text-faint">
                    <th className="sticky left-0 z-10 bg-surface pb-2 font-medium"></th>
                    {group.columns.map((col) => (
                      <th key={col} className="pb-2 font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-mono text-text tabular-nums">
                  {group.rows.map((row) => (
                    <tr key={row}>
                      <td className="sticky left-0 z-10 border-t border-border bg-surface py-2 font-semibold">{row}</td>
                      {group.columns.map((col) => {
                        const field = group.cellsByKey.get(tableCellKey(row, col))
                        return (
                          <td key={col} className="border-t border-border py-2">
                            {field ? (measurements[field.id] ?? '—') : ''}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {group.fields.map((field) =>
                field.fieldType === 'text' ? (
                  <div key={field.id} className="rounded-lg border border-border bg-surface-2 px-3 py-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">{field.columnLabel}</p>
                    <p className="mt-0.5 text-sm font-semibold text-text">{(measurements[field.id] as string | undefined) || <span className="text-text-faint">—</span>}</p>
                  </div>
                ) : (
                  <ReadingTile key={field.id} label={field.columnLabel} value={measurements[field.id] as NumericOrNA | undefined} unit={field.unit ?? ''} />
                ),
              )}
            </div>
          )}
        </div>
      ))}

      {[...logGroups.entries()].map(([groupLabel, fields]) => (
        <GenericLogTable key={groupLabel} groupLabel={groupLabel} fields={fields} rows={logs[groupLabel] ?? []} />
      ))}
    </div>
  )
}

export function MeasurementsView({
  source,
  measurementFields = [],
  logFields = [],
}: {
  source: LvSource | GenSource | GenericSource
  measurementFields?: ChecklistTemplateMeasurementFieldDef[]
  logFields?: ChecklistTemplateLogFieldDef[]
}) {
  if (source.type === 'lv-ac-motor') return <LvAcMotorMeasurements source={source as LvSource} />
  if (source.type === 'generator') return <GeneratorMeasurements source={source as GenSource} />
  if (measurementFields.length === 0 && logFields.length === 0) return null
  const generic = source as GenericSource
  return (
    <GenericMeasurements
      measurements={generic.measurements ?? {}}
      measurementFields={measurementFields}
      logFields={logFields}
      logs={generic.logs ?? {}}
    />
  )
}
