# School ERP — Launch Runbook (V1)

Do **not** apply migrations to ClinicFlow or any shared database.

## Status

Application features, multi-school auth, fees/exams/payroll integrity, portals, and modern UI are in **source**. Launch depends on **dedicated database + verification**, not more modules.

## Gate 1 — Green tip

- [ ] Latest GitHub Actions **Quality Check** on `main` is success
- [ ] Migration integrity job reports continuous sequence (001 → current max, e.g. 042)
- [ ] `package-lock.json` committed; CI uses `npm ci` only

```bash
npm install --package-lock-only --registry=https://registry.npmjs.org/
git add package-lock.json && git commit -m "chore: add package-lock for deterministic CI"
```

## Gate 2 — Dedicated Supabase

- [ ] New project (School ERP only)
- [ ] Apply `supabase/migrations/` **001 → last** in order
- [ ] Follow [PRODUCTION_SUPABASE_CHECKLIST.md](./PRODUCTION_SUPABASE_CHECKLIST.md)

## Gate 3 — Role & tenant proof

- [ ] Execute [E2E_ROLE_SMOKE_TEST.md](./E2E_ROLE_SMOKE_TEST.md)
- [ ] School A ↔ School B isolation passes
- [ ] Multi-school user switches only among active memberships

## Gate 4 — Vercel production

- [ ] Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`
- [ ] Auth redirect URLs match production domain
- [ ] Smoke: login → school setup → fee collection + receipt → exam lock/publish → parent portal

## Gate 5 — Phase-2 (after pilot)

- Online payments (UPI/gateway)
- WhatsApp / SMS / email providers
- Subscription enforcement polish

## Sign-off

Only after Gates 1–4: invite pilot schools.
