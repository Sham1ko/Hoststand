<div align="center">

<img src="public/logo.svg" width="72" height="72" alt="Hoststand logo" />

# Hoststand

**Restaurant floor plan and reservation manager.** Lay out tables, assign zones, track bookings — all on an interactive SVG map.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Jest](https://img.shields.io/badge/Jest-12%20suites-C21325?logo=jest&logoColor=white)](https://jestjs.io)

### [**Live demo → hoststand.vercel.app**](https://hoststand.vercel.app)

</div>

<!-- Add a screenshot or GIF here once captured:
![Hoststand](docs/screenshot.png)
-->

## Features

- **Interactive floor map** — 3 floors, 6 zones, 24 tables in SVG. Pan, cursor-anchored zoom, fit-to-screen.
- **Table editor** — move, resize and rotate tables, with snapping to zones.
- **Reservations** — create, edit, change status, filter by date and status, jump from a booking to its table.
- **AI translation** — guest comments between Russian, English, Kazakh and Chinese via OpenRouter.
- **Swappable data layer** — `localStorage` by default, optional in-memory Mock API, one interface behind both.
- **Demo reset** — restore the seed dataset behind a confirmation.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, shadcn/ui on Base UI |
| Icons | [lucide-react](https://lucide.dev) |
| Forms & validation | react-hook-form, zod |
| Dates | date-fns, react-day-picker |
| AI | Vercel AI SDK + OpenRouter |
| Testing | Jest (12 suites, pure logic) |
| Language | TypeScript 5 (strict) |

## Quick start

Requires **Node.js ≥ 20.9** and pnpm.

```bash
pnpm install
cp .env.sample .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). `npm` works too.

## Environment

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_ENABLE_MOCK_API` | no | `false` | Shows the data-source switch in Settings. Leave off to stay on `localStorage`. |
| `OPENROUTER_API_KEY` | no | — | Server-only key for comment translation. Every other feature works without it; translation just reports that it is not configured. |

> [!WARNING]
> Never expose the OpenRouter key with a `NEXT_PUBLIC_` prefix. It is read only inside the `/api/translate` route handler.

## Scripts

| Command | Does |
| --- | --- |
| `pnpm dev` | Dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm test` | Run the Jest suites |
| `pnpm lint` | ESLint |
| `npx tsc --noEmit` | Type check |

## Map controls

Drag empty space to pan, wheel to zoom at the cursor, click a table to select it.
**Edit** opens plan mode: drag a table to move it, use the handle above it to rotate freely, or the panel below for ±15° steps and exact angles. **Save** commits staged changes, **Cancel** drops them.

## Project structure

```
src/
├─ app/         # App Router pages and /api routes (mock API, translation)
├─ client/      # repository implementations — localStorage and HTTP
├─ components/  # floor map, reservations sidebar, shadcn/ui primitives
├─ entities/    # domain models, zod schemas, seed data
├─ features/    # comment translation, reservation management
├─ lib/         # floor-plan geometry and camera math
└─ server/      # in-memory store backing the mock API
tests/          # Jest suites: geometry, camera, state transitions
```

## Architecture notes

- The UI depends on a single `RestaurantRepository` interface, so swapping storage never touches components.
- State lives in `localStorage` under the versioned key `hoststand.restaurant.v1`. Missing or corrupt data falls back to the seed: 3 floors, 6 zones, 24 tables, 15 reservations. Bump the key version when `restaurantStateSchema` changes incompatibly.
- The map is plain SVG — no canvas library. Camera math, geometry, zone snapping and status transitions are pure functions, which is exactly what the test suites cover.

See [docs/architecture.md](docs/architecture.md) for the full breakdown.

## Known limitations

- Chairs around tables are not computed or drawn.
- No two-finger pinch zoom.
- Saving several entities is not yet one atomic repository transaction.
- Overlapping reservations on the same table are not blocked.
- Zones are created at a fixed size — there is no drag-to-draw mode.
