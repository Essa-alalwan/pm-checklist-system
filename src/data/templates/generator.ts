import type { ChecklistTemplate } from '../../types/checklist'

export const generatorTemplate: ChecklistTemplate = {
  type: 'generator',
  label: 'Generator PM Checklist',
  shortLabel: 'Generator',
  description: 'Generator preventive maintenance inspection, brush and slip ring condition, and gas/IPB readings.',
  items: [
    { id: 'visual-inspection', label: 'Visual inspection for physical damage, corrosion, and cleanliness' },
    { id: 'carbon-brush-condition', label: 'Carbon brush condition and free movement in holders' },
    { id: 'slip-ring-condition', label: 'Slip ring surface condition and wear pattern' },
    { id: 'shaft-grounding-brush', label: 'Shaft grounding brush condition and contact' },
    { id: 'bearing-condition', label: 'Bearing condition, noise, and vibration check' },
    { id: 'terminal-box', label: 'Terminal box and cable connection condition' },
    { id: 'cooling-system', label: 'Cooling system (H2 / air) condition and leak check' },
    { id: 'protection-indication', label: 'Instrumentation and protection relay indication check' },
    { id: 'housekeeping', label: 'General housekeeping around generator and enclosure' },
  ],
}
