# PM Logbook

Digital preventive maintenance checklist system for the Electrical Maintenance department at Aldur-2 Power & Water Services (NOMAC).

**Phase 2 (current):** Full stack — PostgreSQL, a real Express/TypeScript API, and session-based authentication with technician/supervisor roles. The frontend talks to the API instead of `localStorage`.

## Prerequisite: Docker Desktop

The database runs in a container. If you don't have it yet, install **Docker Desktop** (https://www.docker.com/products/docker-desktop/), then make sure it's running (its whale icon shows "running" in the system tray) before continuing.

## Running locally

**1. Start Postgres:**

```bash
docker compose up -d
```

**2. Start the API** (in a separate terminal):

```bash
cd server
npm install
copy .env.example .env        # (already done if you're picking this repo up as-is)
npx prisma migrate dev
npx prisma db seed
npm run dev
```

This starts the API at http://localhost:4000 and creates two demo accounts:

| Role | Username | Password |
|---|---|---|
| Technician | `faisal` | `technician123` |
| Supervisor | `omar` | `supervisor123` |

**3. Start the frontend** (in another terminal, from the repo root):

```bash
npm install
npm run dev
```

Open the URL Vite prints (typically http://localhost:5173) and sign in with one of the accounts above. The frontend proxies `/api` requests to the backend on :4000 (configured in `vite.config.ts`), so no CORS setup is needed for local dev.

**Resetting the database:** `docker compose down -v` removes the Postgres volume; run the migrate/seed steps again to start fresh. `npx prisma studio` (from `server/`) opens a GUI to browse/edit the data directly.

## Project structure

**Frontend (`src/`)**
- `pages/` — one file per route/screen.
- `components/ui/` — generic building blocks (buttons, fields, status pills, empty/error/loading states).
- `components/layout/` — app shell, sidebar, mobile bottom nav, top bar.
- `components/checklist/` — checklist-specific pieces (signature pad, item rows, measurement tables, the wizard steps in `wizard/`).
- `components/records/` — records list filter bar and row.
- `data/repository.ts` — the one seam every page/hook calls (`listChecklists`, `createChecklist`, `reviewChecklist`, etc.); it's a thin `fetch` wrapper over the API (see `data/apiClient.ts`).
- `hooks/` — thin hooks wrapping the repository functions with loading/error state.
- `features/wizard/` — the new-checklist wizard's draft factory and step validation logic.
- `context/SessionContext.tsx` — real session state, backed by `/api/auth/*`.
- `context/TemplatesContext.tsx` — fetches checklist templates (equipment types + their item lists) once from `/api/templates` and caches them for the whole app.

**Backend (`server/`)**
- `prisma/schema.prisma` — the database schema. `ChecklistTemplate`/`ChecklistTemplateItem` hold the checklist item lists as data, not code — adding a new equipment type is new rows, not a migration. `ChecklistReading` is a flat, generically-keyed table for every numeric measurement field (winding resistance, brush lengths, gas pressures, etc.), designed so those can be charted over time later without a schema change.
- `prisma/seed.ts` — creates the two checklist templates, two demo accounts, and a handful of sample records.
- `src/routes/` — the Express route handlers (`auth`, `templates`, `records`, `dashboard`).
- `src/mappers/` — converts between the flat DB rows and the exact JSON shapes the frontend expects (`readings.ts` handles the numeric-measurement flattening/unflattening per checklist type).
- `src/pdf/generateRecordPdf.ts` — builds the PDF served from `GET /api/records/:id/pdf`.
- `src/middleware/` — session-based auth (`attachUser`, `requireAuth`, `requireRole`).

## Tech stack

**Frontend:** Vite + React + TypeScript, React Router, Tailwind CSS (custom design tokens for the dark instrumentation theme), lucide-react icons.

**Backend:** Express + TypeScript, Prisma (PostgreSQL), express-session + connect-pg-simple (cookie sessions stored in Postgres), bcryptjs, Zod, PDFKit.
