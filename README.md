# School Management System (SMS)

Modern **multi-school SaaS ERP** for admissions, academics, fees, exams, HR/payroll, transport, library, communications, and parent portals.

**Stack:** Next.js 16 · TypeScript · Tailwind · Supabase (Auth + Postgres + RLS) · Vercel

**Migrations:** `001` → `037` in `supabase/migrations/`

---

## Feature map

| Area | Capabilities |
|------|----------------|
| **Multi-tenant** | `school_id` + RLS + module enable/disable |
| **Roles** | Platform admin · Owner · Principal · Teacher · Accountant · Reception · Parent · Student |
| **Academics** | Years, classes, sections, subjects, teacher assignment (atomic), timetable (collision-safe) |
| **Students** | Admission, guardians, documents, health (privacy hardened) |
| **Attendance** | Present / absent / late / leave / half-day |
| **Fees** | Plans, bulk charges, concessions, atomic collection, receipts, ledger, dues |
| **Exams** | Subjects, marks entry, **marks lock**, publish workflow, grades, report cards, admit cards |
| **HR / Payroll** | Salary structures, **atomic payroll generation**, finalize, individual payments, payslips |
| **Ops** | Library, transport, assets, visitors, leave, staff attendance, calendar |
| **Comms** | Atomic in-app communications, notifications with read-state |
| **Portals** | Parent/student: attendance, fees, homework, timetable, results, notices |
| **Teacher** | Daily workspace — today’s periods, attendance shortcuts, homework |
| **Platform** | Schools, plans/subscriptions foundation, audit log |

---

## Quick start

```bash
git clone https://github.com/khanmaw-cmd/school-management-system.git
cd school-management-system
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

**Full setup (all migrations, deploy, parent linking):** see **[SETUP.md](./SETUP.md)**  
**Production database gate:** see **[docs/PRODUCTION_SUPABASE_CHECKLIST.md](./docs/PRODUCTION_SUPABASE_CHECKLIST.md)**

---

## First-time usage

1. Sign up → **School Setup** (you become `school_owner`)
2. Academic Years → Classes → Sections → Subjects
3. Teachers → assign subjects; Timetable
4. Students + guardians
5. Attendance · Fees (plan → bulk charges → collect) · Exams (enter → lock → publish)
6. Parent: link guardian `user_id` → `/portal`
7. Teacher: open **Teacher Workspace** for today’s periods

---

## Production notes

- Apply migrations **001–037** on a **dedicated** School Supabase project (not shared with other apps).
- Prefer committing `package-lock.json` and using `npm ci` in CI.
- Online UPI/gateway, WhatsApp/SMS providers, and multi-campus are intentional Phase-2 items.

---

## License

Private / use as needed for your schools.
