import { Router } from 'express'
import { prisma } from '../db'
import type { ChecklistTemplateDef, ChecklistType } from '../types/checklist'

export const templatesRouter = Router()

templatesRouter.get('/', async (_req, res) => {
  const templates = await prisma.checklistTemplate.findMany({
    include: { items: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })

  const result: ChecklistTemplateDef[] = templates.map((t) => ({
    type: t.type as ChecklistType,
    label: t.label,
    shortLabel: t.shortLabel,
    description: t.description,
    items: t.items.map((i) => ({ id: i.itemKey, label: i.label })),
  }))

  res.json(result)
})
