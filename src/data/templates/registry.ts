import type { ChecklistTemplate, ChecklistType } from '../../types/checklist'
import { generatorTemplate } from './generator'
import { lvAcMotorTemplate } from './lvAcMotor'

export const checklistTemplates: ChecklistTemplate[] = [lvAcMotorTemplate, generatorTemplate]

export const templateRegistry: Record<ChecklistType, ChecklistTemplate> = {
  'lv-ac-motor': lvAcMotorTemplate,
  generator: generatorTemplate,
}

export function getTemplate(type: ChecklistType): ChecklistTemplate {
  return templateRegistry[type]
}
