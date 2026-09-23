-- Per-user notification read state, including student-linked family notifications.
create table public.notification_reads(
 notification_id uuid not null references public.notifications(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 read_at timestamptz not null default now(),
 primary key(notification_id,user_id)
);
alter table public.notification_reads enable row level security;
create policy "recipient read own notification state" on public.notification_reads for select to authenticated using(user_id=(select auth.uid()));
create policy "recipient create own notification state" on public.notification_reads for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.notifications n where n.id=notification_id and (n.user_id=(select auth.uid()) or (n.student_id is not null and public.can_view_student(n.student_id)))));
create policy "recipient update own notification state" on public.notification_reads for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create index notification_reads_user_idx on public.notification_reads(user_id,read_at desc);
