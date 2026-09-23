# School Management System (SMS)

Modern, multi-school SaaS platform covering the full journey from **admission → academics → fees → exams → communication → reports**.

**Stack:** Next.js 16 + TypeScript + Tailwind CSS + Shadcn UI · Supabase (PostgreSQL + Auth + Storage) · Vercel

## Project Goals

- Multi-tenant (multi-school) from day one
- Role-based access control (Platform Admin → School Owner → Principal → Teacher → Accountant → Reception → Parent → Student)
- Mobile-friendly admin + parent/student portals
- Clean, scalable architecture ready for AI/MCP layer later

## Phases

### Phase 1 — Foundation (Current Focus)
1. Project setup & database schema
2. Secure authentication (Supabase Auth)
3. Multi-school architecture
4. Role-based permissions
5. School profile, academic year, classes, sections, subjects
6. Staff & teacher management

**First build target:** Login → School Setup → Admin Dashboard → Students → Classes & Sections → Teachers → Attendance

### Phase 2 — Student Management
Admission/enquiry, registration, unique admission numbers, parent/guardian details, documents, class assignment, promotion/transfer, ID cards.

### Phase 3 — Daily Operations
Attendance (students + staff), timetable, homework, notices, leave, calendar.

### Phase 4 — Fees & Accounts
Fee structures, payments, receipts, reminders, expenses, reports. (Later: UPI/Indian gateways)

### Phase 5 — Exams & Academics
Exam setup, marks entry, grading, report cards (PDF), remarks.

### Phase 6 — Parent & Student Portal
Dashboards for attendance, fees, results, notices, communication.

### Phase 7 — Advanced
Transport, library, inventory, hostel, certificates, QR, notifications, audit logs.

### Phase 8 — AI Layer
AI School Assistant + controlled MCP tools for authorized actions.

## Multi-School Architecture

Every core table includes `school_id` (UUID).  
Platform-level tables (e.g. platform_admins) have no school_id.  
Row Level Security (RLS) in Supabase enforces isolation.

## Getting Started

```bash
# 1. Clone
git clone https://github.com/khanmaw-cmd/school-management-system.git
cd school-management-system

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Fill SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 4. Run
npm run dev
```

## Database Schema (Phase 1)

See `supabase/migrations/001_initial_schema.sql`.

## Roles Hierarchy

| Role              | Scope          | Key Permissions                          |
|-------------------|----------------|------------------------------------------|
| Platform Admin    | All schools    | Manage schools, billing, platform users  |
| School Owner      | One school     | Full control of school                   |
| Principal         | One school     | Academics, staff, reports                |
| Teacher           | Assigned classes | Attendance, marks, homework            |
| Accountant        | One school     | Fees, payments, expenses                 |
| Reception         | One school     | Enquiries, admissions, visitors          |
| Parent            | Linked students| View attendance, fees, results           |
| Student           | Self           | View own data                            |

---

Built with ❤️ for modern schools.
