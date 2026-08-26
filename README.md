# PM Logbook

Digital preventive maintenance checklist system for the Electrical Maintenance department at Aldur-2 Power & Water Services (NOMAC).

**Phase 1 (current):** Frontend only, with mock data persisted to browser `localStorage`. No backend, no real authentication.

## Running locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (typically http://localhost:5173).

- Sign in with any username/password on the login screen — authentication isn't connected yet.
- Use **Settings → Role Preview** to switch between Technician and Supervisor to see both the submission and review flows.
- Data lives in your browser's `localStorage`, seeded from `src/data/seed/checklists.seed.ts` on first load. Clear site data to reset to the seed set.

## Project structure

- `src/pages/` — one file per route/screen.
- `src/components/ui/` — generic building blocks (buttons, fields, status pills, empty/error/loading states).
- `src/components/layout/` — app shell, sidebar, mobile bottom nav, top bar.
- `src/components/checklist/` — checklist-specific pieces (signature pad, item rows, measurement tables, the wizard steps in `wizard/`).
- `src/components/records/` — records list filter bar and row.
- `src/data/` — the Phase-2 seam: `repository.ts` exposes the read/write functions every page calls; today it's backed by `localStorage`, and in Phase 2 only this file's internals change to real API calls. `templates/` holds the per-equipment-type checklist definitions (item lists) — adding a new checklist type means adding one template file here, not redesigning any screen.
- `src/hooks/` — thin hooks wrapping the repository functions with loading/error state.
- `src/features/wizard/` — the new-checklist wizard's draft factory and step validation logic.
- `src/context/SessionContext.tsx` — mock session/role state (stands in for real auth until Phase 2).

## Tech stack

Vite + React + TypeScript, React Router, Tailwind CSS (custom design tokens for the dark instrumentation theme), lucide-react icons.
