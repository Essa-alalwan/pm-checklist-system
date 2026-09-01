import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { prisma } from '../db'
import { requireAuth, requireRole } from '../middleware/requireAuth'
import { parseChecklistDocx } from '../parsing/parseChecklistDocx'
import { BUILT_IN_CHECKLIST_TYPES, type ChecklistTemplateDef, type ChecklistType } from '../types/checklist'

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
    res.json(parsed)
  } catch {
    res.status(422).json({ error: 'Could not read this document. Make sure it is a valid .docx file.' })
  }
})

const createTemplateSchema = z.object({
  label: z.string().min(1),
  description: z.string().optional(),
  items: z.array(z.string().min(1)).min(1),
})

templatesRouter.post('/', requireAuth, requireRole('supervisor'), async (req, res) => {
  const parsed = createTemplateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'A label and at least one item are required.' })
    return
  }
  const { label, description, items } = parsed.data

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
    },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  })

  const result: ChecklistTemplateDef = {
    type: template.type,
    label: template.label,
    shortLabel: template.shortLabel,
    description: template.description,
    items: template.items.map((i) => ({ id: i.itemKey, label: i.label })),
  }

  res.status(201).json(result)
})

const updateTemplateSchema = z.object({
  label: z.string().min(1),
  description: z.string().optional(),
  items: z.array(z.string().min(1)).min(1),
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
  const { label, description, items } = parsed.data
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
    },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  })

  const result: ChecklistTemplateDef = {
    type: updated.type,
    label: updated.label,
    shortLabel: updated.shortLabel,
    description: updated.description,
    items: updated.items.map((i) => ({ id: i.itemKey, label: i.label })),
  }

  res.json(result)
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
