import { Router } from 'express'
import { prisma } from '../db'
import { recordInclude, toApiRecord } from '../mappers/record'

export const dashboardRouter = Router()

dashboardRouter.get('/stats', async (_req, res) => {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [recordsThisWeek, flaggedAwaitingReview, totalRecords, pendingReview] = await Promise.all([
    prisma.checklistRecord.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.checklistRecord.count({ where: { status: { not: 'reviewed' }, items: { some: { status: 'flagged' } } } }),
    prisma.checklistRecord.count(),
    prisma.checklistRecord.count({ where: { status: { not: 'reviewed' } } }),
  ])

  res.json({ recordsThisWeek, flaggedAwaitingReview, totalRecords, pendingReview })
})

dashboardRouter.get('/recent', async (req, res) => {
  const limit = Number(req.query.limit) || 6
  const records = await prisma.checklistRecord.findMany({
    include: recordInclude,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  res.json(records.map(toApiRecord))
})
