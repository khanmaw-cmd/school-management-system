# School Management System (SMS)

Modern **multi-school SaaS ERP** for admissions, academics, fees, exams, HR/payroll, transport, library, communications, and parent portals.

**Stack:** Next.js 16 · TypeScript · Tailwind · Supabase (Auth + Postgres + RLS) · Vercel  
**Migrations:** `001` → `042` in `supabase/migrations/`  
**Status:** Source V1 complete when tip CI is green — production needs dedicated Supabase (not ClinicFlow).

---

## Feature map

| Area | Capabilities |
|------|----------------|
| **Multi-tenant** | `school_id` + RLS + module enable/disable + **active-school switcher** |
| **Roles** | Platform admin · Owner · Principal · Teacher · Accountant · Reception · Parent · Student |
| **Academics** | Years, classes, sections, subjects, atomic teacher assignment, collision-safe timetable |
| **Students** | Admission, guardians, documents, health (privacy hardened) |
| **Attendance** | Present / absent / late / leave / half-day |
| **Fees** | Plans, bulk charges, atomic collection & adjustments, receipts, ledger, dues |
| **Exams** | Marks entry, lock, publish, grades, report cards, admit cards |
| **HR / Payroll** | Salary history, atomic payroll generation, finalize, payslips |
| **Ops** | Library, transport, assets, visitors, leave, calendar |
| **Comms** | Atomic communications, notifications with read-state |
| **Portals** | Parent/student: attendance, fees, homework, timetable, results, notices |
| **Teacher** | Daily workspace — periods, attendance, homework |
| **UX** | Responsive admin, command palette, design system, dark/light theme |

---

## Quick start

```bash
git clone https://github.com/khanmaw-cmd/school-management-system.git
cd school-management-system
npm install
# Recommended: commit package-lock.json for CI
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

| Doc | Purpose |
|-----|--------|
| [SETUP.md](./SETUP.md) | Local + Vercel setup |
| [docs/LAUNCH.md](./docs/LAUNCH.md) | **Pilot launch gates** |
| [docs/PRODUCTION_SUPABASE_CHECKLIST.md](./docs/PRODUCTION_SUPABASE_CHECKLIST.md) | Dedicated DB |
| [docs/E2E_ROLE_SMOKE_TEST.md](./docs/E2E_ROLE_SMOKE_TEST.md) | Role + tenant proof |

---

## First-time usage

1. Sign up → School Setup (`school_owner`)
2. Academic years → classes → subjects → teachers
3. Students + guardians
4. Attendance · Fees · Exams (lock → publish)
5. Parent: link guardian `user_id` → `/portal`
6. Multi-school users: **Switch school** in admin header

---

## Production boundary

- Apply migrations **001–042** only on a **dedicated** School Supabase project.
- Never reuse ClinicFlow or another product database.
- Phase-2: UPI/gateway, WhatsApp/SMS, multi-campus.

---

## License

Private / use as needed for your schools.
