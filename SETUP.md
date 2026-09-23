# School Management System — Setup & Deploy Guide

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm or pnpm
- Free accounts: [Supabase](https://supabase.com), [Vercel](https://vercel.com), [GitHub](https://github.com)

---

## 1. Clone & install

```bash
git clone https://github.com/khanmaw-cmd/school-management-system.git
cd school-management-system
npm install
```

---

## 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Note the **Project URL** and **anon public** key (Settings → API)
3. Open **SQL Editor** → New query
4. Paste the **entire** contents of:

   `supabase/migrations/001_initial_schema.sql`

5. Run the query (should complete without errors)

### Auth settings (recommended for testing)

- Authentication → Providers → Email: enable
- Authentication → Settings:
  - Disable **Confirm email** for local/dev (enable in production)
  - Site URL: `http://localhost:3000` (and later your Vercel URL)

---

## 3. Environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Never commit** `.env.local` or service role keys.

---

## 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### First-time flow

1. **Sign up** with your email  
2. **School Setup** → create school (you become `school_owner`)  
3. **Academic Years** → create e.g. `2025-26` and set current  
4. **Classes** → add classes + sections  
5. **Subjects** → Maths, English, etc.  
6. **Teachers** → add + allocate  
7. **Students** → register (with guardian)  
8. **Attendance / Fees / Exams / Notices** as needed  
9. **Parent portal**: `/portal` (link guardian `user_id` in Supabase)

---

## 5. Deploy to Vercel

1. Push repo to GitHub
2. [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`
4. Deploy
5. Supabase Auth → Site URL + Redirect URLs = your Vercel domain

---

## 6. Parent portal linking

```sql
UPDATE guardians
SET user_id = '<uuid-from-auth.users>'
WHERE email = 'parent@example.com';
```

Parent opens: `/portal`

---

## Modules included

Auth · Multi-school · School setup · Dashboard · Classes/Sections · Subjects · Academic years · Teachers + allocation · Students · Attendance · Fees · Exams + report cards · Notices · Parent portal
