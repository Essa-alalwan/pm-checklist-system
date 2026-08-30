import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../db'

export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  const userId = req.session.userId
  if (!userId) {
    next()
    return
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user) {
    req.user = { id: user.id, name: user.name, username: user.username, role: user.role, department: user.department }
  } else {
    // Session points at a user that no longer exists — clear it.
    req.session.userId = undefined
  }
  next()
}
