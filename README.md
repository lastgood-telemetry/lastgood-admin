# lastgood-admin

Internal admin console for LastGood. One page: every org with its users, connected
projects, API keys and event activity, plus two actions: revoke an org's API keys and
suspend/unsuspend an org. Not customer-facing.

## How it works

- Static Vite + React app. It talks to `lastgood-be` (`/api/admin/*`).
- Access is a static key, enforced by the backend, not this app. Every admin endpoint
  requires `X-Admin-Key` equal to the `ADMIN_API_KEY` env var on `lastgood-be`, and
  `X-Admin-User` equal to `ADMIN_USERNAME` when that is set. Wrong or missing gives 401. Too
  many failures from one IP gives 429. Hiding the UI is not the security boundary.
- There is no login endpoint and no token. The login form asks for the admin ID and key once,
  keeps them in this browser's `localStorage` (`lg_admin_user`, `lg_admin_key`) and sends them
  as headers on every call. A 401 clears them and shows the form again. Use "Sign out" on a
  shared machine.
- This is separate from LastGood user accounts. Rotate the key by changing the env var and redeploying
  `lastgood-be`.

## Run

```
pnpm install
cp .env.example .env
pnpm dev
pnpm test
pnpm build
```

## Deploy

Same pattern as the console: import the repo in Vercel (framework Vite, build `pnpm build`,
output `dist`), add domain `admin.lastgood.space`. `lastgood-be` CORS already allows
`*.lastgood.space`.

## Backend setup

Set on the lastgood-be host: `ADMIN_API_KEY` (16+ random characters, e.g. `openssl rand -hex 24`) and
optionally `ADMIN_USERNAME`, then make sure migration `021_add_org_suspension.sql` has run.
