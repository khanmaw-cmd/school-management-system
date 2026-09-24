# End-to-End Role Smoke Test

Run this checklist only against a dedicated School Supabase project after migrations 001–042 apply cleanly.

## Tenant fixtures
Create School A and School B. Create one Owner, Principal, Teacher, Accountant, Reception, Parent and Student path for School A. Give one test user active memberships in both schools.

## Owner / Principal
- Sign in and confirm the selected school name.
- Create academic year, class, section and subject.
- Create/link teacher and student.
- Assign teacher to the class/subject.
- Create timetable and confirm collision protection.
- Disable an optional module and confirm both navigation and its protected route/action are blocked.
- Review audit log after writes.

## Multi-school isolation
- Switch from School A to School B and confirm dashboard data changes to B.
- Refresh/sign in again and confirm the selected school persists.
- Switch back to A.
- With known School B UUIDs, attempt School A reads/writes for students, fees, exams and staff. Every cross-school operation must be denied or return no rows.
- Confirm a user cannot set user_school_preferences to a school without an active membership.

## Teacher
- Open Teacher Workspace and confirm only linked schedule/assignments.
- Take attendance for an assigned class.
- Publish homework for an assigned class/subject.
- Attempt homework for an unassigned class/subject; it must fail.
- Enter marks only where authorized.
- Confirm published-exam marks cannot be changed.

## Accountant
- Open Accountant Workspace.
- Create fee plan and bulk-generate charges.
- Collect a partial payment and confirm balance.
- Open/print the generated receipt.
- Add a valid concession/waiver and confirm balance/status.
- Attempt an adjustment above outstanding balance; it must fail.
- Confirm dues, ledger and monthly report agree.

## Reception
- Search student by admission number/name.
- Create/follow an admission enquiry.
- Use visitor/front-office workflow.
- Open portal-link and notice workflows allowed to Reception.
- Confirm Reception cannot access payroll or restricted finance/exam administration.

## Parent / Student
- Open linked student portal.
- Confirm attendance, timetable, homework, notices, fee dues/payments and only published results.
- Confirm another school's student UUID cannot be viewed.

## Payroll
- Save effective salary structure.
- Generate payroll draft.
- Regenerate draft and confirm stale draft items are replaced.
- Finalize; confirm finalized payroll cannot be regenerated.
- Record payment and open payslip.

## Final evidence
Record: commit SHA, Supabase project ref, migration range, test date, tester, failures/fixes, and Security/Performance Advisor results. Do not mark production-ready until every critical isolation and payment/exam/payroll test passes.
