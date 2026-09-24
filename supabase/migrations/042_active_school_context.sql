-- User-selectable active school context for users with multiple memberships.
create table if not exists public.user_school_preferences(
 user_id uuid primary key references auth.users(id) on delete cascade,
 school_id uuid not null references public.schools(id) on delete cascade,
 updated_at timestamptz not null default now()
);
alter table public.user_school_preferences enable row level security;
create policy "read own school preference" on public.user_school_preferences for select to authenticated using(user_id=(select auth.uid()));
create policy "set own school preference" on public.user_school_preferences for insert to authenticated with check(user_id=(select auth.uid()) and public.is_school_member(school_id));
create policy "update own school preference" on public.user_school_preferences for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and public.is_school_member(school_id));

create index if not exists user_school_preferences_school_idx on public.user_school_preferences(school_id);
