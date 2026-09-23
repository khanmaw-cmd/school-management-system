# School Management System (SMS)

Modern **multi-school SaaS** for admissions, academics, fees, exams, attendance, notices, and parent communication.

**Stack:** Next.js 16 · TypeScript · Tailwind · Supabase (Auth + Postgres + RLS) · Vercel

---

## Features

| Area | Capabilities |
|------|----------------|
| **Multi-tenant** | One platform, many schools (`school_id` + RLS) |
| **Roles** | Platform admin → Owner → Principal → Teacher → Accountant → Reception → Parent → Student |
| **Academics** | Years, classes, sections, subjects, teacher allocation |
| **Students** | Admission, guardians, detail profile |
| **Attendance** | Class-wise daily marking |
| **Fees** | Structures, invoices, payments, receipts |
| **Exams** | Create exams, enter marks, class report cards |
| **Notices** | Audience targeting, pin, expiry |
| **Parent portal** | `/portal` — attendance, fees, results, notices |

---

## Quick start

```bash
git clone https://github.com/khanmaw-cmd/school-management-system.git
cd school-management-system
npm install
cp .env.example .env.local
# Fill Supabase URL + anon key
npm run dev
```

**Full setup (Supabase migration, Vercel deploy, parent linking):** see **[SETUP.md](./SETUP.md)**

---

## First-time usage

1. Sign up → **School Setup** (create school)  
2. **Academic Years** → create current year  
3. **Classes** → sections → **Subjects**  
4. **Teachers** → allocate to classes  
5. **Students** → register  
6. Attendance · Fees · Exams · Notices  
7. Parents: link guardian `user_id` → open `/portal`

---

## License

Private / use as needed for your schools.
