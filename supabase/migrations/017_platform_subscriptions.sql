-- Platform administration and subscription foundation.
create table public.platform_admins(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
create table public.subscription_plans(id uuid primary key default gen_random_uuid(),code text not null unique,name text not null,monthly_price numeric(12,2) not null default 0 check(monthly_price>=0),student_limit integer check(student_limit is null or student_limit>0),staff_limit integer check(staff_limit is null or staff_limit>0),active boolean not null default true,features jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
create table public.school_subscriptions(id uuid primary key default gen_random_uuid(),school_id uuid not null unique references public.schools(id) on delete cascade,plan_id uuid not null references public.subscription_plans(id),status text not null default 'trial' check(status in('trial','active','past_due','suspended','cancelled')),trial_ends_at timestamptz,current_period_starts_at timestamptz,current_period_ends_at timestamptz,notes text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.platform_admins enable row level security;alter table public.subscription_plans enable row level security;alter table public.school_subscriptions enable row level security;
create or replace function public.is_platform_admin() returns boolean language sql stable security definer set search_path=public as $$select (select auth.uid()) is not null and exists(select 1 from public.platform_admins p where p.user_id=(select auth.uid()));$$;
revoke all on function public.is_platform_admin() from public,anon;grant execute on function public.is_platform_admin() to authenticated;
create policy "platform admin self" on public.platform_admins for select to authenticated using(user_id=(select auth.uid()) and public.is_platform_admin());
create policy "plans authenticated read" on public.subscription_plans for select to authenticated using(active=true or public.is_platform_admin());
create policy "platform admins manage plans" on public.subscription_plans for all to authenticated using(public.is_platform_admin()) with check(public.is_platform_admin());
create policy "school subscription read" on public.school_subscriptions for select to authenticated using(public.is_platform_admin() or public.has_school_role(school_id,array['school_owner','principal']::public.school_role[]));
create policy "platform admins manage subscriptions" on public.school_subscriptions for all to authenticated using(public.is_platform_admin()) with check(public.is_platform_admin());
insert into public.subscription_plans(code,name,monthly_price,student_limit,staff_limit,features) values
('starter','Starter',999,300,30,'{"attendance":true,"fees":true,"exams":true,"portal":true}'::jsonb),
('growth','Growth',1999,1000,100,'{"attendance":true,"fees":true,"exams":true,"portal":true,"communications":true,"documents":true}'::jsonb),
('enterprise','Enterprise',4999,null,null,'{"all_core":true,"priority_support":true,"future_integrations":true}'::jsonb)
on conflict(code) do nothing;
-- Platform-level read access is deliberately separate from tenant membership.
create policy "platform admins read schools" on public.schools for select to authenticated using(public.is_platform_admin());
create policy "platform admins read students" on public.students for select to authenticated using(public.is_platform_admin());
create policy "platform admins read memberships" on public.school_memberships for select to authenticated using(public.is_platform_admin());
create policy "platform admins read staff" on public.staff for select to authenticated using(public.is_platform_admin());
