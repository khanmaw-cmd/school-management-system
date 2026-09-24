# School Management System — Setup & Deploy

## Prerequisites

- Node.js 20+ recommended
- npm
- Accounts: [Supabase](https://supabase.com), [Vercel](https://vercel.com), [GitHub](https://github.com)

---

## 1. Clone & install

```bash
git clone https://github.com/khanmaw-cmd/school-management-system.git
cd school-management-system
npm install
# Recommended for production CI:
npm install --package-lock-only   # then commit package-lock.json
```

---

## 2. Dedicated Supabase project

**Do not** reuse another product’s database.

1. Create a new Supabase project (region near your schools).
2. Apply **all** SQL files in order:

   `supabase/migrations/001_*.sql` → `042_*.sql`

   Prefer Supabase CLI (`supabase db push`) or run each file in SQL Editor in numeric order.

3. Confirm no errors; see **[docs/PRODUCTION_SUPABASE_CHECKLIST.md](./docs/PRODUCTION_SUPABASE_CHECKLIST.md)** for RLS and cross-tenant tests.

### Auth (dev)

- Email provider enabled
- Disable “Confirm email” only for local testing
- Site URL: `http://localhost:3000` (add Vercel URL later)

---

## 3. Environment

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Never commit service role keys.

---

## 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000

### Smoke path

1. Sign up → create school  
2. Academic year, classes, subjects, teachers, students  
3. Attendance (including half-day)  
4. Fees: plan → bulk generate charges → collect → open receipt  
5. Exams: create → marks → lock/publish  
6. Teacher workspace: today’s periods  
7. Multi-school user: switch active school and confirm dashboards/actions follow the selected school  
8. Portal: link parent `user_id` → child dashboard + timetable  

---

## 5. Vercel deploy

1. Import GitHub repo  
2. Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`  
3. Supabase Auth → Site URL + redirect URLs = production domain  

---

## 6. Parent linking

```sql
UPDATE guardians
SET user_id = '<auth.users uuid>'
WHERE email = 'parent@example.com';
```

Parent opens `/portal`.

---

## Module keys (enable/disable)

`academics` · `fees` · `exams` · `communications` · `library` · `transport` · `assets` · `hr_payroll` · `health` · `visitors`

Server Actions and nav respect these flags.
