create type public.attendance_status as enum ('present','absent','late','leave');
create table public.student_attendance (
 id uuid primary key default gen_random_uuid(),
 school_id uuid not null references public.schools(id) on delete cascade,
 academic_year_id uuid not null references public.academic_years(id) on delete cascade,
 student_id uuid not null references public.students(id) on delete cascade,
 class_id uuid not null references public.classes(id) on delete cascade,
 section_id uuid references public.sections(id) on delete set null,
 attendance_date date not null,
 status public.attendance_status not null default 'present',
 remarks text,
 marked_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(student_id,attendance_date)
);
create index student_attendance_school_date_idx on public.student_attendance(school_id,attendance_date);
alter table public.student_attendance enable row level security;
create policy "members read attendance" on public.student_attendance for select using(public.is_school_member(school_id));
create policy "manage attendance" on public.student_attendance for all using(public.is_school_member(school_id)) with check(public.is_school_member(school_id));