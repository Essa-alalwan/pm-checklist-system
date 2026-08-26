import type { ChecklistTemplate } from '../../types/checklist'

export const lvAcMotorTemplate: ChecklistTemplate = {
  type: 'lv-ac-motor',
  label: 'LV AC Motor PM Checklist',
  shortLabel: 'LV AC Motor',
  description: 'Low-voltage AC motor preventive maintenance inspection, winding tests, and insulation readings.',
  items: [
    { id: 'visual-inspection', label: 'Visual inspection for physical damage, corrosion, and cleanliness' },
    { id: 'foundation-bolts', label: 'Foundation bolts and mounting tightness' },
    { id: 'coupling-alignment', label: 'Coupling / belt alignment and guard condition' },
    { id: 'terminal-box', label: 'Terminal box condition and cable gland integrity' },
    { id: 'terminal-connections', label: 'Terminal connections tightness (torque check)' },
    { id: 'cooling-fan', label: 'Cooling fan and fan cover condition' },
    { id: 'bearing-condition', label: 'Bearing condition, noise, and vibration check' },
    { id: 'lubrication', label: 'Lubrication / grease condition and quantity' },
    { id: 'earthing', label: 'Earthing connection condition and continuity' },
    { id: 'space-heater-operation', label: 'Space heater operation check' },
    { id: 'nameplate', label: 'Motor nameplate and data legibility' },
    { id: 'housekeeping', label: 'General housekeeping around motor and baseplate' },
  ],
}
