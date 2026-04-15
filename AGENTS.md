# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Mapeo Verde is a React + Vite SPA (TypeScript) for visualizing and protecting green areas in Aguascalientes, Mexico. The backend is Supabase (remote hosted, hardcoded credentials in `src/utils/supabase/info.tsx`). The app gracefully falls back to static JSON data in `src/data/static.ts` when Supabase is unreachable — no local database or Docker setup is needed.

### Dev commands (see `package.json` scripts)

| Task | Command |
|---|---|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` |
| Tests | `npm run test` |
| Build | `npm run build` |
| Format | `npm run format` |

### Notes and caveats

- The `.npmrc` configures the JSR registry (`@jsr:registry=https://npm.jsr.io`) — this is needed for the `@jsr/supabase__supabase-js` package.
- Vite dev server runs on **port 3000** (not the default 5173); configured in `vite.config.ts`.
- `npm run lint` exits with code 1 due to pre-existing warnings/errors in the codebase (179 warnings, 15 errors as of this writing). This is the baseline state of the repo.
- Google Calendar integration is proxied via Vite dev server proxy at `/api/calendar` — no extra setup needed locally.
- No environment variables are strictly required for local dev; the Supabase project ID and anon key are hardcoded and the app falls back to static data if the remote Supabase is unreachable.
- Supabase Edge Functions (in `supabase/functions/`) run on Deno and are deployed separately — not needed for local frontend development.
