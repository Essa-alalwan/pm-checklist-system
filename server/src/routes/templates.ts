import { Router } from 'express'
import multer from 'multer'
import { prisma } from '../db'
import { requireAuth, requireRole } from '../middleware/requireAuth'
import { parseChecklistDocx } from '../parsing/parseChecklistDocx'
import { BUILT_IN_CHECKLIST_TYPES, type ChecklistTemplateDef, type ChecklistType } from '../types/checklist'
import { createTemplateSchema, parsedChecklistSchema, updateTemplateSchema } from '../schemas/templateFields'

export const templatesRouter = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isDocx =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.originalname.toLowerCase().endsWith('.docx')
    // Reject silently (no error) rather than throwing — the route handler
    // reports a clean 400 when req.file ends up unset, instead of this
    // bubbling to the generic 500 error middleware.
    cb(null, isDocx)
  },
})

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-+|-+$)/g, '') || 'checklist'
  )
}

async function uniqueTemplateType(base: string): Promise<string> {
  let candidate = base
  let suffix = 2
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.checklistTemplate.findUnique({ where: { type: candidate } })
    if (!existing) return candidate
    candidate = `${base}-${suffix}`
    suffix += 1
  }
}

const templateInclude = {
  items: { orderBy: { sortOrder: 'asc' as const } },
  measurementFields: { orderBy: { sortOrder: 'asc' as const } },
  logFields: { orderBy: { sortOrder: 'asc' as const } },
}

function toTemplateDef(t: {
  type: string
  label: string
  shortLabel: string
  description: string
  items: { itemKey: string; label: string }[]
  measurementFields: { id: string; groupLabel: string | null; rowLabel: string | null; columnLabel: string; unit: string | null; fieldType: string }[]
  logFields: { id: string; groupLabel: string; columnLabel: string; fieldType: string; unit: string | null }[]
}): ChecklistTemplateDef {
  return {
    type: t.type as ChecklistType,
    label: t.label,
    shortLabel: t.shortLabel,
    description: t.description,
    items: t.items.map((i) => ({ id: i.itemKey, label: i.label })),
    measurementFields: t.measurementFields.map((f) => ({
      id: f.id,
      groupLabel: f.groupLabel ?? undefined,
      rowLabel: f.rowLabel ?? undefined,
      columnLabel: f.columnLabel,
      unit: f.unit ?? undefined,
      fieldType: f.fieldType as 'text' | 'number',
    })),
    logFields: t.logFields.map((f) => ({
      id: f.id,
      groupLabel: f.groupLabel,
      columnLabel: f.columnLabel,
      fieldType: f.fieldType as 'text' | 'number',
      unit: f.unit ?? undefined,
    })),
  }
}

templatesRouter.get('/', async (_req, res) => {
  const templates = await prisma.checklistTemplate.findMany({
    include: templateInclude,
    orderBy: { createdAt: 'asc' },
  })

  res.json(templates.map(toTemplateDef))
})

templatesRouter.post('/parse-docx', requireAuth, requireRole('supervisor'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded, or the file is not a .docx document.' })
    return
  }

  try {
    const parsed = await parseChecklistDocx(req.file.buffer, req.file.originalname)
    if (parsed.items.length === 0) {
      res.status(422).json({ error: "Could not find any numbered checklist items in this document. You can still add items manually." })
      return
    }
    const validated = parsedChecklistSchema.safeParse(parsed)
    if (!validated.success) {
      res.status(422).json({ error: 'This document parsed into an unexpected shape. Please add items/fields manually.' })
      return
    }
    res.json(validated.data)
  } catch {
    res.status(422).json({ error: 'Could not read this document. Make sure it is a valid .docx file.' })
  }
})

templatesRouter.post('/', requireAuth, requireRole('supervisor'), async (req, res) => {
  const parsed = createTemplateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'A label and at least one item are required.' })
    return
  }
  const { label, description, items, measurementFields, logFields } = parsed.data

  const type = await uniqueTemplateType(slugify(label))
  const shortLabel = label.length <= 24 ? label : label.split(' ').slice(0, 3).join(' ')

  const template = await prisma.checklistTemplate.create({
    data: {
      type,
      label,
      shortLabel,
      description: description ?? '',
      items: {
        create: items.map((text, index) => ({
          itemKey: `item-${index + 1}`,
          label: text,
          sortOrder: index,
        })),
      },
      measurementFields: {
        create: (measurementFields ?? []).map((f, index) => ({
          groupLabel: f.groupLabel,
          rowLabel: f.rowLabel,
          columnLabel: f.columnLabel,
          unit: f.unit,
          fieldType: f.fieldType,
          sortOrder: index,
        })),
      },
      logFields: {
        create: (logFields ?? []).map((f, index) => ({
          groupLabel: f.groupLabel,
          columnLabel: f.columnLabel,
          fieldType: f.fieldType,
          unit: f.unit,
          sortOrder: index,
        })),
      },
    },
    include: templateInclude,
  })

  res.status(201).json(toTemplateDef(template))
})

function isBuiltIn(type: string): boolean {
  return (BUILT_IN_CHECKLIST_TYPES as readonly string[]).includes(type)
}

templatesRouter.patch('/:type', requireAuth, requireRole('supervisor'), async (req, res) => {
  const { type } = req.params
  if (isBuiltIn(type)) {
    res.status(403).json({ error: 'Built-in checklist types cannot be edited.' })
    return
  }

  const template = await prisma.checklistTemplate.findUnique({ where: { type } })
  if (!template) {
    res.status(404).json({ error: 'Checklist type not found.' })
    return
  }

  const recordCount = await prisma.checklistRecord.count({ where: { templateId: template.id } })
  if (recordCount > 0) {
    res.status(409).json({ error: `This checklist type has ${recordCount} submitted record${recordCount === 1 ? '' : 's'} and can no longer be edited.` })
    return
  }

  const parsed = updateTemplateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'A label and at least one item are required.' })
    return
  }
  const { label, description, items, measurementFields, logFields } = parsed.data
  const shortLabel = label.length <= 24 ? label : label.split(' ').slice(0, 3).join(' ')

  const updated = await prisma.checklistTemplate.update({
    where: { id: template.id },
    data: {
      label,
      shortLabel,
      description: description ?? '',
      items: {
        deleteMany: {},
        create: items.map((text, index) => ({
          itemKey: `item-${index + 1}`,
          label: text,
          sortOrder: index,
        })),
      },
      measurementFields: {
        deleteMany: {},
        create: (measurementFields ?? []).map((f, index) => ({
          groupLabel: f.groupLabel,
          rowLabel: f.rowLabel,
          columnLabel: f.columnLabel,
          unit: f.unit,
          fieldType: f.fieldType,
          sortOrder: index,
        })),
      },
      logFields: {
        deleteMany: {},
        create: (logFields ?? []).map((f, index) => ({
          groupLabel: f.groupLabel,
          columnLabel: f.columnLabel,
          fieldType: f.fieldType,
          unit: f.unit,
          sortOrder: index,
        })),
      },
    },
    include: templateInclude,
  })

  res.json(toTemplateDef(updated))
})

templatesRouter.delete('/:type', requireAuth, requireRole('supervisor'), async (req, res) => {
  const { type } = req.params
  if (isBuiltIn(type)) {
    res.status(403).json({ error: 'Built-in checklist types cannot be deleted.' })
    return
  }

  const template = await prisma.checklistTemplate.findUnique({ where: { type } })
  if (!template) {
    res.status(404).json({ error: 'Checklist type not found.' })
    return
  }

  const recordCount = await prisma.checklistRecord.count({ where: { templateId: template.id } })
  if (recordCount > 0) {
    res.status(409).json({ error: `This checklist type has ${recordCount} submitted record${recordCount === 1 ? '' : 's'} and cannot be deleted.` })
    return
  }

  await prisma.checklistTemplate.delete({ where: { id: template.id } })
  res.status(204).end()
})
