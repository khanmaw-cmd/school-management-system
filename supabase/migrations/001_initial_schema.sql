create extension if not exists pgcrypto;

create type public.school_role as enum ('school_owner','principal','teacher','accountant','reception','parent','student');

create table public.schools (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 code text not null unique,
 phone text,
 email text,
 address text,
 created_at timestamptz not null default now()
);

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '',
 phone text,
 created_at timestamptz not null default now()
);

create table public.school_memberships (
 id uuid primary key default gen_random_uuid(),
 school_id uuid not null references public.schools(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 role public.school_role not null,
 active boolean not null default true,
 unique(school_id,user_id,role)
);

create table public.academic_years (
 id uuid primary key default gen_random_uuid(),
 school_id uuid not null references public.schools(id) on delete cascade,
 name text not null,
 starts_on date not null,
 ends_on date not null,
 active boolean not null default false
);

create table public.classes (
 id uuid primary key default gen_random_uuid(),
 school_id uuid not null references public.schools(id) on delete cascade,
 name text not null,
 sort_order integer not null default 0
);

create table public.sections (
 id uuid primary key default gen_random_uuid(),
 school_id uuid not null references public.schools(id) on delete cascade,
 class_id uuid not null references public.classes(id) on delete cascade,
 name text not null
);

create table public.students (
 id uuid primary key default gen_random_uuid(),
 school_id uuid not null references public.schools(id) on delete cascade,
 admission_no text not null,
 first_name text not null,
 last_name text not null default '',
 date_of_birth date,
 gender text,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(school_id,admission_no)
);

create table public.student_enrollments (
 id uuid primary key default gen_random_uuid(),
 school_id uuid not null references public.schools(id) on delete cascade,
 student_id uuid not null references public.students(id) on delete cascade,
 academic_year_id uuid not null references public.academic_years(id) on delete cascade,
 class_id uuid not null references public.classes(id),
 section_id uuid references public.sections(id),
 roll_no text,
 unique(student_id,academic_year_id)
);

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.school_memberships enable row level security;
alter table public.academic_years enable row level security;
alter table public.classes enable row level security;
alter table public.sections enable row level security;
alter table public.students enable row level security;
alter table public.student_enrollments enable row level security;

create or replace function public.is_school_member(target_school uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.school_memberships m where m.school_id=target_school and m.user_id=auth.uid() and m.active); $$;

create policy "profile self read" on public.profiles for select using (id=auth.uid());
create policy "members read school" on public.school_memberships for select using (user_id=auth.uid() or public.is_school_member(school_id));
create policy "schools members read" on public.schools for select using (public.is_school_member(id));
create policy "years members read" on public.academic_years for select using (public.is_school_member(school_id));
create policy "classes members read" on public.classes for select using (public.is_school_member(school_id));
create policy "sections members read" on public.sections for select using (public.is_school_member(school_id));
create policy "students members read" on public.students for select using (public.is_school_member(school_id));
create policy "enrollments members read" on public.student_enrollments for select using (public.is_school_member(school_id));
