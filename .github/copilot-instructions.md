# Copilot Instructions for Showroom

## Build, Test, and Lint Commands

- **Build:** `npm run build` (compiles TypeScript and builds with Vite)
- **Dev server:** `npm run dev` (starts Vite dev server)
- **Preview:** `npm run preview` (serves built app)
- **Lint:** `npm run lint` (runs ESLint)
- **Test:** `npm run test` (runs Vitest)
- **Single test:** Use `npx vitest run path/to/testfile` (e.g., `npx vitest run tests/api.test.ts`)

## High-Level Architecture

- **Frontend:** React (TypeScript), Vite, modular structure in `src/`.
- **API Client:** `src/api.ts` provides a GarageApiV1Client for interacting with Garage S3-compatible backend. All API calls require `VITE_BASE_URL` and `VITE_AUTH_TOKEN` environment variables.
- **Pages:** Main views are in `src/pages/` (Overview, Buckets, Keys, BucketDetail). Navigation is hash-based.
- **Components:** Reusable UI elements in `src/components/` (e.g., Modal, Spinner, CopyButton).
- **Types/Models:** Shared types in `src/types.ts` and `src/model.ts`.
- **Testing:** Unit tests in `tests/` use Vitest and mock axios.
- **Specs:** User flows and requirements are documented in `specs/` markdown files.
- **Docker:** `docker-compose.yml` and `Dockerfile` for local development and deployment. Caddy serves frontend; Garage runs as backend.

## Key Conventions

- **Commit messages:** Use `feat`, `chore`, `fix`, `infra` as preamble. Prefer short, concise messages (see AGENTS.md).
- **Environment setup:** App requires `VITE_BASE_URL` and `VITE_AUTH_TOKEN` for API access. If missing, UI shows a setup callout.
- **Delete actions:** Require manual confirmation by typing the resource ID (bucket/key) before deletion.
- **Permissions:** Keys and buckets have granular permissions (read, write, owner, createBucket).
- **Error handling:** Custom error classes (`AppError`, `NotFoundError`) are used for API failures.
- **UI navigation:** Hash-based routing, not React Router.
- **Specs:** Use `specs/` for feature documentation and flows.

---

This file summarizes build/test/lint commands, architecture, and conventions for Copilot. Let me know if you want to adjust anything or add coverage for areas I may have missed.
