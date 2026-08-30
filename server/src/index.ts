import 'dotenv/config'
import 'express-async-errors'
import connectPgSimple from 'connect-pg-simple'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import { Pool } from 'pg'
import { attachUser } from './middleware/attachUser'
import { authRouter } from './routes/auth'
import { dashboardRouter } from './routes/dashboard'
import { recordsRouter } from './routes/records'
import { templatesRouter } from './routes/templates'

const PORT = Number(process.env.PORT) || 4000
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-secret'

const app = express()

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))
app.use(express.json({ limit: '5mb' })) // signatures are base64 PNGs, allow a generous body size

const pgPool = new Pool({ connectionString: process.env.DATABASE_URL })
const PgSession = connectPgSimple(session)

app.use(
  session({
    store: new PgSession({ pool: pgPool, createTableIfMissing: true }),
    name: 'pmlogbook.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set true once served over HTTPS in a real deployment
      maxAge: 1000 * 60 * 60 * 12, // 12 hours
    },
  }),
)

app.use(attachUser)

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/records', recordsRouter)
app.use('/api/dashboard', dashboardRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error.' })
})

app.listen(PORT, () => {
  console.log(`PM Logbook API listening on http://localhost:${PORT}`)
})
