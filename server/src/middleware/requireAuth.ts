import type { NextFunction, Request, Response } from 'express'
import type { UserRole } from '@prisma/client'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Not signed in.' })
    return
  }
  next()
}

export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Not signed in.' })
      return
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: `This action requires the ${role} role.` })
      return
    }
    next()
  }
}
