# PM Studio

Next.js project management workspace that blends Microsoft Project–style scheduling (network diagram, critical path, constraints) with planner-style task views, dashboards, and an export-to-Microsoft Project XML workflow.

## Features
- MS Project–style network diagram with critical path highlighting, float, constraints, and dependency types (FS/SS/FF/SF with lag/lead).
- Planner views: My Day, My Tasks, My Plans with filtering, grouping, and search.
- Project dashboards, Gantt-inspired views, and schedule summaries.
- MS Project compatibility: download as XML and open via Microsoft Project (`File > Open`, choose XML if prompted).
- Export utility backed by MSPDI-style XML generator and optional ZIP wrapper API.
- Component library powered by Radix UI + Tailwind utilities for consistent UI.
- Jest tests for network diagram, critical path, and MS Project validation logic.

## Tech Stack
- Next.js 16, React 19, TypeScript
- Radix UI, Tailwind utilities, Lucide icons
- Jest + Testing Library for unit/integration tests
- JSZip for MS Project XML packaging

## Getting Started
Prerequisites: Node.js 18+ (Node 20+ recommended) and npm or pnpm.

```bash
git clone <your-repo-url>
cd pm-studio
npm install          # or pnpm install
npm run dev          # starts Next.js on http://localhost:3000
```

Build for production:
```bash
npm run build
npm start
```

Lint and tests:
```bash
npm run lint
npm run test         # Jest suite
```

## Exporting to Microsoft Project
1. Open a project page and click **Download for MS Project**.
2. A dialog explains that the file downloads as **XML**.
3. After download, open in Microsoft Project via **File > Open** and, if prompted, select the **XML** format.

## Project Structure (high level)
- `app/` – Next.js routes and pages (dashboard, planner, MS Project views, API).
- `components/` – UI components, planner views, MS Project views, project header.
- `lib/` – Core logic: MS Project XML export, network diagram service, automation engine, templates, storage helpers.
- `__tests__/` – Jest tests for automation, critical path, MS Project compatibility.
- `public/` – Static assets.

## Scripts
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm start` – run built app
- `npm run lint` – ESLint
- `npm run test` / `npm run test:watch` / `npm run test:coverage`

## Notes
- MS Project export downloads as XML; open it with Microsoft Project using the XML file option.
- No external environment variables are required for local dev by default.

## Contributing
1. Create a branch for your change.
2. Update docs/tests as needed.
3. Run lint/tests.
4. Open a PR.