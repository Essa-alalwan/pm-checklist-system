import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { requireAuth, requireRole } from '../middleware/requireAuth'
import { buildReadingsForRecord, recordInclude, toApiRecord } from '../mappers/record'
import { generateRecordPdf } from '../pdf/generateRecordPdf'
import type { Prisma } from '@prisma/client'

export const recordsRouter = Router()

const itemResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(['done', 'na', 'flagged']),
  note: z.string().optional(),
})

const baseSchema = z.object({
  kksCode: z.string().min(1),
  equipmentDescription: z.string().min(1),
  date: z.string().min(1),
  preparedBy: z.string().min(1),
  doneBy: z.string().min(1),
  numberOfHelpers: z.number().int().min(0),
  signatureDataUrl: z.string().min(1),
  remarks: z.string().optional(),
  items: z.array(itemResultSchema).min(1),
})

// A measurement is either a real number or the literal "N/A" (a technician
// couldn't get a reading) — mirrors NumericOrNA in types/checklist.ts.
const numericOrNASchema = z.union([z.number(), z.literal('N/A')]).optional()

const windingRowSchema = z.object({
  phase: z.enum(['R-Y', 'Y-B', 'R-B']),
  resistanceOhm: numericOrNASchema,
  inductanceMh: numericOrNASchema,
})

const lvAcMotorSchema = baseSchema.extend({
  type: z.literal('lv-ac-motor'),
  windingResistance: z.array(windingRowSchema),
  spaceHeaterResistanceOhm: numericOrNASchema,
  spaceHeaterInsulationMOhm: numericOrNASchema,
  phaseToEarthInsulationMOhm: numericOrNASchema,
  ambientTempC: numericOrNASchema,
  humidityPercent: numericOrNASchema,
})

const shaftBrushSchema = z.object({ holderNumber: z.number(), lengthMm: numericOrNASchema })
const brushRowSchema = z.object({ id: z.string(), holderNumber: z.number(), side: z.string(), lengthMm: numericOrNASchema })

const generatorSchema = baseSchema.extend({
  type: z.literal('generator'),
  shaftGroundingBrushes: z.array(shaftBrushSchema),
  brushLengths: z.array(brushRowSchema),
  h2PressureBar: numericOrNASchema,
  ipbPressureBar: numericOrNASchema,
  ipbTempC: numericOrNASchema,
  ipbHumidityPercent: numericOrNASchema,
  gtRunningHours: numericOrNASchema,
})

// Supervisor-uploaded checklist types have no type-specific fields — just the
// base sign-off info and items. `type` isn't a literal here (it's whatever
// slug the template was given), so this can't join the two schemas above in
// a z.discriminatedUnion — dispatch on `type` manually instead.
const genericSchema = baseSchema.extend({ type: z.string().min(1) })

function parseCreateRecordBody(body: unknown) {
  const type = (body as { type?: unknown } | null)?.type
  if (type === 'lv-ac-motor') return lvAcMotorSchema.safeParse(body)
  if (type === 'generator') return generatorSchema.safeParse(body)
  return genericSchema.safeParse(body)
}

const reviewSchema = z.object({ reviewedBy: z.string().min(1) })

recordsRouter.get('/', async (req, res) => {
  const { type, kksCode, technician, dateFrom, dateTo, onlyFlagged } = req.query as Record<string, string | undefined>

  const where: Prisma.ChecklistRecordWhereInput = {}
  if (type && type !== 'all') where.template = { type }
  if (kksCode) where.kksCode = { contains: kksCode, mode: 'insensitive' }
  if (technician) where.doneBy = { contains: technician, mode: 'insensitive' }
  if (dateFrom || dateTo) where.date = { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) }
  if (onlyFlagged === 'true') where.items = { some: { status: 'flagged' } }

  const records = await prisma.checklistRecord.findMany({ where, include: recordInclude, orderBy: { createdAt: 'desc' } })
  res.json(records.map(toApiRecord))
})

recordsRouter.get('/:id', async (req, res) => {
  const record = await prisma.checklistRecord.findUnique({ where: { id: req.params.id }, include: recordInclude })
  if (!record) {
    res.status(404).json({ error: 'Record not found.' })
    return
  }
  res.json(toApiRecord(record))
})

recordsRouter.post('/', requireAuth, async (req, res) => {
  const parsed = parseCreateRecordBody(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid checklist payload.', details: parsed.error.flatten() })
    return
  }
  const input = parsed.data

  const template = await prisma.checklistTemplate.findUnique({ where: { type: input.type }, include: { items: true } })
  if (!template) {
    res.status(400).json({ error: `Unknown checklist type "${input.type}".` })
    return
  }

  const templateItemIdByKey = new Map(template.items.map((i) => [i.itemKey, i.id]))
  const unknownItem = input.items.find((item) => !templateItemIdByKey.has(item.id))
  if (unknownItem) {
    res.status(400).json({ error: `Unknown checklist item "${unknownItem.id}" for this template.` })
    return
  }

  const readings = buildReadingsForRecord(input)

  const created = await prisma.checklistRecord.create({
    data: {
      templateId: template.id,
      kksCode: input.kksCode,
      equipmentDescription: input.equipmentDescription,
      date: input.date,
      preparedBy: input.preparedBy,
      doneBy: input.doneBy,
      numberOfHelpers: input.numberOfHelpers,
      signatureDataUrl: input.signatureDataUrl,
      remarks: input.remarks,
      status: 'submitted',
      createdByUserId: req.user!.id,
      items: {
        create: input.items.map((item) => ({
          status: item.status,
          note: item.note,
          templateItemId: templateItemIdByKey.get(item.id)!,
        })),
      },
      readings: {
        create: readings.map((r) => ({
          key: r.key,
          groupLabel: r.groupLabel,
          value: r.value,
          textValue: r.textValue,
          unit: r.unit,
          sortOrder: r.sortOrder,
        })),
      },
      auditEvents: {
        create: { action: 'created', actorUserId: req.user!.id },
      },
    },
    include: recordInclude,
  })

  res.status(201).json(toApiRecord(created))
})

recordsRouter.patch('/:id/review', requireAuth, requireRole('supervisor'), async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'reviewedBy is required.' })
    return
  }

  const existing = await prisma.checklistRecord.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    res.status(404).json({ error: 'Record not found.' })
    return
  }

  const updated = await prisma.checklistRecord.update({
    where: { id: req.params.id },
    data: {
      reviewedBy: parsed.data.reviewedBy,
      reviewedAt: new Date(),
      status: 'reviewed',
      auditEvents: { create: { action: 'reviewed', actorUserId: req.user!.id } },
    },
    include: recordInclude,
  })

  res.json(toApiRecord(updated))
})

function canModify(record: { createdByUserId: string; status: string }, user: { id: string; role: string }): { ok: true } | { ok: false; status: number; error: string } {
  const isOwner = record.createdByUserId === user.id
  const isSupervisor = user.role === 'supervisor'
  if (!isOwner && !isSupervisor) {
    return { ok: false, status: 403, error: 'You can only edit or delete your own checklist records.' }
  }
  if (record.status === 'reviewed') {
    return { ok: false, status: 403, error: 'This record has already been reviewed and can no longer be edited or deleted.' }
  }
  return { ok: true }
}

recordsRouter.patch('/:id', requireAuth, async (req, res) => {
  const existing = await prisma.checklistRecord.findUnique({ where: { id: req.params.id }, include: { template: { include: { items: true } } } })
  if (!existing) {
    res.status(404).json({ error: 'Record not found.' })
    return
  }

  const permission = canModify(existing, req.user!)
  if (!permission.ok) {
    res.status(permission.status).json({ error: permission.error })
    return
  }

  const parsed = parseCreateRecordBody(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid checklist payload.', details: parsed.error.flatten() })
    return
  }
  const input = parsed.data

  if (input.type !== existing.template.type) {
    res.status(400).json({ error: 'Cannot change the checklist type of an existing record.' })
    return
  }

  const templateItemIdByKey = new Map(existing.template.items.map((i) => [i.itemKey, i.id]))
  const unknownItem = input.items.find((item) => !templateItemIdByKey.has(item.id))
  if (unknownItem) {
    res.status(400).json({ error: `Unknown checklist item "${unknownItem.id}" for this template.` })
    return
  }

  const readings = buildReadingsForRecord(input)

  const updated = await prisma.checklistRecord.update({
    where: { id: existing.id },
    data: {
      kksCode: input.kksCode,
      equipmentDescription: input.equipmentDescription,
      date: input.date,
      preparedBy: input.preparedBy,
      doneBy: input.doneBy,
      numberOfHelpers: input.numberOfHelpers,
      signatureDataUrl: input.signatureDataUrl,
      remarks: input.remarks,
      items: {
        deleteMany: {},
        create: input.items.map((item) => ({
          status: item.status,
          note: item.note,
          templateItemId: templateItemIdByKey.get(item.id)!,
        })),
      },
      readings: {
        deleteMany: {},
        create: readings.map((r) => ({
          key: r.key,
          groupLabel: r.groupLabel,
          value: r.value,
          textValue: r.textValue,
          unit: r.unit,
          sortOrder: r.sortOrder,
        })),
      },
      auditEvents: {
        create: { action: 'edited', actorUserId: req.user!.id },
      },
    },
    include: recordInclude,
  })

  res.json(toApiRecord(updated))
})

recordsRouter.delete('/:id', requireAuth, async (req, res) => {
  const existing = await prisma.checklistRecord.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    res.status(404).json({ error: 'Record not found.' })
    return
  }

  const permission = canModify(existing, req.user!)
  if (!permission.ok) {
    res.status(permission.status).json({ error: permission.error })
    return
  }

  await prisma.checklistRecord.delete({ where: { id: existing.id } })
  res.status(204).end()
})

recordsRouter.get('/:id/pdf', requireAuth, async (req, res) => {
  const record = await prisma.checklistRecord.findUnique({ where: { id: req.params.id }, include: recordInclude })
  if (!record) {
    res.status(404).json({ error: 'Record not found.' })
    return
  }

  const apiRecord = toApiRecord(record)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${apiRecord.kksCode || 'checklist'}.pdf"`)
  generateRecordPdf(apiRecord, record.template.label).pipe(res)
})
