import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { requireAuth } from '../middleware/requireAuth'

export const authRouter = Router()

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

function toPublicUser(user: {
  id: string
  name: string
  username: string
  role: string
  department: string
  signatureDataUrl: string | null
}) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    department: user.department,
    signatureDataUrl: user.signatureDataUrl ?? undefined,
  }
}

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Username and password are required.' })
    return
  }

  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } })
  const passwordMatches = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false

  if (!user || !passwordMatches) {
    res.status(401).json({ error: 'Invalid username or password.' })
    return
  }

  req.session.userId = user.id
  res.json({ user: toPublicUser(user) })
})

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('pmlogbook.sid')
    res.status(204).end()
  })
})

authRouter.get('/me', (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not signed in.' })
    return
  }
  res.json({ user: toPublicUser(req.user) })
})

const updateSignatureSchema = z.object({
  signatureDataUrl: z.string().min(1).startsWith('data:image/'),
})

authRouter.patch('/me/signature', requireAuth, async (req, res) => {
  const parsed = updateSignatureSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'A valid signature image is required.' })
    return
  }

  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: { signatureDataUrl: parsed.data.signatureDataUrl },
  })

  res.json({ user: toPublicUser(updated) })
})
