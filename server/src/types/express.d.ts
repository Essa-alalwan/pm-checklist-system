import type { UserRole } from '@prisma/client'

declare module 'express-session' {
  interface SessionData {
    userId?: string
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        name: string
        username: string
        role: UserRole
        department: string
      }
    }
  }
}

export {}
