# Frontend — Production Management System (MES / Mini-ERP)

React + TypeScript + Tailwind CSS implementation, built directly against the real,
migrated backend (`ERP-Backend-Migrated.zip`) and the final Stitch designs approved
after three rounds of review. See `../Frontend_Build_Report.md` for the full
narrative of decisions, corrections, and discovered gaps.

## Running locally

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL to your actual backend address
npm run dev
```

Requires the backend running with CORS enabled for `http://localhost:5173`, and the
JWT secret / SuperAdmin password configured per `04_Backend_Migration_Report.md`.

## Demo mode (no backend needed)

While the backend is unfinished, the whole UI can run on sample data that lives inside the
browser (`src/lib/mock/`). It is an axios adapter, so every screen, hook and role guard runs
unchanged. It reproduces the real flows: raw material -> lab -> production batch -> lab ->
manager approval -> shipping, plus rejection, quarantine, rework and destroy paths.

- **On Vercel:** already on, via the committed `.env.production` (`VITE_USE_MOCK_API=true`).
  No `VITE_API_BASE_URL` is required in this mode; the build guard in `vite.config.ts` is skipped.
- **Locally:** put `VITE_USE_MOCK_API=true` in `.env`, then `npm run dev`.
- **Sign in:** the login page shows one button per role (any password works). Usernames:
  `storekeeper`, `production`, `lab`, `quality`, `manager`, `admin`.
- Data is in memory only: refreshing the page restores the seed data (and signs you out).
- **Switching to the real backend:** set `VITE_USE_MOCK_API=false` in `.env.production` and
  provide `VITE_API_BASE_URL` (https, ending in `/api/v1`), then push.
- Check the mock logic with `npx tsx verify-mock-api.ts` (22 assertions over a full lifecycle).

## Deploying to Vercel

1. Push the project to Git. If the repo root is the folder *containing* `erp-frontend/`,
   set **Root Directory = `erp-frontend`** in the Vercel project settings.
2. Framework Preset = **Vite** (auto-detected). Build command `npm run build`, output `dist`
   (already declared in `vercel.json`, which also adds the SPA rewrite so deep links and
   page refreshes don't 404).
3. **Real backend only** (skip while in demo mode) **— Settings → Environment Variables:** add `VITE_API_BASE_URL` (Production, and Preview if
   you use it) = the real backend URL, **https** and ending in `/api/v1`. The production
   build **fails on purpose** if this variable is missing (see `vite.config.ts`) instead of
   silently shipping a site that calls `localhost`.
4. Backend side: it must be reachable over public HTTPS, and its CORS `AllowedOrigins` must
   include the exact Vercel origin (e.g. `https://your-app.vercel.app`, no trailing slash).
5. Run `npm install` locally once and commit `package-lock.json` so Vercel installs the same
   versions you tested.

## Running the tests

```bash
npm test
```

Four real Vitest suites are included (`src/**/__tests__/*.test.ts(x)`), covering the
scrap "golden equation", quarantine entry grouping (including the corrected
understanding of the `Reworked` state), the `ApiResponse<T>` envelope unwrapping, and
`StatusBadge` rendering for all 9 real batch states.

## What was actually executed during this build (not just written)

This sandbox has no internet access and no `.NET SDK`, but it does have Node 22 with
globally installed `typescript@6.0.3` and `tsx` — both were used for real, not just
described:

- `tsc --noEmit` was run against every dependency-free `.ts` file (`lib/types/api.ts`,
  `lib/api-client.ts`, `groupScrapEntries.ts`) using a temporary local stub for
  `axios`'s types (`tools/vendor-stubs/`, used only by `tsconfig.purecheck.json` and
  deliberately kept outside `src/` so it never shadows the real package types in
  the actual build) — **0 errors**.
- `verify-business-logic.ts` at the project root actually *runs* (via `tsx`, not just
  type-checks) the scrap-calculation and quarantine-grouping logic against 8
  hand-written assertions — **8/8 passed**. Run it yourself with
  `npx tsx verify-business-logic.ts`.
- Every `apiClient.get/post` call in the whole `src/features` tree was grepped and
  compared, one by one, against every real `[HttpGet]/[HttpPost]` attribute in the
  actual `Controllers/*.cs` — all 22 calls (21 in `features/*/api.ts` + the login call
  in `useAuth.tsx`) match a real route exactly. The other 5 real endpoints
  (`/auth/register`, `production/batches/{id}`, `/lab/results`, `/scrap/all`,
  `/reports/traceability/{batchId}`) are real backend capabilities this UI doesn't
  call yet — see `Frontend_Build_Report.md` for why.
- **Not executed** (would require `npm install`, blocked by no network access here):
  the full `.tsx` component tree was never passed through `tsc`, because this sandbox
  has no `@types/react` and hand-stubbing React's own type system accurately is not
  practical. Run `npm run build` yourself for the first real, complete compile check.

## Known, documented gaps between the approved design and the real backend

These are **not bugs in this frontend** — they are places where the UI was built to
honestly reflect what the backend can currently provide, which is narrower than the
approved Stitch mockups in a few places. Full detail in `Frontend_Build_Report.md`:

1. No `GET /products` endpoint exists — the "Start Batch" form takes a numeric
   Product ID instead of a name dropdown.
2. `BatchResponseDto`/`BatchSummaryDto` carry no product or raw-material *names*,
   only IDs — shown as `Product #{id}` throughout.
3. `GetPendingApprovalsAsync` only ever returns `QC_Passed` batches with no lab-result
   fields at all — the Approvals screen no longer shows a "Lab Result" / "Lab Notes"
   column, and a `QC_Failed` batch currently has no discoverable path to this screen.
4. `DashboardStatsDto` has no time series and no scrap-by-source breakdown — the two
   charts from the approved Overview design were intentionally left out rather than
   populated with invented numbers.
5. `CreateShipmentDto` has no date field (the backend stamps `UtcNow` itself) — the
   date picker from the approved design was removed from the Create Shipment modal.
