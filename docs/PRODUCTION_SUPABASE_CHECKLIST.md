# Production School Supabase Checklist

This is the highest-priority production gate. Application CI being green does **not** prove the database is production-ready.

## 1. Create a dedicated project

- Create a **new** Supabase project (do **not** reuse ClinicFlow or any other app DB).
- Region: closest to primary school users (e.g. `ap-south-1` for India).
- Enable point-in-time recovery / daily backups once on paid plan.
- Record project URL, anon key, service role key in a secure vault (never commit service role).

## 2. Apply migrations in order

From a clean database:

```bash
supabase link --project-ref <project-ref>
supabase db push
# or apply files 001 → 042 sequentially via SQL editor
```

Confirm:

- `001` … `042_active_school_context.sql` applied with **no duplicate numbers**
- No leftover objects from other apps

Key late migrations:

| # | Purpose |
|---|--------|
| 034 | Atomic payroll generation |
| 035 | Attendance half-day |
| 036 | Exam marks lock + publish |
| 037 | Bulk fee charges from plan |
| 038 | Published exam marks guard |
| 039 | Atomic fee adjustments |
| 040 | Salary history / effective-date payroll |
| 041 | Payment↔student + exam enrollment guards |
| 042 | Per-user active school context + RLS |
| 042 | Active school preference (multi-school users) |

## 3. Auth & storage

- [ ] Email auth enabled; production redirect URLs set
- [ ] Private storage for documents / certificates
- [ ] Storage policies scoped by school / role
- [ ] JWT / session settings reviewed

## 4. RLS & tenant isolation tests

Two test schools A and B:

- [ ] User in A cannot read B’s students/fees/exams (even with known UUIDs)
- [ ] Multi-school user: switcher only lists active memberships; preference cannot point at non-member school
- [ ] Teacher assignment / fee / payroll RPCs reject foreign `school_id`
- [ ] Communications cannot target other-school recipients
- [ ] Platform admin path separate and audited

## 5. Advisors & performance

- [ ] Security Advisor: clear critical/high
- [ ] Performance Advisor: indexes on attendance, fees, notifications
- [ ] Slow query logging on staging first

## 6. Seed & role matrix

- [ ] Demo school: Owner, Principal, Teacher, Accountant, Reception, Parent, Student
- [ ] Multi-school user with two memberships — switch and confirm data isolation
- [ ] Module enable/disable blocks UI **and** Server Actions

## 7. Backup / restore drill

- [ ] Backup → restore to throwaway project → RLS still holds

## 8. App wiring

- [ ] `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` / `APP_URL`
- [ ] Service role server-only if used
- [ ] Staging mirrors production migration set

## 9. End-to-end role proof

Run **[E2E_ROLE_SMOKE_TEST.md](./E2E_ROLE_SMOKE_TEST.md)** against the dedicated project and record the commit SHA/project ref used for the test.

## Sign-off

Only after this checklist is complete should schools depend on the system daily.
