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
# Using Supabase CLI (recommended)
supabase link --project-ref <project-ref>
supabase db push
# or apply files 001 → 035 sequentially via SQL editor / migration runner
```

Confirm all of:

- `001_initial_schema.sql` … `035_attendance_half_day.sql` applied with no errors
- No leftover objects from other apps
- `supabase migration list` (or equivalent) shows 001–035 as applied

## 3. Auth & storage

- [ ] Email auth enabled; confirm redirect URLs for production domain
- [ ] Private storage buckets for student documents / certificates
- [ ] Storage policies scoped by `school_id` / role helpers
- [ ] JWT expiry and refresh settings reviewed

## 4. RLS & tenant isolation tests

Run (manually or via script) against two test schools A and B:

- [ ] User in school A cannot `SELECT` students/fees/exams of school B (even with known UUIDs)
- [ ] Teacher assignment RPC rejects cross-school staff/class IDs
- [ ] Fee payment / payroll RPCs reject foreign `school_id`
- [ ] Communications delivery cannot target other-school recipients
- [ ] Platform admin path is separate and audited

## 5. Advisors & performance

In Supabase dashboard:

- [ ] Security Advisor: resolve critical/high findings
- [ ] Performance Advisor: add missing indexes called out for hot paths (attendance, fees, notifications)
- [ ] Enable slow query logging in staging first

## 6. Seed & role matrix

- [ ] Seed one demo school with Owner, Principal, Teacher, Accountant, Reception, Parent, Student
- [ ] Walk each role dashboard and one critical write path
- [ ] Confirm module enable/disable blocks UI **and** Server Actions

## 7. Backup / restore drill

- [ ] Take a backup
- [ ] Restore into a throwaway project
- [ ] Confirm migrations + RLS still hold after restore

## 8. App wiring

- [ ] Production env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Service role only on server (if used) — never exposed to client
- [ ] Staging environment mirrors production migration set

## Sign-off

Only after this checklist is complete should schools be invited to depend on the system daily.
